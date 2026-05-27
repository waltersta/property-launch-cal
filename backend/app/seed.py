import json
from pathlib import Path

from sqlalchemy.orm import Session

from sqlalchemy import text

from .auth import ensure_passcode_hash
from .links import ensure_pick_token
from .models import Event, PropertyConfig, ScheduleNote, utcnow
from .property import slugify_property

SEED_PATH = Path(__file__).resolve().parent.parent / "seed.json"
DEFAULT_HEADER_IMAGE_URL = "/header.png"


def event_from_seed(data: dict, property_id: int = 1) -> Event:
    ev = Event(
        property_id=property_id,
        title=data["title"],
        description=data.get("description", ""),
        category=data.get("category", "general"),
        status=data.get("status", "confirmed"),
        date=data.get("date"),
        end_date=data.get("end_date"),
        time=data.get("time"),
        end_time=data.get("end_time"),
        pick_owner=data.get("pick_owner"),
        assigned_to=data.get("assigned_to"),
        assigned_phone=data.get("assigned_phone"),
        assigned_email=data.get("assigned_email"),
        visibility=data.get("visibility", "public"),
        order=data.get("order", 0),
    )
    ev.date_options = data.get("date_options", [])
    ev.pick_history = []
    return ev


def load_seed_data() -> dict:
    with open(SEED_PATH, encoding="utf-8") as f:
        return json.load(f)


def apply_seed(db: Session, preserve_passcode: bool = True) -> None:
    data = load_seed_data()
    cfg_data = data["config"]
    existing = db.get(PropertyConfig, 1)
    saved_hash = existing.admin_passcode_hash if existing and preserve_passcode else ""

    if existing:
        db.delete(existing)
        db.flush()

    property_name = cfg_data.get("property_name", "Property")
    cfg = PropertyConfig(
        id=1,
        property_slug=cfg_data.get("property_slug") or slugify_property(property_name),
        property_name=property_name,
        tagline=cfg_data.get("tagline", "New Listing"),
        launch_date_label=cfg_data.get("launch_date_label", ""),
        hero_image_url=cfg_data.get("hero_image_url", ""),
        header_image_url=cfg_data.get("header_image_url", DEFAULT_HEADER_IMAGE_URL),
        timezone=cfg_data.get("timezone", "America/Los_Angeles"),
        notifications_enabled=cfg_data.get("notifications_enabled", True),
        notify_email=cfg_data.get("notify_email", ""),
        public_base_url=cfg_data.get("public_base_url", ""),
        calendar_year=cfg_data.get("calendar_year", 2026),
        calendar_month_start=cfg_data.get("calendar_month_start", 4),
        calendar_month_end=cfg_data.get("calendar_month_end", 5),
        admin_passcode_hash=saved_hash,
    )
    db.add(cfg)

    db.query(Event).filter(Event.property_id == 1).delete()
    db.query(ScheduleNote).filter(ScheduleNote.property_id == 1).delete()
    for item in data.get("events", []):
        db.add(event_from_seed(item, property_id=1))
    for item in data.get("notes", []):
        db.add(
            ScheduleNote(
                property_id=1,
                order=item.get("order", 0),
                recorded_at=item.get("recorded_at", utcnow().isoformat()),
                responsible_party=item.get("responsible_party", ""),
                status=item.get("status", "Open"),
                description=item.get("description", ""),
            )
        )

    db.commit()
    ensure_passcode_hash(db)
    for ev in db.query(Event).filter(Event.status == "awaiting_pick").all():
        ensure_pick_token(db, ev)


def _migrate_sqlite_columns(engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.connect() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(property_config)"))}
        if "notify_email" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN notify_email VARCHAR(255) DEFAULT ''"))
        if "public_base_url" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN public_base_url VARCHAR(512) DEFAULT ''"))
        if "property_slug" not in cols:
            conn.execute(
                text("ALTER TABLE property_config ADD COLUMN property_slug VARCHAR(64) DEFAULT 'property'")
            )
        if "client_passcode_hash" not in cols:
            conn.execute(
                text("ALTER TABLE property_config ADD COLUMN client_passcode_hash VARCHAR(255) DEFAULT ''")
            )
        event_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(events)"))}
        if "property_id" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN property_id INTEGER DEFAULT 1"))
        if "visibility" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN visibility VARCHAR(16) DEFAULT 'public'"))
        conn.commit()


def init_db(db: Session) -> None:
    from .database import Base, engine

    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns(engine)
    cfg = db.get(PropertyConfig, 1)
    if not cfg:
        apply_seed(db, preserve_passcode=False)
    else:
        ensure_passcode_hash(db)
        if not cfg.notify_email:
            cfg.notify_email = "walter@831.net"
            cfg.notifications_enabled = True
        if not (cfg.header_image_url or "").strip():
            cfg.header_image_url = DEFAULT_HEADER_IMAGE_URL
        if not (cfg.property_slug or "").strip() or cfg.property_slug == "property":
            cfg.property_slug = slugify_property(cfg.property_name or "property")
        db.execute(text("UPDATE events SET property_id = 1 WHERE property_id IS NULL"))
        db.commit()
        for ev in db.query(Event).filter(Event.status == "awaiting_pick").all():
            if not ev.pick_token:
                ensure_pick_token(db, ev)
