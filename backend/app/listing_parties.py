import json
from typing import Any

def _first_name_only(name: str) -> str:
    t = (name or "").strip()
    if not t:
        return ""
    return t.split()[0]


DEFAULT_LISTING_PARTIES: dict[str, Any] = {
    "agent": {"name": "Walter", "email": "", "color": "#e0e7ff"},
    "coordinator": {"name": "", "email": "", "color": "#ddd6fe"},
    "clients": [{"name": "Client", "email": "", "color": "#fef3c7"}],
}

MAX_CLIENTS = 4


def _parse_person(raw: dict | None, defaults: dict) -> dict[str, str]:
    raw = raw if isinstance(raw, dict) else {}
    return {
        "name": str(raw.get("name") or defaults.get("name") or "").strip(),
        "email": str(raw.get("email") or "").strip(),
        "color": str(raw.get("color") or defaults.get("color") or "#fef3c7").strip()
        or defaults.get("color", "#fef3c7"),
    }


def parse_listing_parties(raw: str | None) -> dict[str, Any]:
    if not raw or not str(raw).strip():
        return json.loads(json.dumps(DEFAULT_LISTING_PARTIES))
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return json.loads(json.dumps(DEFAULT_LISTING_PARTIES))
    agent = data.get("agent") if isinstance(data.get("agent"), dict) else {}
    coordinator = data.get("coordinator") if isinstance(data.get("coordinator"), dict) else {}
    clients_in = data.get("clients") if isinstance(data.get("clients"), list) else []
    clients = []
    for item in clients_in[:MAX_CLIENTS]:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        clients.append(
            {
                "name": name,
                "email": str(item.get("email") or "").strip(),
                "color": str(item.get("color") or "#fef3c7").strip() or "#fef3c7",
            }
        )
    agent_raw = str(agent.get("name") or DEFAULT_LISTING_PARTIES["agent"]["name"]).strip()
    coord = _parse_person(coordinator, DEFAULT_LISTING_PARTIES["coordinator"])
    return {
        "agent": {
            "name": _first_name_only(agent_raw) or DEFAULT_LISTING_PARTIES["agent"]["name"],
            "email": str(agent.get("email") or "").strip(),
            "color": str(agent.get("color") or DEFAULT_LISTING_PARTIES["agent"]["color"]).strip()
            or DEFAULT_LISTING_PARTIES["agent"]["color"],
        },
        "coordinator": coord,
        "clients": clients or list(DEFAULT_LISTING_PARTIES["clients"]),
    }


def dump_listing_parties(data: dict[str, Any]) -> str:
    parsed = parse_listing_parties(json.dumps(data))
    return json.dumps(parsed)
