import os
import secrets
from dataclasses import dataclass

import bcrypt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db
from .models import AdminToken, Agent, ClientToken, PropertyConfig


@dataclass
class AdminContext:
    token: str
    agent_id: int | None
    is_super_admin: bool


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


def create_admin_token(db: Session, agent_id: int | None = None) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AdminToken(token=token, agent_id=agent_id))
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


def get_admin_context(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    db: Session = Depends(get_db),
) -> AdminContext:
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Admin token required")
    row = db.get(AdminToken, x_admin_token)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    if row.agent_id is None:
        return AdminContext(token=x_admin_token, agent_id=None, is_super_admin=True)
    agent = db.get(Agent, row.agent_id)
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return AdminContext(
        token=x_admin_token,
        agent_id=agent.id,
        is_super_admin=bool(agent.is_super_admin),
    )


def require_admin(ctx: AdminContext = Depends(get_admin_context)) -> AdminContext:
    return ctx


def optional_admin_context(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    db: Session = Depends(get_db),
) -> AdminContext | None:
    if not x_admin_token:
        return None
    row = db.get(AdminToken, x_admin_token)
    if not row:
        return None
    if row.agent_id is None:
        return AdminContext(token=x_admin_token, agent_id=None, is_super_admin=True)
    agent = db.get(Agent, row.agent_id)
    if not agent:
        return None
    return AdminContext(
        token=x_admin_token,
        agent_id=agent.id,
        is_super_admin=bool(agent.is_super_admin),
    )


def assert_property_admin(cfg: PropertyConfig, ctx: AdminContext) -> None:
    if ctx.is_super_admin:
        return
    if cfg.agent_id is None or cfg.agent_id != ctx.agent_id:
        raise HTTPException(status_code=403, detail="Not your listing")


def assert_super_admin(ctx: AdminContext) -> None:
    if not ctx.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin only")


def property_query_for_admin(db: Session, ctx: AdminContext):
    q = db.query(PropertyConfig)
    if not ctx.is_super_admin:
        q = q.filter(PropertyConfig.agent_id == ctx.agent_id)
    return q
