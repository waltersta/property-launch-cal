import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import PropertyConfig

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slugify_property(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "property"


def get_property_config(db: Session) -> PropertyConfig | None:
    return db.get(PropertyConfig, 1)


def assert_property_slug(cfg: PropertyConfig | None, slug: str | None) -> None:
    """When slug is present in the URL, it must match this deployment's property."""
    if not slug:
        return
    if not cfg:
        raise HTTPException(status_code=404, detail="Property not found")
    if slug != cfg.property_slug:
        raise HTTPException(status_code=404, detail="Property not found")


def schedule_share_path(property_slug: str) -> str:
    return f"/?view=share&property={property_slug}"


def pick_share_path(token: str, property_slug: str) -> str:
    return f"/pick/{token}?property={property_slug}"
