from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..models import PickNotification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    q = db.query(PickNotification).order_by(PickNotification.created_at.desc())
    if unread_only:
        q = q.filter(PickNotification.read.is_(False))
    rows = q.limit(50).all()
    return [
        {
            "id": n.id,
            "event_id": n.event_id,
            "event_title": n.event_title,
            "picked_by": n.picked_by,
            "picked_date": n.picked_date,
            "message": n.message,
            "read": n.read,
            "email_sent": n.email_sent,
            "email_to": n.email_to,
            "created_at": n.created_at,
        }
        for n in rows
    ]


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    count = db.query(PickNotification).filter(PickNotification.read.is_(False)).count()
    return {"count": count}


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = db.get(PickNotification, notification_id)
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.read = True
    db.commit()
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    db.query(PickNotification).filter(PickNotification.read.is_(False)).update({"read": True})
    db.commit()
    return {"ok": True}
