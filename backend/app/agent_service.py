import json
import secrets
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from .event_presets import dump_category_presets, dump_event_presets
from .listing_parties import dump_listing_parties
from .models import Agent, Event, PropertyConfig, ScheduleNote, utcnow
from .property import slugify_property
from .event_factory import event_from_seed

TRIAL_SEED_PATH = Path(__file__).resolve().parent.parent / "trial_seed.json"


def _first_name(name: str) -> str:
    t = (name or "").strip()
    if not t:
        return "Agent"
    return t.split()[0]


def _unique_slug(db: Session, base: str) -> str:
    slug = base
    n = 2
    while db.query(PropertyConfig).filter(PropertyConfig.property_slug == slug).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


def ensure_super_agent(db: Session) -> Agent:
    agent = db.query(Agent).filter(Agent.is_super_admin.is_(True)).first()
    if agent:
        return agent
    agent = Agent(
        name="Owner",
        email="",
        invite_token=secrets.token_urlsafe(16),
        is_super_admin=True,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def assign_unowned_properties(db: Session) -> None:
    super_agent = ensure_super_agent(db)
    rows = db.query(PropertyConfig).filter(PropertyConfig.agent_id.is_(None)).all()
    if not rows:
        return
    for cfg in rows:
        cfg.agent_id = super_agent.id
    db.commit()


def _trial_dates() -> dict[str, str]:
    today = date.today()
    return {
        "staging": (today + timedelta(days=7)).isoformat(),
        "photo": (today + timedelta(days=10)).isoformat(),
        "listing": (today + timedelta(days=14)).isoformat(),
        "pick_a": (today + timedelta(days=3)).isoformat(),
        "pick_b": (today + timedelta(days=5)).isoformat(),
    }


def _load_trial_seed() -> dict:
    with open(TRIAL_SEED_PATH, encoding="utf-8") as f:
        return json.load(f)


def create_trial_property(db: Session, agent: Agent) -> PropertyConfig:
    first = _first_name(agent.name)
    slug = _unique_slug(db, f"trial-{slugify_property(first)}")
    dates = _trial_dates()

    parties = {
        "agent": {"name": first, "email": agent.email or "", "color": "#e0e7ff"},
        "coordinator": {"name": "", "email": "", "color": "#ddd6fe"},
        "clients": [{"name": "Alex Client", "email": "", "color": "#fef3c7"}],
    }

    cfg = PropertyConfig(
        agent_id=agent.id,
        property_name=f"Sample listing — {first}",
        property_slug=slug,
        tagline="New Listing",
        schedule_type_label="Listing schedule",
        create_property_label="New listing",
        deal_type="listing",
        launch_date_label="",
        hero_image_url="",
        header_image_url="/header.png",
        timezone="America/Los_Angeles",
        notifications_enabled=False,
        notify_email="",
        calendar_year=date.today().year,
        calendar_month_start=max(0, date.today().month - 1),
        calendar_month_end=min(11, date.today().month + 1),
        admin_passcode_hash="",
        listing_parties_json=dump_listing_parties(parties),
        event_presets_json=dump_event_presets([]),
        category_presets_json=dump_category_presets([]),
        updated_at=utcnow().isoformat(),
    )
    db.add(cfg)
    db.flush()

    data = _load_trial_seed()
    for item in data.get("events", []):
        row = dict(item)
        title = (row.get("title") or "").lower()
        if "key" in title:
            row["date_options"] = [dates["pick_a"], dates["pick_b"]]
            row["assigned_to"] = first
        elif "staging" in title:
            row["date"] = dates["staging"]
        elif "photo" in title:
            row["date"] = dates["photo"]
        elif "listing" in title:
            row["date"] = dates["listing"]
        db.add(event_from_seed(row, property_id=cfg.id))

    for item in data.get("notes", []):
        db.add(
            ScheduleNote(
                property_id=cfg.id,
                order=item.get("order", 0),
                recorded_at=utcnow().isoformat(),
                responsible_party=first,
                status=item.get("status", "Open"),
                description=item.get("description", ""),
            )
        )

    db.commit()
    db.refresh(cfg)
    return cfg


def create_beta_agent(db: Session, name: str, email: str) -> tuple[Agent, PropertyConfig]:
    first = _first_name(name)
    token = secrets.token_urlsafe(24)
    agent = Agent(
        name=first,
        email=(email or "").strip(),
        invite_token=token,
        is_super_admin=False,
    )
    db.add(agent)
    db.flush()
    cfg = create_trial_property(db, agent)
    db.refresh(agent)
    return agent, cfg
