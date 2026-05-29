from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..agent_service import create_beta_agent
from ..auth import assert_super_admin, create_admin_token, get_admin_context, require_admin
from ..database import get_db
from ..links import public_base_url
from ..models import Agent, utcnow
from ..schemas import (
    AgentClaimIn,
    AgentClaimOut,
    AgentMeOut,
    AgentOut,
    BetaInviteIn,
    BetaInviteOut,
)
router = APIRouter(prefix="/agents", tags=["agents"])


def _agent_out(agent: Agent) -> AgentOut:
    return AgentOut(
        id=agent.id,
        name=agent.name,
        email=agent.email,
        is_super_admin=bool(agent.is_super_admin),
        onboarding_completed=bool((agent.onboarding_completed_at or "").strip()),
    )


@router.get("/me", response_model=AgentMeOut)
def agent_me(ctx=Depends(require_admin), db: Session = Depends(get_db)):
    if ctx.agent_id is None:
        return AgentMeOut(is_super_admin=True, agent=None)
    agent = db.get(Agent, ctx.agent_id)
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid session")
    return AgentMeOut(is_super_admin=bool(agent.is_super_admin), agent=_agent_out(agent))


@router.post("/beta-invite", response_model=BetaInviteOut)
def beta_invite(
    body: BetaInviteIn,
    request: Request,
    ctx=Depends(require_admin),
    db: Session = Depends(get_db),
):
    assert_super_admin(ctx)
    name = (body.name or "").strip()
    email = (body.email or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    agent, cfg = create_beta_agent(db, name, email)
    base = public_base_url(request, cfg)
    invite_path = f"/welcome?token={agent.invite_token}"
    invite_url = f"{base}{invite_path}"

    return BetaInviteOut(
        agent=_agent_out(agent),
        property_slug=cfg.property_slug,
        property_name=cfg.property_name,
        invite_url=invite_url,
    )


@router.post("/claim", response_model=AgentClaimOut)
def claim_invite(body: AgentClaimIn, db: Session = Depends(get_db)):
    token = (body.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Invite token required")

    agent = db.query(Agent).filter(Agent.invite_token == token).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Invalid or expired invite link")
    if agent.is_super_admin:
        raise HTTPException(status_code=400, detail="Invalid invite link")

    admin_token = create_admin_token(db, agent_id=agent.id)
    from ..models import PropertyConfig

    cfg = (
        db.query(PropertyConfig)
        .filter(PropertyConfig.agent_id == agent.id)
        .order_by(PropertyConfig.id)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=500, detail="Trial listing missing")

    return AgentClaimOut(
        admin_token=admin_token,
        agent=_agent_out(agent),
        property_slug=cfg.property_slug,
        property_name=cfg.property_name,
        onboarding_required=not bool((agent.onboarding_completed_at or "").strip()),
    )


@router.post("/onboarding-complete")
def onboarding_complete(ctx=Depends(require_admin), db: Session = Depends(get_db)):
    if ctx.agent_id is None:
        return {"ok": True}
    agent = db.get(Agent, ctx.agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.onboarding_completed_at = utcnow().isoformat()
    db.commit()
    return {"ok": True}
