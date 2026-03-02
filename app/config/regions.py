"""
Macro region to provider region mapping.
Provider regions come from scraper (us-east-1, eastus, us-central1, etc.).
"""

# Macro region keys (used in API) -> list of provider region substrings to match
# Instance.region is matched with ilike against these patterns
MACRO_TO_REGION_PATTERNS = {
    "north_america": [
        "us-east", "us-west", "us-central", "us-ashburn", "us-south",
        "ca-central", "nyc", "sfo", "lax", "ewr", "eastus", "westus",
    ],
    "europe": [
        "eu-west", "eu-central", "eu-north", "eu-de", "eu-frankfurt",
        "eu-west-rbx", "westeurope", "europe-west", "ams", "nbg", "fsn", "hel",
    ],
    "asia_pacific": [
        "ap-southeast", "ap-northeast", "ap-south", "ap-east", "asia-east",
        "southeastasia", "sgp", "jp-tok", "ap-tokyo", "ap-south-sgp",
    ],
    "south_america": [
        "sa-east", "brazil",
    ],
    "africa": [
        "af-south",
    ],
    "multi_region": [],  # empty = no filter, all regions
}


def expand_macro_regions(macro_regions: list[str]) -> list[str] | None:
    """
    Expand macro regions to a list of region patterns for DB filtering.
    Returns None if multi_region is in the list (no region filter).
    Returns empty list if no valid macros (no instances match).
    """
    if not macro_regions:
        return None
    if "multi_region" in macro_regions:
        return None  # no filter
    patterns = []
    for macro in macro_regions:
        p = MACRO_TO_REGION_PATTERNS.get(macro.lower().replace(" ", "_"))
        if p:
            patterns.extend(p)
    return list(set(patterns)) if patterns else None
