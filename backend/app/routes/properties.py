from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import ensure_passcode_hash, hash_passcode, require_admin, set_client_passcode
from ..database import get_db
from ..models import PropertyConfig
from ..property import SLUG_RE, resolve_property, slugify_property
from ..schemas import PropertyCreate, PropertySummary
from ..seed import load_seed_data

router = APIRouter(prefix="/properties", tags=["properties"])


def _unique_slug(db: Session, base: str) -> str:
    slug = base
    n = 2
    while db.query(PropertyConfig).filter(PropertyConfig.property_slug == slug).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


@router.get("", response_model=list[PropertySummary])
def list_properties(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    rows = db.query(PropertyConfig).order_by(PropertyConfig.id).all()
    return [
        PropertySummary(id=r.id, property_slug=r.property_slug, property_name=r.property_name)
        for r in rows
    ]


@router.post("", response_model=PropertySummary)
def create_property(
    body: PropertyCreate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    base_slug = slugify_property(body.property_slug or body.property_name)
    if not SLUG_RE.match(base_slug):
        raise HTTPException(status_code=400, detail="Invalid property slug")
    slug = _unique_slug(db, base_slug)

    first = db.query(PropertyConfig).order_by(PropertyConfig.id).first()
    admin_hash = first.admin_passcode_hash if first else hash_passcode("rainbow")

    cfg = PropertyConfig(
        property_name=body.property_name.strip(),
        property_slug=slug,
        tagline=body.tagline,
        launch_date_label="",
        hero_image_url="",
        header_image_url="/header.png",
        timezone="America/Los_Angeles",
        notifications_enabled=True,
        notify_email=first.notify_email if first else "",
        calendar_year=2026,
        calendar_month_start=4,
        calendar_month_end=5,
        admin_passcode_hash=admin_hash,
    )
    set_client_passcode(cfg, body.client_passcode)
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    ensure_passcode_hash(db)
    return PropertySummary(id=cfg.id, property_slug=cfg.property_slug, property_name=cfg.property_name)
