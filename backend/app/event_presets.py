import json
from typing import Any

DEFAULT_EVENT_PRESETS: list[dict[str, str]] = [
    {"title": "Key handover", "category": "keys"},
    {"title": "Home inspection", "category": "inspection"},
    {"title": "Pest inspection", "category": "inspection"},
    {"title": "Well inspection", "category": "inspection"},
    {"title": "Septic inspection", "category": "inspection"},
    {"title": "Sewer inspection", "category": "inspection"},
    {"title": "Cleaning", "category": "general"},
    {"title": "Windows", "category": "general"},
    {"title": "Staging", "category": "staging"},
    {"title": "Photography", "category": "photo"},
    {"title": "Listing live", "category": "listing"},
    {"title": "Public open house", "category": "general"},
    {"title": "Broker open house", "category": "general"},
    {"title": "Seller disclosures due", "category": "general"},
    {"title": "COE", "category": "deadline"},
    {"title": "Close of escrow", "category": "deadline"},
]

DEFAULT_CATEGORY_PRESETS: list[dict[str, str]] = [
    {"value": "keys", "label": "Keys"},
    {"value": "inspection", "label": "Inspection"},
    {"value": "staging", "label": "Staging"},
    {"value": "photo", "label": "Photography"},
    {"value": "listing", "label": "Listing"},
    {"value": "marketing", "label": "Marketing"},
    {"value": "showing", "label": "Showing"},
    {"value": "deadline", "label": "Deadline"},
    {"value": "general", "label": "General"},
]


def _parse_json_list(raw: str | None) -> list[Any]:
    if not raw or not str(raw).strip():
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def _normalize_event_presets(items: list[Any]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        if not title:
            continue
        category = str(item.get("category") or "general").strip() or "general"
        out.append({"title": title, "category": category})
    return out


def _normalize_category_presets(items: list[Any]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        value = str(item.get("value") or "").strip()
        label = str(item.get("label") or value).strip()
        if not value:
            continue
        out.append({"value": value, "label": label or value})
    return out


def parse_event_presets(raw: str | None) -> list[dict[str, str]]:
    normalized = _normalize_event_presets(_parse_json_list(raw))
    return normalized if normalized else list(DEFAULT_EVENT_PRESETS)


def parse_category_presets(raw: str | None) -> list[dict[str, str]]:
    normalized = _normalize_category_presets(_parse_json_list(raw))
    return normalized if normalized else list(DEFAULT_CATEGORY_PRESETS)


def dump_event_presets(items: list[Any]) -> str:
    normalized = _normalize_event_presets(items)
    return json.dumps(normalized if normalized else DEFAULT_EVENT_PRESETS)


def dump_category_presets(items: list[Any]) -> str:
    normalized = _normalize_category_presets(items)
    return json.dumps(normalized if normalized else DEFAULT_CATEGORY_PRESETS)
