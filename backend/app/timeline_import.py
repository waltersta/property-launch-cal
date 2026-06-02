"""Parse TC timeline emails and screenshots into draft schedule events."""

from __future__ import annotations

import json
import os
import re
from datetime import date, datetime
from email import policy
from email.parser import BytesParser
from typing import Any

from .event_presets import DEFAULT_EVENT_PRESETS

VALID_CATEGORIES = {
    "keys",
    "inspection",
    "staging",
    "photo",
    "listing",
    "marketing",
    "showing",
    "deadline",
    "general",
}
VALID_STATUSES = {"confirmed", "awaiting_pick", "picked"}

CATEGORY_HINTS: list[tuple[str, str]] = [
    (r"\bkey", "keys"),
    (r"\binspect", "inspection"),
    (r"\bstage", "staging"),
    (r"\bphoto", "photo"),
    (r"\blisting live|\blist(ing)? goes live|\bon market\b", "listing"),
    (r"\bopen house|\bbroker tour|\bshowing", "showing"),
    (r"\bcoe\b|\bclose of escrow|\bclosing\b|\bescrow close", "deadline"),
]

MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def _openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        from openai import OpenAI

        return OpenAI(api_key=api_key)
    except Exception:
        return None


def _strip_email_noise(raw: str) -> str:
    text = (raw or "").replace("\r\n", "\n").replace("\r", "\n")
    if not text.strip():
        return ""

    # Raw .eml or MIME — extract plain text body when possible.
    if text.lstrip().startswith(("From:", "Received:", "Return-Path:", "MIME-Version:")):
        try:
            msg = BytesParser(policy=policy.default).parsebytes(text.encode("utf-8", errors="replace"))
            parts = []
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        payload = part.get_content()
                        if isinstance(payload, str) and payload.strip():
                            parts.append(payload)
            else:
                payload = msg.get_content()
                if isinstance(payload, str):
                    parts.append(payload)
            if parts:
                text = "\n\n".join(parts)
        except Exception:
            pass

    lines: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        if stripped.startswith(">"):
            continue
        if re.match(r"^-+\s*Forwarded message\s*-+$", stripped, re.I):
            continue
        if re.match(r"^On .+ wrote:$", stripped):
            break
        if stripped.startswith(("From:", "Sent:", "To:", "Subject:", "Cc:", "Date:")) and len(stripped) < 200:
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def _guess_category(title: str) -> str:
    lower = (title or "").lower()
    for pattern, cat in CATEGORY_HINTS:
        if re.search(pattern, lower):
            return cat
    return "general"


def _normalize_time(value: str | None) -> str | None:
    if not value:
        return None
    t = value.strip().lower().replace(".", "")
    m = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$", t)
    if not m:
        m = re.match(r"^(\d{1,2}):(\d{2})$", t)
        if m:
            return f"{int(m.group(1)):02d}:{m.group(2)}"
        return None
    hour = int(m.group(1))
    minute = int(m.group(2) or 0)
    meridiem = m.group(3)
    if meridiem == "pm" and hour < 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def _parse_date_token(token: str, default_year: int | None = None) -> str | None:
    token = token.strip().strip(",.")
    if not token:
        return None
    year = default_year or date.today().year

    iso = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", token)
    if iso:
        return token

    slash = re.match(r"^(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?$", token)
    if slash:
        m, d = int(slash.group(1)), int(slash.group(2))
        y = int(slash.group(3)) if slash.group(3) else year
        if y < 100:
            y += 2000
        try:
            return date(y, m, d).isoformat()
        except ValueError:
            return None

    named = re.match(
        r"^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s+at\s+(.+))?$",
        token,
        re.I,
    )
    if named:
        month = MONTHS.get(named.group(1).lower())
        if not month:
            return None
        day = int(named.group(2))
        y = int(named.group(3)) if named.group(3) else year
        try:
            return date(y, month, day).isoformat()
        except ValueError:
            return None
    return None


def _extract_dates_from_line(line: str, default_year: int | None = None) -> list[str]:
    found: list[str] = []
    patterns = [
        r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?\b",
        r"\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b",
        r"\b\d{4}-\d{2}-\d{2}\b",
    ]
    for pat in patterns:
        for match in re.finditer(pat, line, re.I):
            iso = _parse_date_token(match.group(0), default_year)
            if iso and iso not in found:
                found.append(iso)
    return found


def _extract_time_from_line(line: str) -> str | None:
    m = re.search(
        r"\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})\b",
        line,
        re.I,
    )
    return _normalize_time(m.group(1)) if m else None


def _normalize_draft(raw: dict[str, Any], event_presets: list[dict[str, str]] | None = None) -> dict[str, Any]:
    title = str(raw.get("title") or "").strip()
    if not title:
        raise ValueError("missing title")

    category = str(raw.get("category") or "general").strip().lower()
    if category not in VALID_CATEGORIES:
        category = _guess_category(title)

    presets = event_presets or DEFAULT_EVENT_PRESETS
    for preset in presets:
        pt = preset.get("title", "")
        if pt and pt.lower() in title.lower():
            category = preset.get("category", category)
            break

    status = str(raw.get("status") or "confirmed").strip().lower()
    if status not in VALID_STATUSES:
        status = "confirmed"

    date_options = [d for d in (raw.get("date_options") or []) if isinstance(d, str) and d.strip()]
    date_options = sorted({_parse_date_token(d) or d for d in date_options if _parse_date_token(d) or re.match(r"^\d{4}-\d{2}-\d{2}$", d)})

    event_date = raw.get("date")
    if isinstance(event_date, str):
        event_date = _parse_date_token(event_date) or (event_date if re.match(r"^\d{4}-\d{2}-\d{2}$", event_date) else None)
    else:
        event_date = None

    end_date = raw.get("end_date")
    if isinstance(end_date, str):
        end_date = _parse_date_token(end_date) or (end_date if re.match(r"^\d{4}-\d{2}-\d{2}$", end_date) else None)
    else:
        end_date = None

    if status == "awaiting_pick" or (not event_date and len(date_options) >= 2):
        status = "awaiting_pick"
        event_date = None
    elif event_date and status == "awaiting_pick":
        status = "confirmed"

    return {
        "title": title,
        "description": str(raw.get("description") or "").strip(),
        "category": category,
        "status": status,
        "date": event_date,
        "end_date": end_date,
        "time": _normalize_time(raw.get("time")),
        "end_time": _normalize_time(raw.get("end_time")),
        "date_options": date_options if status == "awaiting_pick" else [],
        "pick_owner": (str(raw.get("pick_owner")).strip() or None) if raw.get("pick_owner") else None,
        "assigned_to": (str(raw.get("assigned_to")).strip() or None) if raw.get("assigned_to") else None,
        "assigned_phone": (str(raw.get("assigned_phone")).strip() or None) if raw.get("assigned_phone") else None,
        "assigned_email": (str(raw.get("assigned_email")).strip() or None) if raw.get("assigned_email") else None,
        "visibility": "admin_only" if raw.get("visibility") == "admin_only" else "public",
        "completed": bool(raw.get("completed")),
    }


def _title_from_timeline_line(line: str, dates: list[str]) -> str:
    stripped = line.strip()
    if " - " in stripped:
        title = stripped.split(" - ", 1)[1].strip()
    elif ": " in stripped:
        title = stripped.split(": ", 1)[1].strip()
    else:
        title_part = re.sub(
            r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?(?:\s+at\s+[\d:apm\s]+)?|\d{1,2}/\d{1,2}(?:/\d{2,4})?|\d{4}-\d{2}-\d{2}|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\bor\b",
            "",
            stripped,
            flags=re.I,
        )
        title = title_part
    title = re.sub(r"^[\-–—•*\d.)\s]+", "", title).strip(" -–—:\t")
    title = re.sub(r"\s+", " ", title).strip()
    if len(title) < 3 and dates:
        return "Event"
    return title


def _parse_heuristic(text: str, tzid: str) -> tuple[list[dict[str, Any]], str]:
    cleaned = _strip_email_noise(text)
    if not cleaned:
        return [], "No readable timeline text found."

    default_year = date.today().year
    year_match = re.search(r"\b(20\d{2})\b", cleaned)
    if year_match:
        default_year = int(year_match.group(1))

    drafts: list[dict[str, Any]] = []
    for line in cleaned.split("\n"):
        stripped = line.strip()
        if len(stripped) < 4:
            continue
        dates = _extract_dates_from_line(stripped, default_year)
        if not dates:
            continue

        title_part = _title_from_timeline_line(stripped, dates)
        if len(title_part) < 3:
            continue

        time_val = _extract_time_from_line(stripped)
        through = re.search(
            r"\bthrough\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?\b",
            stripped,
            re.I,
        )
        end_date = _parse_date_token(through.group(0).replace("through", "", 1).strip(), default_year) if through else None

        if len(dates) >= 2 and re.search(r"\bor\b|\btbd\b|\boptions?\b|\bchoose\b", stripped, re.I):
            drafts.append(
                _normalize_draft(
                    {
                        "title": title_part,
                        "status": "awaiting_pick",
                        "date_options": dates,
                        "time": time_val,
                    }
                )
            )
        else:
            drafts.append(
                _normalize_draft(
                    {
                        "title": title_part,
                        "status": "confirmed",
                        "date": dates[0],
                        "end_date": end_date or (dates[1] if len(dates) > 1 else None),
                        "time": time_val,
                    }
                )
            )

    note = f"Parsed {len(drafts)} event(s) with basic rules."
    if tzid:
        note += f" Timezone context: {tzid}."
    return drafts, note


def _build_openai_prompt(text: str, tzid: str, event_presets: list[dict[str, str]]) -> str:
    preset_lines = "\n".join(f"- {p['title']} ({p['category']})" for p in event_presets[:30])
    return f"""You extract real-estate transaction timeline events from a transaction coordinator (TC) email or screenshot.

Return JSON: {{ "events": [ ... ] }}

Each event object:
- title (string, required)
- description (string, optional notes from the source)
- category: one of keys, inspection, staging, photo, listing, marketing, showing, deadline, general
- status: "confirmed" when a single date is set; "awaiting_pick" when the client must choose between dates
- date: YYYY-MM-DD or null
- end_date: YYYY-MM-DD or null for multi-day spans
- time / end_time: HH:MM 24-hour or null
- date_options: array of YYYY-MM-DD when status is awaiting_pick
- pick_owner: who chooses (e.g. "Client") or null
- assigned_to, assigned_phone, assigned_email: vendor/contact when mentioned

Prefer these title/category mappings when they match:
{preset_lines}

Property timezone: {tzid}
Use the year shown in the source; if missing, assume {date.today().year}.
Skip email signatures, disclaimers, and unrelated boilerplate.
Order events chronologically when possible.

Source:
{text or "(see attached image)"}"""


def _parse_with_openai(
    text: str,
    image_data_url: str | None,
    tzid: str,
    event_presets: list[dict[str, str]],
) -> tuple[list[dict[str, Any]], str]:
    client = _openai_client()
    if not client:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    content: list[dict[str, Any]] = [{"type": "text", "text": _build_openai_prompt(text, tzid, event_presets)}]
    if image_data_url:
        content.append({"type": "image_url", "image_url": {"url": image_data_url}})

    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": content}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    raw = response.choices[0].message.content or "{}"
    data = json.loads(raw)
    items = data.get("events") if isinstance(data, dict) else []
    if not isinstance(items, list):
        items = []

    drafts = []
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            drafts.append(_normalize_draft(item, event_presets))
        except ValueError:
            continue

    return drafts, f"Parsed {len(drafts)} event(s) with {model}."


def _split_image_data_url(image_base64: str | None) -> str | None:
    if not image_base64:
        return None
    value = image_base64.strip()
    if value.startswith("data:"):
        return value
    return f"data:image/png;base64,{value}"


def parse_timeline_import(
    *,
    text: str = "",
    image_base64: str | None = None,
    tzid: str = "America/Los_Angeles",
    event_presets: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    presets = event_presets or DEFAULT_EVENT_PRESETS
    cleaned = _strip_email_noise(text)
    image_url = _split_image_data_url(image_base64)

    if not cleaned and not image_url:
        return {"events": [], "notes": "Paste a forwarded TC email or a timeline screenshot.", "source": "none"}

    source = "heuristic"
    notes = ""
    events: list[dict[str, Any]] = []

    if _openai_client() and (image_url or cleaned):
        try:
            events, notes = _parse_with_openai(cleaned, image_url, tzid, presets)
            source = "openai"
        except Exception as exc:
            notes = f"AI parse failed ({exc}). "
            if cleaned:
                events, fallback_note = _parse_heuristic(cleaned, tzid)
                notes += fallback_note
                source = "heuristic"
            elif image_url:
                return {
                    "events": [],
                    "notes": f"Could not read screenshot: {exc}. Set OPENAI_API_KEY for image import.",
                    "source": "error",
                }
    elif cleaned:
        events, notes = _parse_heuristic(cleaned, tzid)
    elif image_url:
        return {
            "events": [],
            "notes": "Screenshot import requires OPENAI_API_KEY on the server.",
            "source": "error",
        }

    return {"events": events, "notes": notes, "source": source}


def calendar_range_for_events(events: list[dict[str, Any]]) -> tuple[int, int, int] | None:
    """Return (year, month_start, month_end) 0-based months for calendar display."""
    dates: list[date] = []
    for ev in events:
        for key in ("date", "end_date"):
            val = ev.get(key)
            if isinstance(val, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", val):
                dates.append(date.fromisoformat(val))
        for opt in ev.get("date_options") or []:
            if isinstance(opt, str) and re.match(r"^\d{4}-\d{2}-\d{2}$", opt):
                dates.append(date.fromisoformat(opt))
    if not dates:
        return None
    dates.sort()
    start, end = dates[0], dates[-1]
    month_start = max(0, start.month - 3)
    month_end = min(11, end.month - 1)
    return start.year, month_start, month_end
