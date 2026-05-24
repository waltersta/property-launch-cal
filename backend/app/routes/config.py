from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import PropertyConfig
from ..property import assert_property_slug, get_property_config
from ..schemas import ConfigOut, ConfigUpdate
from ..serializers import config_to_out

router = APIRouter(prefix="/config", tags=["config"])


def _default_config_out() -> ConfigOut:
    return ConfigOut(
        property_slug="property",
        property_name="Property",
        tagline="New Listing",
        launch_date_label="",
        hero_image_url="",
        header_image_url="",
        tzid="America/Los_Angeles",
        notifications_enabled=True,
        notify_email="",
        public_base_url="",
        calendar_year=2026,
        calendar_month_start=4,
        calendar_month_end=5,
    )


@router.get("", response_model=ConfigOut)
def get_config(
    property: str | None = Query(None, description="Property slug from client URL"),
    db: Session = Depends(get_db),
):
    cfg = get_property_config(db)
    if not cfg:
        return _default_config_out()
    assert_property_slug(cfg, property)
    return config_to_out(cfg)


@router.put("", response_model=ConfigOut)
def update_config(
    body: ConfigUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = db.get(PropertyConfig, 1)
    if not cfg:
        cfg = PropertyConfig(id=1)
        db.add(cfg)
    data = body.model_dump(exclude_unset=True)
    if "timezone" in data:
        cfg.timezone = data.pop("timezone")
    for key, value in data.items():
        setattr(cfg, key, value)
    db.commit()
    db.refresh(cfg)
    return config_to_out(cfg)
