from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import SessionLocal
from .frontend_serve import register_frontend
from .routes import admin, config, events, notes, notifications, properties, share
from .seed import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Property Launch Calendar API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(config.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(share.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(properties.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}


register_frontend(app)
