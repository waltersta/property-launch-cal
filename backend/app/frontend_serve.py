"""Serve Vite production build from FastAPI (single-service deploy on Render)."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# backend/app/frontend_serve.py → repo root → frontend/dist
DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


def _safe_file(path: Path) -> Path | None:
    if not path.is_file():
        return None
    try:
        path.resolve().relative_to(DIST_DIR.resolve())
    except ValueError:
        return None
    return path


def register_frontend(app: FastAPI) -> None:
    if not DIST_DIR.is_dir():
        return

    assets_dir = DIST_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str = ""):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404)

        if full_path:
            found = _safe_file(DIST_DIR / full_path)
            if found:
                return FileResponse(found)

        index = DIST_DIR / "index.html"
        if not index.is_file():
            raise HTTPException(status_code=404, detail="Frontend not built. Run: cd frontend && npm run build")
        return FileResponse(index)
