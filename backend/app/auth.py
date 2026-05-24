import os
import secrets

import bcrypt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminToken, ClientToken, PropertyConfig


def hash_passcode(passcode: str) -> str:
    return bcrypt.hashpw(passcode.encode(), bcrypt.gensalt()).decode()


def verify_passcode(passcode: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(passcode.encode(), hashed.encode())
    except ValueError:
        return False


def ensure_passcode_hash(db: Session) -> None:
    cfg = db.get(PropertyConfig, 1)
    if not cfg:
        return
    if cfg.admin_passcode_hash:
        return
    default = os.getenv("ADMIN_PASSCODE", "rainbow")
    cfg.admin_passcode_hash = hash_passcode(default)
    db.commit()


def create_admin_token(db: Session) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AdminToken(token=token))
    db.commit()
    return token


def create_client_token(db: Session, property_id: int) -> str:
    token = secrets.token_urlsafe(32)
    db.add(ClientToken(token=token, property_id=property_id))
    db.commit()
    return token


def verify_client_passcode(passcode: str, cfg: PropertyConfig) -> bool:
    if not cfg.client_passcode_hash:
        return True
    return verify_passcode(passcode, cfg.client_passcode_hash)


def set_client_passcode(cfg: PropertyConfig, passcode: str | None) -> None:
    if passcode is None:
        return
    trimmed = passcode.strip()
    if not trimmed:
        cfg.client_passcode_hash = ""
    else:
        cfg.client_passcode_hash = hash_passcode(trimmed)


def require_admin(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    db: Session = Depends(get_db),
) -> str:
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Admin token required")
    row = db.get(AdminToken, x_admin_token)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return x_admin_token
