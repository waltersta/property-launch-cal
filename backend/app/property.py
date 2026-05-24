import re

from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import verify_passcode
from .database import get_db
from .models import ClientToken, PropertyConfig

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slugify_property(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "property"


def resolve_property(db: Session, slug: str | None) -> PropertyConfig:
    if slug:
        cfg = db.query(PropertyConfig).filter(PropertyConfig.property_slug == slug).first()
        if not cfg:
            raise HTTPException(status_code=404, detail="Property not found")
        return cfg
    cfg = db.query(PropertyConfig).order_by(PropertyConfig.id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="No property configured")
    return cfg


def schedule_share_path(property_slug: str) -> str:
    return f"/?view=share&property={property_slug}"


def pick_share_path(token: str, property_slug: str) -> str:
    return f"/pick/{token}?property={property_slug}"


def client_auth_required(cfg: PropertyConfig) -> bool:
    return bool((cfg.client_passcode_hash or "").strip())


def _admin_token_valid(db: Session, x_admin_token: str | None) -> bool:
    if not x_admin_token:
        return False
    from .models import AdminToken

    return db.get(AdminToken, x_admin_token) is not None


def _client_token_valid(db: Session, cfg: PropertyConfig, x_client_token: str | None) -> bool:
    if not x_client_token:
        return False
    row = (
        db.query(ClientToken)
        .filter(ClientToken.token == x_client_token, ClientToken.property_id == cfg.id)
        .first()
    )
    return row is not None


def require_listing_access(
    property: str | None = Query(None, alias="property"),
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    x_client_token: str | None = Header(default=None, alias="X-Client-Token"),
    db: Session = Depends(get_db),
) -> PropertyConfig:
    cfg = resolve_property(db, property)
    if _admin_token_valid(db, x_admin_token):
        return cfg
    if not client_auth_required(cfg):
        return cfg
    if _client_token_valid(db, cfg, x_client_token):
        return cfg
    raise HTTPException(status_code=401, detail="Client passcode required")


def get_property_config(db: Session) -> PropertyConfig | None:
    """First property — used for admin auth and legacy helpers."""
    return db.query(PropertyConfig).order_by(PropertyConfig.id).first()


def assert_property_slug(cfg: PropertyConfig | None, slug: str | None) -> None:
    if not slug:
        return
    if not cfg or slug != cfg.property_slug:
        raise HTTPException(status_code=404, detail="Property not found")
