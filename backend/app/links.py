import os
import secrets

from fastapi import Request
from sqlalchemy.orm import Session

from .models import Event, PropertyConfig, utcnow


def public_base_url(request: Request | None, cfg: PropertyConfig | None) -> str:
    env_base = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
    if env_base:
        return env_base
    render_url = os.getenv("RENDER_EXTERNAL_URL", "").strip().rstrip("/")
    if render_url:
        return render_url
    if cfg and getattr(cfg, "public_base_url", None):
        return cfg.public_base_url.strip().rstrip("/")
    if request is not None:
        return str(request.base_url).rstrip("/").replace("/api", "")
    return "http://localhost:5173"


def ensure_pick_token(db: Session, ev: Event) -> str:
    if ev.pick_token:
        return ev.pick_token
    token = secrets.token_urlsafe(24)
    ev.pick_token = token
    ev.pick_token_created_at = utcnow().isoformat()
    ev.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(ev)
    return token
