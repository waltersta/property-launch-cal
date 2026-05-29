from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import assert_property_admin, optional_admin_context, require_admin, set_client_passcode
from ..database import get_db
from ..models import PropertyConfig, utcnow
from ..property import resolve_property
from ..schemas import ConfigOut, ConfigUpdate
from ..event_presets import dump_category_presets, dump_event_presets
from ..listing_parties import dump_listing_parties
from ..serializers import config_to_out

router = APIRouter(prefix="/config", tags=["config"])


def _default_config_out() -> ConfigOut:
    return ConfigOut(
        property_slug="property",
        client_auth_required=False,
        property_name="Property",
        tagline="New Listing",
        schedule_email_intro="Here's the link to the calendar and timeline. This link will never change, but the events on the calendar and timeline might. Keep the link handy.<P>Our transaction coordinator is _______ (email: _____________).",
        launch_date_label="",
        deal_type="listing",
        event_presets=[],
        category_presets=[],
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
    admin_ctx=Depends(optional_admin_context),
):
    try:
        cfg = resolve_property(db, property)
    except HTTPException:
        return _default_config_out()
    if admin_ctx is not None:
        assert_property_admin(cfg, admin_ctx)
    return config_to_out(cfg)


@router.put("", response_model=ConfigOut)
def update_config(
    body: ConfigUpdate,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
    data = body.model_dump(exclude_unset=True)
    if "timezone" in data:
        cfg.timezone = data.pop("timezone")
    if "client_passcode" in data:
        set_client_passcode(cfg, data.pop("client_passcode"))
    if "listing_parties" in data:
        cfg.listing_parties_json = dump_listing_parties(data.pop("listing_parties"))
    if "event_presets" in data:
        raw = data.pop("event_presets")
        items = [x.model_dump() if hasattr(x, "model_dump") else x for x in raw]
        cfg.event_presets_json = dump_event_presets(items)
    if "category_presets" in data:
        raw = data.pop("category_presets")
        items = [x.model_dump() if hasattr(x, "model_dump") else x for x in raw]
        cfg.category_presets_json = dump_category_presets(items)
    if "deal_type" in data and data["deal_type"] not in ("listing", "purchase"):
        data.pop("deal_type")
    for key, value in data.items():
        setattr(cfg, key, value)
    cfg.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(cfg)
    return config_to_out(cfg)
