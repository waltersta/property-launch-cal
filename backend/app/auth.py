import os
import secrets

import bcrypt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminToken, PropertyConfig


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
