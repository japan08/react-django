// ── FILE: frontend/src/api.js ──
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

export async function fetchProviders() {
  const { data } = await axios.get(`${BASE_URL}/providers`)
  return data
}

export async function fetchInstances(filters = {}) {
  const params = new URLSearchParams()
  if (filters.min_cpu != null) params.set('min_cpu', filters.min_cpu)
  if (filters.min_ram != null) params.set('min_ram', filters.min_ram)
  if (filters.provider_id != null) params.set('provider_id', filters.provider_id)
  if (filters.region) params.set('region', filters.region)
  if (filters.max_monthly_price != null) params.set('max_monthly_price', filters.max_monthly_price)
  const { data } = await axios.get(`${BASE_URL}/instances?${params.toString()}`)
  return data
}

export async function fetchInstanceHistory(id) {
  const { data } = await axios.get(`${BASE_URL}/instances/${id}/history`)
  return data
}

export async function fetchAnalyticsSummary() {
  const { data } = await axios.get(`${BASE_URL}/analytics/summary`)
  return data
}

export async function fetchForecast(instanceId) {
  const { data } = await axios.get(`${BASE_URL}/analytics/forecast/${instanceId}`)
  return data
}

export async function saveComparison(name, instanceIds) {
  const { data } = await axios.post(`${BASE_URL}/comparisons`, { name, instance_ids: instanceIds })
  return data
}

export async function fetchSavedComparisons() {
  const { data } = await axios.get(`${BASE_URL}/comparisons`)
  return data
}

export async function sendChatMessage(messages, context = '', provider = 'openrouter', model = 'mistralai/mistral-7b-instruct') {
  const headers = {
    'X-AI-Provider': provider,
    'X-AI-Model': model,
  }
  const { data } = await axios.post(
    `${BASE_URL}/ai/chat`,
    {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      context: context || undefined,
    },
    { headers }
  )
  return data
}

export function getRecommendations(payload, provider = 'openrouter', model = 'mistralai/mistral-7b-instruct') {
  const headers = {
    'X-AI-Provider': provider,
    'X-AI-Model': model,
  }
  return axios.post(`${BASE_URL}/recommend`, payload, { headers }).then((r) => r.data)
}

export async function fetchOpenRouterModels() {
  const { data } = await axios.get(`${BASE_URL}/admin/openrouter-models`)
  return data
}

export async function triggerScrape(providerName = null) {
  const { data } = await axios.post(`${BASE_URL}/admin/scrape`, providerName != null ? { provider: providerName } : {})
  return data
}

export async function fetchScrapeLogs(providerName = null) {
  const url = providerName != null
    ? `${BASE_URL}/admin/scrape-logs?provider=${encodeURIComponent(providerName)}`
    : `${BASE_URL}/admin/scrape-logs`
  const { data } = await axios.get(url)
  return data
}

// ── Automate / Quick Recommend ─────────────────────────────────────────────

export async function submitAutomateRequirements(payload) {
  const { data } = await axios.post(`${BASE_URL}/automate/requirements`, payload)
  return data
}

export async function refineAutomateRecommendation(payload) {
  const { data } = await axios.post(`${BASE_URL}/automate/refine`, payload)
  return data
}

export async function getAutomateRecommendation(id) {
  const { data } = await axios.get(`${BASE_URL}/automate/recommendations/${id}`)
  return data
}
