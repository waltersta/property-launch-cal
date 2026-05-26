"""One-shot SQLite migration helpers.

Runs once at startup, before the SQLAlchemy engine connects, to adopt a
database file dropped onto the persistent disk by an operator.

Resolution order for the live DB (only when target is missing/empty):
1. ``<target_dir>/migrate.db`` — uploaded via admin endpoint or Render Shell.
2. ``backend/data/schedule.db`` — legacy in-repo location (local dev only;
   never present on Render because ``*.db`` is gitignored).
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path
from urllib.parse import urlparse


def sqlite_target(database_url: str) -> Path | None:
    """Return the on-disk path for a SQLite DATABASE_URL, or None for other engines."""
    if not database_url.startswith("sqlite"):
        return None
    parsed = urlparse(database_url)
    raw = parsed.path or database_url.split("sqlite:", 1)[1]
    while raw.startswith("//"):
        raw = raw[1:]
    if not raw:
        return None
    return Path(raw).resolve()


def _has_data(path: Path) -> bool:
    try:
        return path.is_file() and path.stat().st_size > 0
    except OSError:
        return False


def migrate_database(database_url: str, legacy_path: Path | None = None) -> None:
    target = sqlite_target(database_url)
    if target is None:
        return

    if _has_data(target):
        return

    target.parent.mkdir(parents=True, exist_ok=True)

    staging = target.parent / "migrate.db"
    if _has_data(staging):
        os.replace(staging, target)
        print(f"[db_migrate] promoted {staging} -> {target}")
        return

    if legacy_path and _has_data(legacy_path) and legacy_path.resolve() != target:
        shutil.copy2(legacy_path, target)
        print(f"[db_migrate] copied legacy {legacy_path} -> {target}")
