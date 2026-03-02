"""
Real pricing data from provider APIs (no scraping).
Use these when available; fall back to scraper fallbacks on failure.
"""

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

TIMEOUT = 45.0
HEADERS = {"User-Agent": "CloudPrice/2.0 (Pricing Comparator)"}

# Azure VM armSkuName / skuName -> (cpu, ram_gb, storage_gb). Ram/storage 0 = unknown.
AZURE_SKU_SPECS: dict[str, tuple[float, float, int]] = {
    "Standard_B1s": (1, 1, 4),
    "Standard_B1ms": (1, 2, 4),
    "Standard_B2s": (2, 4, 8),
    "Standard_B2ms": (2, 8, 16),
    "Standard_B4ms": (4, 16, 32),
    "Standard_D2s_v3": (2, 8, 16),
    "Standard_D4s_v3": (4, 16, 32),
    "Standard_D8s_v3": (8, 32, 64),
    "Standard_E2s_v3": (2, 16, 32),
    "Standard_E4s_v3": (4, 32, 64),
    "Standard_E8s_v3": (8, 64, 128),
    "Standard_F2s_v2": (2, 4, 16),
    "Standard_F4s_v2": (4, 8, 32),
    "Standard_F8s_v2": (8, 16, 64),
}


def _make_record(
    provider_name: str,
    instance_name: str,
    cpu: float,
    ram: float,
    storage: int,
    region: str,
    hourly_price: float,
) -> dict[str, Any]:
    return {
        "provider_name": provider_name,
        "instance_name": instance_name,
        "cpu": cpu,
        "ram": ram,
        "storage": storage,
        "region": region,
        "hourly_price": round(hourly_price, 6),
    }


def _azure_sku_to_specs(sku: str) -> tuple[float, float, int]:
    """Map Azure SKU (e.g. Standard_B1s) to (cpu, ram_gb, storage)."""
    sku = (sku or "").strip()
    if sku in AZURE_SKU_SPECS:
        return AZURE_SKU_SPECS[sku]
    # Heuristic: try to get CPU from name (e.g. D4 -> 4, B2 -> 2)
    import re
    for prefix in ("Standard_", ""):
        rest = sku.replace(prefix, "")
        m = re.search(r"([A-Z])(\d+)", rest)
        if m:
            num = int(m.group(2))
            if num <= 96:
                return (float(num), max(1, num * 2), 0)  # rough guess
    return (1.0, 1.0, 0)


def fetch_azure_retail_prices(max_pages: int = 5) -> list[dict[str, Any]]:
    """
    Fetch Azure VM pay-as-you-go (Consumption) prices from the public Retail Prices API.
    No API key required. Returns list of records in scraper _make_record format.
    """
    base_url = "https://prices.azure.com/api/retail/prices"
    # Consumption = pay-as-you-go; filter Linux to reduce duplicates (we prefer Linux VMs)
    filter_query = "serviceName eq 'Virtual Machines' and type eq 'Consumption' and contains(productName, 'Linux')"
    url = f"{base_url}?$filter={filter_query}&$top=100"
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()  # (region, sku) to dedupe
    pages = 0

    try:
        with httpx.Client(timeout=TIMEOUT, headers=HEADERS) as client:
            while url and pages < max_pages:
                r = client.get(url)
                r.raise_for_status()
                data = r.json()
                items = data.get("Items") or []
                for i in items:
                    retail = float(i.get("retailPrice") or i.get("unitPrice") or 0)
                    if retail <= 0:
                        continue
                    region = (i.get("armRegionName") or "").strip().lower()
                    sku = (i.get("armSkuName") or i.get("skuName") or "").strip()
                    if not region or not sku:
                        continue
                    key = (region, sku)
                    if key in seen:
                        continue
                    seen.add(key)
                    cpu, ram, storage = _azure_sku_to_specs(sku)
                    out.append(
                        _make_record(
                            "Azure",
                            sku,
                            cpu,
                            ram,
                            storage,
                            region,
                            retail,
                        )
                    )
                url = data.get("NextPageLink")
                pages += 1
            logger.info("Azure Retail API: fetched %d VM prices (%d pages)", len(out), pages)
    except Exception as e:
        logger.warning("Azure Retail API failed: %s", e)
        return []

    return out


def fetch_hetzner_server_types(api_token: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch Hetzner Cloud server types and pricing from the public API.
    Optional: HETZNER_API_TOKEN in .env for higher rate limits (no token = unauthenticated).
    Returns list of records in scraper _make_record format.
    """
    url = "https://api.hetzner.cloud/v1/server_types"
    headers = dict(HEADERS)
    if api_token and api_token.strip():
        headers["Authorization"] = f"Bearer {api_token.strip()}"

    try:
        with httpx.Client(timeout=TIMEOUT, headers=headers) as client:
            r = client.get(url)
            r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.warning("Hetzner API failed: %s", e)
        return []

    server_types = data.get("server_types") or []
    out: list[dict[str, Any]] = []

    for st in server_types:
        name = (st.get("name") or "").strip()
        if not name or (st.get("deprecated") is True):
            continue
        cores = float(st.get("cores") or 0)
        memory_gb = float(st.get("memory") or 0)
        disk = int(st.get("disk") or 0)
        prices = st.get("prices") or []
        for p in prices:
            loc = (p.get("location") or "fsn1").strip().lower()
            ph = p.get("price_hourly") or {}
            hourly = float(ph.get("net") or ph.get("gross") or 0)
            if hourly <= 0:
                continue
            out.append(
                _make_record(
                    "Hetzner",
                    name,
                    cores,
                    memory_gb,
                    disk,
                    loc,
                    hourly,
                )
            )
    logger.info("Hetzner API: fetched %d server type prices", len(out))
    return out


def fetch_digitalocean_droplet_prices(api_token: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch DigitalOcean droplet sizes from the API.
    Requires DO_API_TOKEN in .env (DigitalOcean API token with read access).
    Docs: https://docs.digitalocean.com/reference/api/api-reference/#tag/Sizes
    """
    url = "https://api.digitalocean.com/v2/sizes"
    headers = dict(HEADERS)
    if api_token and api_token.strip():
        headers["Authorization"] = f"Bearer {api_token.strip()}"
    else:
        return []  # DO API requires auth
    try:
        with httpx.Client(timeout=TIMEOUT, headers=headers) as client:
            r = client.get(url)
            if r.status_code in (401, 403):
                logger.info("DigitalOcean API: invalid or missing token")
                return []
            r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.warning("DigitalOcean API failed: %s", e)
        return []

    sizes = data.get("sizes") or []
    out: list[dict[str, Any]] = []
    # DO has regions per size; we use first available or "nyc1" as default
    for s in sizes:
        slug = (s.get("slug") or "").strip()
        if not slug or s.get("available") is False:
            continue
        vcpus = float(s.get("vcpus") or 0)
        memory_mb = int(s.get("memory") or 0)
        disk = int(s.get("disk") or 0)
        price_monthly = float(s.get("price_monthly") or 0)
        hourly = price_monthly / (24 * 30) if price_monthly else 0
        regions = s.get("regions") or ["nyc1"]
        for reg in regions:
            out.append(
                _make_record(
                    "DigitalOcean",
                    slug,
                    vcpus,
                    memory_mb / 1024.0,
                    disk,
                    reg,
                    hourly,
                )
            )
    logger.info("DigitalOcean API: fetched %d size/region prices", len(out))
    return out
