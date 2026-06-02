from sqlalchemy.orm import Session

from .models import PropertyConfig, SiteBrand, utcnow

DEFAULT_HEADER_IMAGE_URL = "/header.png"


def ensure_site_brand(db: Session) -> SiteBrand:
    row = db.get(SiteBrand, 1)
    if row:
        return row

    migrated = DEFAULT_HEADER_IMAGE_URL
    first = db.query(PropertyConfig).order_by(PropertyConfig.id).first()
    if first and (first.header_image_url or "").strip():
        migrated = first.header_image_url.strip()

    row = SiteBrand(id=1, header_image_url=migrated, updated_at=utcnow().isoformat())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_site_header_url(db: Session) -> str:
    row = ensure_site_brand(db)
    url = (row.header_image_url or "").strip()
    if not url:
        if row.header_image_url != DEFAULT_HEADER_IMAGE_URL:
            row.header_image_url = DEFAULT_HEADER_IMAGE_URL
            row.updated_at = utcnow().isoformat()
            db.commit()
        return DEFAULT_HEADER_IMAGE_URL
    return url


def set_site_header_url(db: Session, url: str) -> SiteBrand:
    row = ensure_site_brand(db)
    trimmed = (url or "").strip()
    row.header_image_url = trimmed if trimmed else DEFAULT_HEADER_IMAGE_URL
    row.updated_at = utcnow().isoformat()
    db.commit()
    db.refresh(row)
    return row
