from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import assert_property_admin, require_admin
from ..database import get_db
from ..models import PropertyConfig, ScheduleNote, utcnow
from ..property import require_listing_access, resolve_property
from ..schemas import NoteCreate, NoteOut, NoteUpdate
from ..serializers import note_to_out

router = APIRouter(prefix="/notes", tags=["notes"])


def _cfg_for_note(db: Session, note: ScheduleNote) -> PropertyConfig:
    cfg = db.get(PropertyConfig, note.property_id)
    if not cfg:
        raise HTTPException(status_code=404, detail="Property not found")
    return cfg


@router.get("", response_model=list[NoteOut])
def list_notes(
    cfg=Depends(require_listing_access),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ScheduleNote)
        .filter(ScheduleNote.property_id == cfg.id)
        .order_by(ScheduleNote.order, ScheduleNote.recorded_at)
        .all()
    )
    return [note_to_out(n) for n in rows]


@router.post("", response_model=NoteOut)
def create_note(
    body: NoteCreate,
    property: str | None = Query(None),
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    cfg = resolve_property(db, property)
    assert_property_admin(cfg, ctx)
    count = db.query(ScheduleNote).filter(ScheduleNote.property_id == cfg.id).count()
    note = ScheduleNote(
        property_id=cfg.id,
        order=body.order if body.order is not None else count + 1,
        recorded_at=body.recorded_at or utcnow().isoformat(),
        responsible_party=body.responsible_party,
        status=body.status or "Open",
        description=body.description,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note_to_out(note)


@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: str,
    body: NoteUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    note = db.get(ScheduleNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    assert_property_admin(_cfg_for_note(db, note), ctx)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(note, key, value)
    note.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(note)
    return note_to_out(note)


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    ctx=Depends(require_admin),
):
    note = db.get(ScheduleNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    assert_property_admin(_cfg_for_note(db, note), ctx)
    db.delete(note)
    db.commit()
    return {"ok": True}
