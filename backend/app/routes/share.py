from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..auth import create_client_token, verify_client_passcode
from ..links import ensure_pick_token, public_base_url
from ..property import get_property_config, pick_share_path, resolve_property, schedule_share_path
from ..models import Event, PropertyConfig
from ..notify import format_pick_date
from ..pick_service import apply_pick
from ..schemas import ClientAuthIn, ClientAuthOut, PickIn, SharePickOut
from ..serializers import event_to_out

router = APIRouter(prefix="/share", tags=["share"])


@router.post("/client-auth", response_model=ClientAuthOut)
def client_auth(body: ClientAuthIn, db: Session = Depends(get_db)):
    cfg = resolve_property(db, body.property)
    if verify_client_passcode(body.passcode, cfg):
        token = create_client_token(db, cfg.id)
        return ClientAuthOut(valid=True, client_token=token)
    return ClientAuthOut(valid=False)


@router.get("/links")
def get_client_links(
    request: Request,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = resolve_property(db, property)
    base = public_base_url(request, cfg)
    slug = cfg.property_slug if cfg else "property"
    schedule_url = f"{base}{schedule_share_path(slug)}"

    awaiting = (
        db.query(Event)
        .filter(
            Event.status == "awaiting_pick",
            Event.property_id == cfg.id,
            (Event.visibility == "public") | (Event.visibility.is_(None)),
        )
        .order_by(Event.order)
        .all()
    )

    pick_links = []
    for ev in awaiting:
        token = ensure_pick_token(db, ev)
        options = [{"iso": d, "label": format_pick_date(d)} for d in ev.date_options]
        pick_links.append(
            {
                "event_id": ev.id,
                "title": ev.title,
                "pick_owner": ev.pick_owner,
                "date_options": options,
                "pick_url": f"{base}{pick_share_path(token, slug)}",
            }
        )

    return {
        "schedule_url": schedule_url,
        "pick_links": pick_links,
        "notify_email": cfg.notify_email if cfg else "",
        "notifications_enabled": cfg.notifications_enabled if cfg else False,
    }


def _load_public_event_by_token(db: Session, token: str) -> Event:
    ev = db.query(Event).filter(Event.pick_token == token).first()
    if not ev or (ev.visibility or "public") != "public":
        raise HTTPException(status_code=404, detail="Invalid pick link")
    return ev


@router.get("/pick/{token}", response_model=SharePickOut)
def get_share_pick(token: str, db: Session = Depends(get_db)):
    ev = _load_public_event_by_token(db, token)
    cfg = db.get(PropertyConfig, 1)
    property_name = cfg.property_name if cfg else "Property"
    return SharePickOut(event=event_to_out(ev), property_name=property_name)


@router.post("/pick/{token}/submit", response_model=SharePickOut)
def submit_share_pick(
    token: str,
    body: PickIn,
    request: Request,
    db: Session = Depends(get_db),
):
    ev = _load_public_event_by_token(db, token)
    ev = apply_pick(db, ev, body.date, body.picked_by, request=request)
    cfg = db.get(PropertyConfig, 1)
    property_name = cfg.property_name if cfg else "Property"
    return SharePickOut(event=event_to_out(ev), property_name=property_name)
