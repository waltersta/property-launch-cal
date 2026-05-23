from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..links import ensure_pick_token, public_base_url
from ..models import Event, PropertyConfig
from ..notify import format_pick_date
from ..pick_service import apply_pick
from ..schemas import PickIn, SharePickOut
from ..serializers import event_to_out

router = APIRouter(prefix="/share", tags=["share"])


@router.get("/links")
def get_client_links(
    request: Request,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = db.get(PropertyConfig, 1)
    base = public_base_url(request, cfg)
    schedule_url = f"{base}/?view=share"

    awaiting = (
        db.query(Event)
        .filter(Event.status == "awaiting_pick")
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
                "pick_url": f"{base}/pick/{token}",
            }
        )

    return {
        "schedule_url": schedule_url,
        "pick_links": pick_links,
        "notify_email": cfg.notify_email if cfg else "",
        "notifications_enabled": cfg.notifications_enabled if cfg else False,
    }


@router.get("/pick/{token}", response_model=SharePickOut)
def get_share_pick(token: str, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.pick_token == token).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Invalid pick link")
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
    ev = db.query(Event).filter(Event.pick_token == token).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Invalid pick link")
    ev = apply_pick(db, ev, body.date, body.picked_by, request=request)
    cfg = db.get(PropertyConfig, 1)
    property_name = cfg.property_name if cfg else "Property"
    return SharePickOut(event=event_to_out(ev), property_name=property_name)
