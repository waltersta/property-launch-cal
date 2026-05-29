import json
from pathlib import Path

from sqlalchemy.orm import Session

from sqlalchemy import text

from .agent_service import assign_unowned_properties, ensure_super_agent
from .auth import ensure_passcode_hash
from .links import ensure_pick_token
from .event_factory import event_from_seed
from .models import Event, PropertyConfig, ScheduleNote, utcnow
from .property import slugify_property

SEED_PATH = Path(__file__).resolve().parent.parent / "seed.json"
DEFAULT_HEADER_IMAGE_URL = "/header.png"


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

    super_agent = ensure_super_agent(db)
    property_name = cfg_data.get("property_name", "Property")
    cfg = PropertyConfig(
        id=1,
        agent_id=super_agent.id,
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
        if "listing_parties_json" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN listing_parties_json TEXT DEFAULT ''"))
        if "schedule_type_label" not in cols:
            conn.execute(
                text("ALTER TABLE property_config ADD COLUMN schedule_type_label VARCHAR(128) DEFAULT 'Listing schedule'")
            )
        if "create_property_label" not in cols:
            conn.execute(
                text("ALTER TABLE property_config ADD COLUMN create_property_label VARCHAR(128) DEFAULT 'New listing'")
            )
        if "schedule_email_intro" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN schedule_email_intro TEXT DEFAULT ''"))
        if "updated_at" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN updated_at VARCHAR(64) DEFAULT ''"))
        if "deal_type" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN deal_type VARCHAR(16) DEFAULT 'listing'"))
        if "event_presets_json" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN event_presets_json TEXT DEFAULT ''"))
        if "category_presets_json" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN category_presets_json TEXT DEFAULT ''"))
        if "agent_id" not in cols:
            conn.execute(text("ALTER TABLE property_config ADD COLUMN agent_id INTEGER"))
        agent_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(agents)"))}
        if not agent_cols:
            conn.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS agents ("
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                    "name VARCHAR(128) DEFAULT 'Agent', "
                    "email VARCHAR(255) DEFAULT '', "
                    "invite_token VARCHAR(64) NOT NULL UNIQUE, "
                    "is_super_admin BOOLEAN DEFAULT 0, "
                    "onboarding_completed_at VARCHAR(64) DEFAULT '', "
                    "created_at VARCHAR(64) DEFAULT ''"
                    ")"
                )
            )
        admin_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(admin_tokens)"))}
        if "agent_id" not in admin_cols:
            conn.execute(text("ALTER TABLE admin_tokens ADD COLUMN agent_id INTEGER"))
        event_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(events)"))}
        if "property_id" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN property_id INTEGER DEFAULT 1"))
        if "visibility" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN visibility VARCHAR(16) DEFAULT 'public'"))
        if "required_parties_json" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN required_parties_json TEXT DEFAULT '[]'"))
        if "completed" not in event_cols:
            conn.execute(text("ALTER TABLE events ADD COLUMN completed BOOLEAN DEFAULT 0"))
        conn.commit()


def init_db(db: Session) -> None:
    from .database import Base, engine

    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns(engine)
    ensure_super_agent(db)
    assign_unowned_properties(db)
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
