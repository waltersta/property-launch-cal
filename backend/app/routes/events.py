import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..links import ensure_pick_token
from ..models import Event, utcnow
from ..pick_service import apply_pick
from ..property import is_admin_request, require_listing_access, resolve_property
from ..schemas import EventCreate, EventOut, EventUpdate, PickIn
from ..seed import apply_seed
from ..serializers import event_to_out

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    cfg=Depends(require_listing_access),
    is_admin: bool = Depends(is_admin_request),
    db: Session = Depends(get_db),
):
    q = db.query(Event).filter(Event.property_id == cfg.id)
    if not is_admin:
        q = q.filter((Event.visibility == "public") | (Event.visibility.is_(None)))
    rows = q.order_by(Event.order).all()
    return [event_to_out(e) for e in rows]


@router.post("", response_model=EventOut)
def create_event(
    body: EventCreate,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = resolve_property(db, property)
    max_order = db.query(Event).filter(Event.property_id == cfg.id).count()
    ev = Event(
        property_id=cfg.id,
        title=body.title,
        description=body.description,
        category=body.category,
        status=body.status,
        date=body.date,
        end_date=body.end_date,
        time=body.time,
        end_time=body.end_time,
        pick_owner=body.pick_owner,
        assigned_to=body.assigned_to,
        assigned_phone=body.assigned_phone,
        assigned_email=body.assigned_email,
        visibility=body.visibility,
        order=body.order if body.order is not None else max_order + 1,
    )
    ev.date_options = body.date_options
    ev.pick_history = []
    ev.updated_at = utcnow().isoformat()
    db.add(ev)
    db.flush()
    if body.status == "awaiting_pick":
        ensure_pick_token(db, ev)
    else:
        db.commit()
    db.refresh(ev)
    return event_to_out(ev)


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    body: EventUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    data = body.model_dump(exclude_unset=True)
    if "date_options" in data:
        ev.date_options = data.pop("date_options")
    for key, value in data.items():
        setattr(ev, key, value)
    if ev.status == "awaiting_pick":
        ensure_pick_token(db, ev)
    ev.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(ev)
    return event_to_out(ev)


@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return {"ok": True}


@router.post("/{event_id}/pick", response_model=EventOut)
def pick_event(
    event_id: str,
    body: PickIn,
    request: Request,
    db: Session = Depends(get_db),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    ev = apply_pick(db, ev, body.date, body.picked_by, request=request)
    return event_to_out(ev)


@router.post("/{event_id}/pick-token", response_model=dict)
def generate_pick_token(
    event_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    token = ensure_pick_token(db, ev)
    return {"pick_token": token}


@router.get("/{event_id}/views", response_model=list)
def list_views(
    event_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev.pick_history


@router.post("/reset")
def reset_events(
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    cfg = resolve_property(db, property)
    if cfg.id != 1:
        raise HTTPException(
            status_code=400,
            detail="Reset demo only applies to the primary seeded listing (rainbow-drive).",
        )
    apply_seed(db, preserve_passcode=True)
    return {"ok": True}
