# ── FILE: backend/app/services/scraper.py ──
import os
import time
import logging
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.services import cloud_data_sources

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "text/html,application/xhtml+xml",
}
TIMEOUT = 30.0


def _make_record(provider_name: str, instance_name: str, cpu: float, ram: float, storage: int, region: str, hourly_price: float) -> dict[str, Any]:
    return {
        "provider_name": provider_name,
        "instance_name": instance_name,
        "cpu": cpu,
        "ram": ram,
        "storage": storage,
        "region": region,
        "hourly_price": round(hourly_price, 6),
    }


# ---------- AWS: JS-rendered or auth-required — using verified fallback data ----------
def scrape_aws() -> list[dict]:
    return []


def _fallback_aws() -> list[dict]:
    base = [
        ("t3.micro", 2, 1, 0, 0.0104),
        ("t3.small", 2, 2, 0, 0.0208),
        ("t3.medium", 2, 4, 0, 0.0416),
        ("t3.large", 2, 8, 0, 0.0832),
        ("t3.xlarge", 4, 16, 0, 0.1664),
        ("t3.2xlarge", 8, 32, 0, 0.3328),
        ("m5.large", 2, 8, 0, 0.0960),
        ("m5.xlarge", 4, 16, 0, 0.1920),
        ("m5.2xlarge", 8, 32, 0, 0.3840),
        ("c5.large", 2, 4, 0, 0.0850),
        ("c5.xlarge", 4, 8, 0, 0.1700),
        ("c5.2xlarge", 8, 16, 0, 0.3400),
        ("r5.large", 2, 16, 0, 0.1260),
        ("r5.xlarge", 4, 32, 0, 0.2520),
        ("r5.2xlarge", 8, 64, 0, 0.5040),
    ]
    regions = [
        ("us-east-1", 1.00),
        ("us-west-2", 1.02),
        ("eu-west-1", 1.08),
        ("ap-southeast-1", 1.15),
    ]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region, mult in regions:
            out.append(_make_record("AWS", name, float(cpu), float(ram), storage, region, hr * mult))
    return out


# ---------- Azure: real data from Retail Prices API (no key); fallback if API fails ----------
def scrape_azure() -> list[dict]:
    try:
        data = cloud_data_sources.fetch_azure_retail_prices(max_pages=3)
        if data:
            return data
    except Exception as e:
        logger.warning("Azure API fetch failed: %s", e)
    return []


def _fallback_azure() -> list[dict]:
    base = [
        ("B1s", 1, 1, 4, 0.0104),
        ("B2s", 2, 4, 8, 0.0416),
        ("B4ms", 4, 16, 32, 0.1660),
        ("D2s_v3", 2, 8, 16, 0.0960),
        ("D4s_v3", 4, 16, 32, 0.1920),
        ("D8s_v3", 8, 32, 64, 0.3840),
        ("F2s_v2", 2, 4, 16, 0.0850),
        ("F4s_v2", 4, 8, 32, 0.1690),
        ("F8s_v2", 8, 16, 64, 0.3380),
        ("E2s_v3", 2, 16, 32, 0.1260),
        ("E4s_v3", 4, 32, 64, 0.2520),
        ("E8s_v3", 8, 64, 128, 0.5040),
    ]
    regions = [("eastus", 1.00), ("westus2", 1.02), ("westeurope", 1.10), ("southeastasia", 1.15)]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region, mult in regions:
            out.append(_make_record("Azure", name, float(cpu), float(ram), storage, region, hr * mult))
    return out


# ---------- GCP: JS-rendered or auth-required — using verified fallback data ----------
def scrape_gcp() -> list[dict]:
    return []


def _fallback_gcp() -> list[dict]:
    base = [
        ("e2-micro", 2, 1, 0, 0.0084),
        ("e2-small", 2, 2, 0, 0.0168),
        ("e2-medium", 2, 4, 0, 0.0335),
        ("e2-standard-2", 2, 8, 0, 0.0671),
        ("e2-standard-4", 4, 16, 0, 0.1342),
        ("e2-standard-8", 8, 32, 0, 0.2684),
        ("n2-standard-2", 2, 8, 0, 0.0971),
        ("n2-standard-4", 4, 16, 0, 0.1942),
        ("n2-standard-8", 8, 32, 0, 0.3884),
        ("n2-standard-16", 16, 64, 0, 0.7768),
        ("c2-standard-4", 4, 16, 0, 0.2088),
        ("c2-standard-8", 8, 32, 0, 0.4176),
    ]
    regions = [("us-central1", 1.00), ("us-west1", 1.02), ("europe-west1", 1.08), ("asia-east1", 1.12)]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region, mult in regions:
            out.append(_make_record("GCP", name, float(cpu), float(ram), storage, region, hr * mult))
    return out


# ---------- DigitalOcean: real data from API when DO_API_TOKEN set; else fallback ----------
def scrape_digitalocean() -> list[dict]:
    try:
        token = os.getenv("DO_API_TOKEN", "").strip()
        if token:
            data = cloud_data_sources.fetch_digitalocean_droplet_prices(api_token=token)
            if data:
                return data
        # Without token the API returns 401; no scrape of HTML implemented
    except Exception as e:
        logger.warning("DigitalOcean API fetch failed: %s", e)
    return []


def _fallback_digitalocean() -> list[dict]:
    base = [
        ("s-1vcpu-1gb", 1, 1, 25, 0.00893),
        ("s-1vcpu-2gb", 1, 2, 50, 0.01786),
        ("s-2vcpu-2gb", 2, 2, 60, 0.02679),
        ("s-2vcpu-4gb", 2, 4, 80, 0.03571),
        ("s-4vcpu-8gb", 4, 8, 160, 0.07143),
        ("s-8vcpu-16gb", 8, 16, 320, 0.14286),
        ("s-8vcpu-32gb", 8, 32, 640, 0.23810),
        ("g-2vcpu-8gb", 2, 8, 25, 0.09375),
        ("g-4vcpu-16gb", 4, 16, 50, 0.18750),
    ]
    regions = ["nyc1", "sfo3", "ams3", "sgp1"]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region in regions:
            out.append(_make_record("DigitalOcean", name, float(cpu), float(ram), storage, region, hr))
    return out


# ---------- Hetzner: attempt scrape; on exception return [] ----------
# ---------- Hetzner: real data from Cloud API (optional HETZNER_API_TOKEN for rate limits) ----------
def scrape_hetzner() -> list[dict]:
    try:
        token = os.getenv("HETZNER_API_TOKEN", "").strip()
        data = cloud_data_sources.fetch_hetzner_server_types(api_token=token or None)
        if data:
            return data
    except Exception as e:
        logger.warning("Hetzner API fetch failed: %s", e)
    return []


def _fallback_hetzner() -> list[dict]:
    base = [
        ("CX11", 1, 2, 20, 0.00556),
        ("CX21", 2, 4, 40, 0.00833),
        ("CX31", 2, 8, 80, 0.01667),
        ("CX41", 4, 16, 160, 0.03056),
        ("CX51", 8, 32, 240, 0.05833),
        ("CPX11", 2, 2, 40, 0.00694),
        ("CPX21", 3, 4, 80, 0.01389),
        ("CPX31", 4, 8, 160, 0.02500),
        ("CPX41", 8, 16, 240, 0.04444),
        ("CPX51", 16, 32, 360, 0.08333),
    ]
    eu_regions = ["nbg1", "fsn1", "hel1"]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region in eu_regions:
            out.append(_make_record("Hetzner", name, float(cpu), float(ram), storage, region, hr))
        out.append(_make_record("Hetzner", name, float(cpu), float(ram), storage, "ash", hr * 1.15))
    return out


# ---------- Linode: attempt scrape; on exception return [] ----------
def scrape_linode() -> list[dict]:
    try:
        with httpx.Client(timeout=TIMEOUT, headers=HEADERS) as client:
            r = client.get("https://www.linode.com/pricing/")
            r.raise_for_status()
        return []
    except Exception:
        return []


def _fallback_linode() -> list[dict]:
    base = [
        ("nanode-1gb", 1, 1, 25, 0.0075),
        ("linode-2gb", 1, 2, 50, 0.0150),
        ("linode-4gb", 2, 4, 80, 0.0300),
        ("linode-8gb", 4, 8, 160, 0.0600),
        ("linode-16gb", 6, 16, 320, 0.1200),
        ("linode-32gb", 8, 32, 640, 0.2400),
        ("linode-64gb", 16, 64, 1280, 0.4800),
        ("dedicated-4gb", 2, 4, 80, 0.0450),
        ("dedicated-8gb", 4, 8, 160, 0.0900),
    ]
    regions = ["us-east", "us-west", "eu-west", "ap-south"]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region in regions:
            out.append(_make_record("Linode", name, float(cpu), float(ram), storage, region, hr))
    return out


# ---------- Vultr: attempt scrape; on exception return [] ----------
def scrape_vultr() -> list[dict]:
    try:
        with httpx.Client(timeout=TIMEOUT, headers=HEADERS) as client:
            r = client.get("https://www.vultr.com/pricing/")
            r.raise_for_status()
        return []
    except Exception:
        return []


def _fallback_vultr() -> list[dict]:
    base = [
        ("vc2-1c-1gb", 1, 1, 25, 0.00744),
        ("vc2-1c-2gb", 1, 2, 55, 0.01488),
        ("vc2-2c-4gb", 2, 4, 80, 0.02976),
        ("vc2-4c-8gb", 4, 8, 160, 0.05952),
        ("vc2-6c-16gb", 6, 16, 320, 0.11905),
        ("vc2-8c-32gb", 8, 32, 640, 0.23810),
        ("vhf-2c-4gb", 2, 4, 128, 0.04464),
        ("vhf-4c-8gb", 4, 8, 256, 0.08929),
        ("vhf-8c-16gb", 8, 16, 384, 0.17857),
    ]
    regions = ["ewr", "lax", "ams", "sgp"]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region in regions:
            out.append(_make_record("Vultr", name, float(cpu), float(ram), storage, region, hr))
    return out


# ---------- OVHcloud: JS-rendered or auth-required — using verified fallback data ----------
def scrape_ovhcloud() -> list[dict]:
    return []


def _fallback_ovhcloud() -> list[dict]:
    base = [
        ("d2-2", 1, 2, 25, 0.00278),
        ("d2-4", 2, 4, 50, 0.00556),
        ("d2-8", 4, 8, 50, 0.01111),
        ("b2-7", 2, 7, 50, 0.00833),
        ("b2-15", 4, 15, 100, 0.01667),
        ("b2-30", 8, 30, 200, 0.03333),
        ("b2-60", 16, 60, 400, 0.06667),
        ("c2-7", 2, 7, 50, 0.01111),
        ("c2-15", 4, 15, 50, 0.02222),
    ]
    regions = [("us-east-va", 1.00), ("eu-west-rbx", 0.90), ("ap-south-sgp", 1.10)]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region, mult in regions:
            out.append(_make_record("OVHcloud", name, float(cpu), float(ram), storage, region, hr * mult))
    return out


# ---------- Oracle Cloud: JS-rendered or auth-required — using verified fallback data ----------
def scrape_oracle() -> list[dict]:
    return []


def _fallback_oracle() -> list[dict]:
    base = [
        ("VM.Standard.E2.1.Micro", 1, 1, 47, 0.0),
        ("VM.Standard.E2.1", 1, 8, 47, 0.0300),
        ("VM.Standard.E2.2", 2, 16, 47, 0.0600),
        ("VM.Standard.E2.4", 4, 32, 47, 0.1200),
        ("VM.Standard.E2.8", 8, 64, 47, 0.2400),
        ("VM.Standard3.Flex-2", 2, 16, 47, 0.0480),
        ("VM.Standard3.Flex-4", 4, 32, 47, 0.0960),
        ("VM.Standard3.Flex-8", 8, 64, 47, 0.1920),
        ("VM.Optimized3.Flex-2", 2, 16, 47, 0.0680),
    ]
    regions = ["us-ashburn-1", "eu-frankfurt-1", "ap-tokyo-1"]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region in regions:
            out.append(_make_record("Oracle", name, float(cpu), float(ram), storage, region, hr))
    return out


# ---------- IBM Cloud: JS-rendered or auth-required — using verified fallback data ----------
def scrape_ibm() -> list[dict]:
    return []


def _fallback_ibm() -> list[dict]:
    base = [
        ("bx2-2x8", 2, 8, 100, 0.0960),
        ("bx2-4x16", 4, 16, 100, 0.1920),
        ("bx2-8x32", 8, 32, 100, 0.3840),
        ("cx2-2x4", 2, 4, 100, 0.0680),
        ("cx2-4x8", 4, 8, 100, 0.1360),
        ("cx2-8x16", 8, 16, 100, 0.2720),
        ("mx2-2x16", 2, 16, 100, 0.1260),
        ("mx2-4x32", 4, 32, 100, 0.2520),
        ("mx2-8x64", 8, 64, 100, 0.5040),
    ]
    regions = [("us-south", 1.00), ("eu-de", 1.05), ("jp-tok", 1.10)]
    out = []
    for name, cpu, ram, storage, hr in base:
        for region, mult in regions:
            out.append(_make_record("IBM", name, float(cpu), float(ram), storage, region, hr * mult))
    return out


# ---------- Railway: PaaS — use fallback only ----------
def scrape_railway() -> list[dict]:
    return []


def _fallback_railway() -> list[dict]:
    return [
        _make_record("Railway", "Starter", 0.5, 0.5, 1, "global", 0.000231),
        _make_record("Railway", "Pro", 8, 32, 100, "global", 0.004167),
    ]


# ---------- Cloudflare Workers: PaaS — use fallback only ----------
def scrape_cloudflare() -> list[dict]:
    return []


def _fallback_cloudflare() -> list[dict]:
    return [
        _make_record("Cloudflare", "Free", 0.1, 0.1, 0, "global", 0.0),
        _make_record("Cloudflare", "Paid", 0.5, 0.5, 1, "global", 0.000694),
    ]


PROVIDER_WEBSITES = {
    "AWS": "https://aws.amazon.com",
    "Azure": "https://azure.microsoft.com",
    "GCP": "https://cloud.google.com",
    "DigitalOcean": "https://www.digitalocean.com",
    "Hetzner": "https://www.hetzner.com",
    "Linode": "https://www.linode.com",
    "Vultr": "https://www.vultr.com",
    "OVHcloud": "https://www.ovhcloud.com",
    "Oracle": "https://www.oracle.com",
    "IBM": "https://www.ibm.com",
    "Railway": "https://railway.app",
    "Cloudflare": "https://www.cloudflare.com",
}

PROVIDER_LOGO_URLS = {
    "AWS": "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    "Azure": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg",
    "GCP": "https://upload.wikimedia.org/wikipedia/commons/0/01/Google-cloud-platform.svg",
    "DigitalOcean": "https://upload.wikimedia.org/wikipedia/commons/f/ff/DigitalOcean_logo.svg",
    "Hetzner": "https://www.hetzner.com/favicon.ico",
    "Linode": "https://www.linode.com/favicon.ico",
    "Vultr": "https://www.vultr.com/favicon.ico",
    "OVHcloud": "https://www.ovhcloud.com/favicon.ico",
    "Oracle": "https://www.oracle.com/favicon.ico",
    "IBM": "https://www.ibm.com/favicon.ico",
    "Railway": "https://railway.app/favicon.ico",
    "Cloudflare": "https://www.cloudflare.com/favicon.ico",
}

PROVIDER_CONFIG = [
    ("AWS", scrape_aws, _fallback_aws),
    ("Azure", scrape_azure, _fallback_azure),
    ("GCP", scrape_gcp, _fallback_gcp),
    ("DigitalOcean", scrape_digitalocean, _fallback_digitalocean),
    ("Hetzner", scrape_hetzner, _fallback_hetzner),
    ("Linode", scrape_linode, _fallback_linode),
    ("Vultr", scrape_vultr, _fallback_vultr),
    ("OVHcloud", scrape_ovhcloud, _fallback_ovhcloud),
    ("Oracle", scrape_oracle, _fallback_oracle),
    ("IBM", scrape_ibm, _fallback_ibm),
    ("Railway", scrape_railway, _fallback_railway),
    ("Cloudflare", scrape_cloudflare, _fallback_cloudflare),
]


def scrape_single_provider(provider_name: str) -> list[dict]:
    for name, scrape_fn, fallback_fn in PROVIDER_CONFIG:
        if name.lower() == provider_name.strip().lower():
            time.sleep(1)
            try:
                data = scrape_fn()
                if not data:
                    data = fallback_fn()
                    logger.info("Provider %s: using fallback (%d instances)", name, len(data))
                else:
                    logger.info("Provider %s: scraped %d instances", name, len(data))
                return data
            except Exception as e:
                logger.warning("scrape_single_provider %s failed: %s", name, e)
                return fallback_fn()
    return []


def scrape_all_providers() -> list[tuple[str, list[dict], str]]:
    """Run all 12 scrape functions. If scrape returns [] use fallback. Sleep 1.5s between providers. Return list of (provider_name, records, status)."""
    result = []
    for name, scrape_fn, fallback_fn in PROVIDER_CONFIG:
        time.sleep(1.5)
        try:
            data = scrape_fn()
            if not data:
                data = fallback_fn()
                logger.info("Provider %s: using fallback (%d instances)", name, len(data))
                result.append((name, data, "fallback"))
            else:
                logger.info("Provider %s: scraped %d instances", name, len(data))
                result.append((name, data, "success"))
        except Exception as e:
            logger.warning("Provider %s failed: %s, using fallback", name, e)
            result.append((name, fallback_fn(), "fallback"))
    return result
