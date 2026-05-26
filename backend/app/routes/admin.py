from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import create_admin_token, hash_passcode, require_admin, verify_passcode
from ..database import DATABASE_URL, get_db
from ..db_migrate import sqlite_target
from ..models import PropertyConfig
from ..schemas import AdminPasscodeChangeIn, AdminVerifyIn, AdminVerifyOut

router = APIRouter(prefix="/admin", tags=["admin"])

MAX_DB_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB ceiling for a tiny SQLite file


@router.post("/verify", response_model=AdminVerifyOut)
def verify_admin(body: AdminVerifyIn, db: Session = Depends(get_db)):
    cfg = db.get(PropertyConfig, 1)
    if not cfg or not verify_passcode(body.token, cfg.admin_passcode_hash):
        return AdminVerifyOut(valid=False)
    admin_token = create_admin_token(db)
    return AdminVerifyOut(valid=True, admin_token=admin_token)


@router.post("/change-passcode", dependencies=[Depends(require_admin)])
def change_admin_passcode(body: AdminPasscodeChangeIn, db: Session = Depends(get_db)):
    new_hash = hash_passcode(body.new_passcode.strip())
    rows = db.query(PropertyConfig).all()
    if not rows:
        raise HTTPException(status_code=404, detail="No property config to update")
    for cfg in rows:
        cfg.admin_passcode_hash = new_hash
    db.commit()
    return {"ok": True, "updated": len(rows)}


def _live_sqlite_path() -> Path:
    target = sqlite_target(DATABASE_URL)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database is not SQLite; download/upload not supported.",
        )
    return target


@router.get("/db-download", dependencies=[Depends(require_admin)])
def db_download():
    path = _live_sqlite_path()
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(
        path,
        media_type="application/octet-stream",
        filename="schedule.db",
    )


@router.post("/db-upload", dependencies=[Depends(require_admin)])
async def db_upload(file: UploadFile):
    target = _live_sqlite_path()
    staging = target.parent / "migrate.db"
    staging.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    with open(staging, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            written += len(chunk)
            if written > MAX_DB_UPLOAD_BYTES:
                out.close()
                staging.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File too large")
            out.write(chunk)

    if written < 100 or not _looks_like_sqlite(staging):
        staging.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Not a valid SQLite file")

    return {
        "ok": True,
        "staged_bytes": written,
        "staged_path": str(staging),
        "message": "Restart the service to adopt this DB (auto-promoted on next boot).",
    }


def _looks_like_sqlite(path: Path) -> bool:
    try:
        with open(path, "rb") as f:
            header = f.read(16)
    except OSError:
        return False
    return header.startswith(b"SQLite format 3\x00")
