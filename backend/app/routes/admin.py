from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import create_admin_token, verify_passcode
from ..database import get_db
from ..models import PropertyConfig
from ..schemas import AdminVerifyIn, AdminVerifyOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/verify", response_model=AdminVerifyOut)
def verify_admin(body: AdminVerifyIn, db: Session = Depends(get_db)):
    cfg = db.get(PropertyConfig, 1)
    if not cfg or not verify_passcode(body.token, cfg.admin_passcode_hash):
        return AdminVerifyOut(valid=False)
    admin_token = create_admin_token(db)
    return AdminVerifyOut(valid=True, admin_token=admin_token)
