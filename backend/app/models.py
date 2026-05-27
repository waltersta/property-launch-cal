import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class PropertyConfig(Base):
    __tablename__ = "property_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    property_slug: Mapped[str] = mapped_column(String(64), default="property", index=True)
    property_name: Mapped[str] = mapped_column(String(255), default="Property")
    tagline: Mapped[str] = mapped_column(String(255), default="New Listing")
    launch_date_label: Mapped[str] = mapped_column(String(128), default="")
    hero_image_url: Mapped[str] = mapped_column(Text, default="")
    header_image_url: Mapped[str] = mapped_column(Text, default="")
    timezone: Mapped[str] = mapped_column(String(64), default="America/Los_Angeles")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_email: Mapped[str] = mapped_column(String(255), default="")
    public_base_url: Mapped[str] = mapped_column(String(512), default="")
    calendar_year: Mapped[int] = mapped_column(Integer, default=2026)
    calendar_month_start: Mapped[int] = mapped_column(Integer, default=4)
    calendar_month_end: Mapped[int] = mapped_column(Integer, default=5)
    admin_passcode_hash: Mapped[str] = mapped_column(String(255), default="")
    client_passcode_hash: Mapped[str] = mapped_column(String(255), default="")
    listing_parties_json: Mapped[str] = mapped_column(Text, default="")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id: Mapped[int] = mapped_column(Integer, default=1, index=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(32), default="general")
    status: Mapped[str] = mapped_column(String(32), default="confirmed")
    date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(10), nullable=True)
    time: Mapped[str | None] = mapped_column(String(8), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(8), nullable=True)
    date_options_json: Mapped[str] = mapped_column(Text, default="[]")
    pick_owner: Mapped[str | None] = mapped_column(String(128), nullable=True)
    picked_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    picked_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    pick_history_json: Mapped[str] = mapped_column(Text, default="[]")
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assigned_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    assigned_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    visibility: Mapped[str] = mapped_column(String(16), default="public")
    pick_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    pick_token_created_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())

    @property
    def date_options(self) -> list[str]:
        try:
            return json.loads(self.date_options_json or "[]")
        except json.JSONDecodeError:
            return []

    @date_options.setter
    def date_options(self, value: list[str] | None):
        self.date_options_json = json.dumps(value or [])

    @property
    def pick_history(self) -> list:
        try:
            return json.loads(self.pick_history_json or "[]")
        except json.JSONDecodeError:
            return []

    @pick_history.setter
    def pick_history(self, value: list | None):
        self.pick_history_json = json.dumps(value or [])


class ScheduleNote(Base):
    __tablename__ = "schedule_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id: Mapped[int] = mapped_column(Integer, index=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    recorded_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())
    responsible_party: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(64), default="Open")
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())
    updated_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())


class ClientToken(Base):
    __tablename__ = "client_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    property_id: Mapped[int] = mapped_column(Integer, index=True)
    created_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())


class AdminToken(Base):
    __tablename__ = "admin_tokens"

    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())


class PickNotification(Base):
    __tablename__ = "pick_notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String(36))
    event_title: Mapped[str] = mapped_column(String(255))
    picked_by: Mapped[str] = mapped_column(String(128))
    picked_date: Mapped[str] = mapped_column(String(10))
    message: Mapped[str] = mapped_column(Text, default="")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), default=lambda: utcnow().isoformat())
