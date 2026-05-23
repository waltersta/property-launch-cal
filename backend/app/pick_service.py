from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Event, PropertyConfig, utcnow
from .notify import record_pick_notification
from .links import public_base_url


def apply_pick(
    db: Session,
    ev: Event,
    date: str,
    picked_by: str,
    *,
    request=None,
) -> Event:
    if ev.status == "awaiting_pick":
        if date not in ev.date_options:
            raise HTTPException(status_code=400, detail="Invalid date option")
    elif ev.status == "picked":
        raise HTTPException(status_code=400, detail="Date already picked")
    else:
        raise HTTPException(status_code=400, detail="Event is not awaiting a pick")

    history = list(ev.pick_history)
    history.append(
        {
            "date": date,
            "picked_by": picked_by,
            "picked_at": utcnow().isoformat(),
        }
    )
    ev.pick_history = history
    ev.date = date
    ev.status = "picked"
    ev.picked_by = picked_by
    ev.picked_at = utcnow().isoformat()
    ev.date_options = []
    ev.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(ev)

    cfg = db.get(PropertyConfig, 1)
    if cfg:
        base = public_base_url(request, cfg)
        record_pick_notification(db, ev, cfg, schedule_base_url=f"{base}/?view=share")

    return ev
