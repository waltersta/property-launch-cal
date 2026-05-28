from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import require_admin, set_client_passcode
from ..database import get_db
from ..models import PropertyConfig, utcnow
from ..property import resolve_property
from ..schemas import ConfigOut, ConfigUpdate
from ..listing_parties import dump_listing_parties
from ..serializers import config_to_out

router = APIRouter(prefix="/config", tags=["config"])


def _default_config_out() -> ConfigOut:
    return ConfigOut(
        property_slug="property",
        client_auth_required=False,
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
        listing_parties={
            "agent": {"name": "Walter", "email": "", "color": "#e0e7ff"},
            "clients": [{"name": "Client", "email": "", "color": "#fef3c7"}],
        },
    )


@router.get("", response_model=ConfigOut)
def get_config(
    property: str | None = Query(None, description="Property slug from URL"),
    db: Session = Depends(get_db),
):
    try:
        cfg = resolve_property(db, property)
    except HTTPException:
        return _default_config_out()
    return config_to_out(cfg)


@router.put("", response_model=ConfigOut)
def update_config(
    body: ConfigUpdate,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = resolve_property(db, property)
    data = body.model_dump(exclude_unset=True)
    if "timezone" in data:
        cfg.timezone = data.pop("timezone")
    if "client_passcode" in data:
        set_client_passcode(cfg, data.pop("client_passcode"))
    if "listing_parties" in data:
        cfg.listing_parties_json = dump_listing_parties(data.pop("listing_parties"))
    for key, value in data.items():
        setattr(cfg, key, value)
    cfg.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(cfg)
    return config_to_out(cfg)
