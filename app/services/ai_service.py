# ── FILE: backend/app/services/ai_service.py ──
import os
import re
import json
from dotenv import load_dotenv
import httpx
from fastapi import HTTPException

from app.schemas import ChatResponse, RecommendResponse, InstanceRecommendation, InstanceOut, RecommendRequest

load_dotenv()

# ── OpenRouter config ──────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
OPENROUTER_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "CloudPrice SaaS Comparator",
    "Content-Type": "application/json",
}

# ── Ollama config ──────────────────────────────────────────
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODELS = ["gpt-oss:120b-cloud", "llama3.2", "mistral", "phi3"]
DEFAULT_OLLAMA_MODEL = "gpt-oss:120b-cloud"

# ── Default OpenRouter model ───────────────────────────────
DEFAULT_OPENROUTER_MODEL = "mistralai/mistral-7b-instruct"

FALLBACK_MODELS = [
    {"id": "openai/gpt-4o", "name": "GPT-4o (OpenAI)", "context_length": 128000},
    {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini (OpenAI)", "context_length": 128000},
    {"id": "openai/gpt-3.5-turbo", "name": "GPT-3.5 Turbo (OpenAI)", "context_length": 16385},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "context_length": 200000},
    {"id": "anthropic/claude-3-haiku", "name": "Claude 3 Haiku", "context_length": 200000},
    {"id": "google/gemini-pro-1.5", "name": "Gemini Pro 1.5 (Google)", "context_length": 1000000},
    {"id": "google/gemini-flash-1.5", "name": "Gemini Flash 1.5 (Google)", "context_length": 1000000},
    {"id": "meta-llama/llama-3.1-70b-instruct", "name": "Llama 3.1 70B (Meta)", "context_length": 131072},
    {"id": "meta-llama/llama-3.1-8b-instruct", "name": "Llama 3.1 8B (Meta)", "context_length": 131072},
    {"id": "mistralai/mistral-large", "name": "Mistral Large", "context_length": 128000},
    {"id": "mistralai/mistral-7b-instruct", "name": "Mistral 7B Instruct", "context_length": 32768},
    {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1", "context_length": 65536},
    {"id": "deepseek/deepseek-chat", "name": "DeepSeek Chat", "context_length": 65536},
    {"id": "cohere/command-r-plus", "name": "Command R+ (Cohere)", "context_length": 128000},
    {"id": "perplexity/llama-3.1-sonar-large", "name": "Sonar Large (Perplexity)", "context_length": 127072},
]

SYSTEM_CHAT = (
    "You are a cloud cost optimization expert helping users choose the best "
    "cloud instance for their workload. You have access to real-time pricing "
    "data from multiple providers. When a user describes their needs, analyze "
    "their requirements and recommend the most cost-effective instance. "
    "You can suggest filters by returning a JSON block at the end of your "
    "response in this exact format if relevant:\n"
    "<filters>{ \"min_cpu\": 4, \"min_ram\": 16 }</filters>\n"
)

SYSTEM_RECOMMEND = """You are a cloud infrastructure expert and cost optimization advisor.
A user needs help choosing the best cloud server for their workload.
You will be given:
  - Their requirements (workload type, budget, CPU/RAM needs, description)
  - A full list of available instances with real pricing data

Your job:
  1. Analyze their requirements carefully.
  2. Select the TOP 3 best matching instances from the provided list.
  3. For each pick assign a match_score (0-100), verdict (exactly one of: "Best Value", "Best Performance", "Most Balanced"),
     3 pros, 2 cons, and a one-sentence use_case_fit explanation.
  4. Write a short summary and rephrase what you understood in requirements_understood.

IMPORTANT: Reply with ONLY a valid JSON object. No markdown, no ``` code blocks, no text before or after the JSON.
Use exactly this structure (double quotes, no trailing commas):
{
  "recommendations": [
    {
      "instance_id": <number from the instances list>,
      "match_score": <0-100>,
      "verdict": "Best Value" or "Best Performance" or "Most Balanced",
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2"],
      "use_case_fit": "one sentence"
    }
  ],
  "summary": "short summary",
  "requirements_understood": "what you understood"
}"""

JSON_PREFIX = (
    "You must respond with ONLY a valid JSON object. No other text, no markdown, no code fences. "
    "Start your response with { and end with }. Use double quotes for all strings.\n\n"
)


def fetch_openrouter_models() -> list[dict]:
    """Fetch available models from OpenRouter API. Returns list of {id, name, context_length}. On error returns FALLBACK_MODELS."""
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.get("https://openrouter.ai/api/v1/models")
            r.raise_for_status()
        data = r.json()
        models = data.get("data") or []
        out = []
        for m in models:
            mid = m.get("id") or m.get("name") or ""
            name = m.get("name") or mid
            ctx = m.get("context_length") or m.get("context_length_limit") or 0
            out.append({"id": mid, "name": name, "context_length": ctx})
        out.sort(key=lambda x: (x.get("name") or "").lower())
        return out
    except Exception:
        return FALLBACK_MODELS


def call_openrouter(
    model: str,
    system_prompt: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    if not (OPENROUTER_API_KEY or "").strip():
        raise HTTPException(
            status_code=503,
            detail="OPENROUTER_API_KEY not set in .env. Get your key at https://openrouter.ai/keys",
        )
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=payload,
                headers=OPENROUTER_HEADERS,
            )
            r.raise_for_status()
        data = r.json()
        choices = data.get("choices") or []
        if not choices:
            raise HTTPException(status_code=500, detail="OpenRouter returned no choices")
        msg = choices[0].get("message") or {}
        content = msg.get("content") or ""
        return content.strip()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=503, detail=str(e.response.text)[:500]) from e
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


def call_ollama(model: str, system_prompt: str, messages: list[dict]) -> str:
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    payload = {"model": model, "messages": full_messages, "stream": False}
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            r.raise_for_status()
        data = r.json()
        msg = data.get("message") or {}
        content = msg.get("content") or ""
        return content.strip()
    except (httpx.HTTPError, httpx.RequestError, KeyError) as e:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama is not running or model '{model}' not pulled. Run: ollama pull {model}",
        ) from e


def get_ai_advice(
    messages: list[dict],
    context: str = "",
    provider: str = "openrouter",
    model: str = DEFAULT_OPENROUTER_MODEL,
) -> ChatResponse:
    system_prompt = (
        "You are a cloud cost expert. Help the user choose instances. "
        "You can suggest filters by returning <filters>{}</filters> with JSON inside.\n"
        f"Context: {context or 'None'}"
    )
    if provider == "ollama":
        system_prompt = (
            "You are a cloud cost expert. Help the user choose instances. "
            "You can suggest filters by returning <filters>{}</filters> with JSON inside. "
            "Respond in plain text.\n"
            f"Context: {context or 'None'}"
        )
        raw = call_ollama(model, system_prompt, messages)
    else:
        raw = call_openrouter(model, system_prompt, messages, temperature=0.7, max_tokens=1024)
    suggested_filters = None
    match = re.search(r"<filters>\s*(\{.*?\})\s*</filters>", raw, re.DOTALL)
    if match:
        try:
            suggested_filters = json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
        raw = re.sub(r"\s*<filters>.*?</filters>\s*", "", raw, flags=re.DOTALL)
    return ChatResponse(reply=raw.strip(), suggested_filters=suggested_filters)


def _extract_json_from_text(text: str) -> dict | None:
    """Extract a JSON object from model output; tolerate markdown, trailing commas, and extra text."""
    text = text.strip()
    # Remove markdown code blocks (optional language tag)
    text = re.sub(r"^```(?:json|JSON)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    # Find the outermost { ... }
    first = text.find("{")
    if first == -1:
        return None
    depth = 0
    for i in range(first, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                candidate = text[first : i + 1]
                # Fix common LLM mistakes: trailing commas before ] or }
                candidate = re.sub(r",\s*]", "]", candidate)
                candidate = re.sub(r",\s*}", "}", candidate)
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass
                break
    # Fallback: try whole string or first { to last }
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    last = text.rfind("}")
    if last != -1 and last > first:
        candidate = text[first : last + 1]
        candidate = re.sub(r",\s*]", "]", candidate)
        candidate = re.sub(r",\s*}", "}", candidate)
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
    return None


def get_recommendations(
    request: RecommendRequest,
    instances: list,
    provider: str = "openrouter",
    model: str = DEFAULT_OPENROUTER_MODEL,
) -> RecommendResponse:
    instance_list = []
    for inst in instances:
        monthly = inst.hourly_price * 24 * 30
        instance_list.append({
            "id": inst.id,
            "name": inst.name,
            "provider": inst.provider.name if inst.provider else "Unknown",
            "cpu": inst.cpu,
            "ram": inst.ram,
            "storage": inst.storage,
            "region": inst.region,
            "monthly_price": round(monthly, 2),
        })
    instances_json = json.dumps(instance_list)

    budget_str = (
        f"${request.max_monthly_budget}/month"
        if request.max_monthly_budget and request.max_monthly_budget > 0
        else "No limit (0 = unlimited)"
    )
    user_message = f"""Workload: {request.workload_type}
Budget: {budget_str}
Min CPU: {request.min_cpu} cores, Min RAM: {request.min_ram} GB
Provider filter: {request.provider_ids if request.provider_ids else 'All providers'}
Additional context: {request.natural_language or 'None'}

Available instances (JSON):
{instances_json}"""

    system_prompt = JSON_PREFIX + SYSTEM_RECOMMEND

    if provider == "ollama":
        raw = call_ollama(model, system_prompt, [{"role": "user", "content": user_message}])
    else:
        raw = call_openrouter(model, system_prompt, [{"role": "user", "content": user_message}], temperature=0.3, max_tokens=2048)

    data = _extract_json_from_text(raw)
    if data is None:
        return RecommendResponse(
            recommendations=[],
            summary="Model returned unexpected format. Try a different model — GPT-4o and Claude 3.5 are most reliable for structured output.",
            requirements_understood="",
        )

    # Accept both "recommendations" and "recommendation"; normalize to list of dicts
    recs = data.get("recommendations") or data.get("recommendation")
    if isinstance(recs, dict):
        recs = [recs]
    recs = (recs or [])[:3]

    id_to_instance = {inst.id: inst for inst in instances}
    recommendations_out = []
    for rec in recs:
        if not isinstance(rec, dict):
            continue
        # Accept instance_id or instanceId; coerce to int (LLMs sometimes return string)
        inst_id_raw = rec.get("instance_id") or rec.get("instanceId")
        if inst_id_raw is None:
            continue
        try:
            inst_id = int(inst_id_raw)
        except (TypeError, ValueError):
            continue
        inst = id_to_instance.get(inst_id)
        if not inst:
            continue
        instance_out = InstanceOut.model_validate(inst)
        # Normalize verdict to one of the three allowed values
        verdict = rec.get("verdict", "Most Balanced")
        if verdict not in ("Best Value", "Best Performance", "Most Balanced"):
            verdict = "Most Balanced"
        recommendations_out.append(
            InstanceRecommendation(
                instance=instance_out,
                match_score=float(rec.get("match_score", 0)),
                verdict=verdict,
                pros=(rec.get("pros") or [])[:3] if isinstance(rec.get("pros"), list) else [],
                cons=(rec.get("cons") or [])[:2] if isinstance(rec.get("cons"), list) else [],
                use_case_fit=str(rec.get("use_case_fit", ""))[:500],
            )
        )

    return RecommendResponse(
        recommendations=recommendations_out,
        summary=str(data.get("summary", ""))[:2000],
        requirements_understood=str(data.get("requirements_understood", ""))[:2000],
    )
