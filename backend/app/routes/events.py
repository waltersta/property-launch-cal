import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from ..auth import assert_property_admin, require_admin
from ..database import get_db
from ..models import Event, PropertyConfig, utcnow
from ..pick_service import apply_pick
from ..property import is_admin_request, require_listing_access, resolve_property
from ..event_presets import parse_event_presets
from ..links import ensure_pick_token
from ..schemas import (
    EventCreate,
    EventOut,
    EventUpdate,
    ImportEventDraft,
    PickIn,
    TimelineImportApplyIn,
    TimelineImportParseIn,
    TimelineImportParseOut,
)
from ..seed import apply_seed
from ..serializers import event_to_out
from ..timeline_import import calendar_range_for_events, parse_timeline_import

router = APIRouter(prefix="/events", tags=["events"])


def _cfg_for_event(db: Session, ev: Event) -> PropertyConfig:
    cfg = db.get(PropertyConfig, ev.property_id)
    if not cfg:
        raise HTTPException(status_code=404, detail="Property not found")
    return cfg


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
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
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
        completed=body.completed,
        order=body.order if body.order is not None else max_order + 1,
    )
    ev.date_options = body.date_options
    ev.required_parties = body.required_parties
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
    ctx=Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    assert_property_admin(_cfg_for_event(db, ev), ctx)
    data = body.model_dump(exclude_unset=True)
    if "date_options" in data:
        ev.date_options = data.pop("date_options")
    if "required_parties" in data:
        ev.required_parties = data.pop("required_parties")
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
    ctx=Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    assert_property_admin(_cfg_for_event(db, ev), ctx)
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
    ctx=Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    assert_property_admin(_cfg_for_event(db, ev), ctx)
    token = ensure_pick_token(db, ev)
    return {"pick_token": token}


@router.get("/{event_id}/views", response_model=list)
def list_views(
    event_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    ev = db.get(Event, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    assert_property_admin(_cfg_for_event(db, ev), ctx)
    return ev.pick_history


def _draft_to_event(cfg: PropertyConfig, body: ImportEventDraft, order: int) -> Event:
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
        completed=body.completed,
        order=order,
    )
    ev.date_options = body.date_options
    ev.required_parties = []
    ev.pick_history = []
    ev.updated_at = utcnow().isoformat()
    return ev


@router.post("/import/parse", response_model=TimelineImportParseOut)
def parse_import(
    body: TimelineImportParseIn,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
    presets = parse_event_presets(cfg.event_presets_json)
    tzid = body.timezone or cfg.timezone or "America/Los_Angeles"
    result = parse_timeline_import(
        text=body.text,
        image_base64=body.image_base64,
        tzid=tzid,
        event_presets=presets,
    )
    return TimelineImportParseOut(
        events=[ImportEventDraft(**e) for e in result["events"]],
        notes=result.get("notes") or "",
        source=result.get("source") or "none",
    )


@router.post("/import/apply", response_model=list[EventOut])
def apply_import(
    body: TimelineImportApplyIn,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
    if not body.events:
        raise HTTPException(status_code=400, detail="No events to import")

    if body.mode == "replace":
        db.query(Event).filter(Event.property_id == cfg.id).delete(synchronize_session=False)
        start_order = 1
    else:
        start_order = db.query(Event).filter(Event.property_id == cfg.id).count() + 1

    created: list[Event] = []
    for idx, draft in enumerate(body.events):
        ev = _draft_to_event(cfg, draft, start_order + idx)
        db.add(ev)
        created.append(ev)

    db.flush()
    for ev in created:
        if ev.status == "awaiting_pick":
            ensure_pick_token(db, ev)

    if body.update_calendar_range:
        cal = calendar_range_for_events([d.model_dump() for d in body.events])
        if cal:
            year, month_start, month_end = cal
            cfg.calendar_year = year
            cfg.calendar_month_start = month_start
            cfg.calendar_month_end = month_end
            cfg.updated_at = utcnow().isoformat()

    db.commit()
    for ev in created:
        db.refresh(ev)
    return [event_to_out(e) for e in created]


@router.post("/reset")
def reset_events(
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
    if cfg.id != 1:
        raise HTTPException(
            status_code=400,
            detail="Reset demo only applies to the primary seeded listing (rainbow-drive).",
        )
    apply_seed(db, preserve_passcode=True)
    return {"ok": True}
