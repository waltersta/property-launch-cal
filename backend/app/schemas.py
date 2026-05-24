from typing import Any

from pydantic import BaseModel, Field


class ConfigOut(BaseModel):
    property_slug: str
    client_auth_required: bool = False
    property_name: str
    tagline: str
    launch_date_label: str
    hero_image_url: str
    header_image_url: str
    tzid: str
    notifications_enabled: bool
    notify_email: str
    public_base_url: str
    calendar_year: int
    calendar_month_start: int
    calendar_month_end: int


class ConfigUpdate(BaseModel):
    property_slug: str | None = None
    client_passcode: str | None = None
    property_name: str | None = None
    tagline: str | None = None
    launch_date_label: str | None = None
    hero_image_url: str | None = None
    header_image_url: str | None = None
    timezone: str | None = None
    notifications_enabled: bool | None = None
    notify_email: str | None = None
    public_base_url: str | None = None
    calendar_year: int | None = None
    calendar_month_start: int | None = None
    calendar_month_end: int | None = None


class EventBase(BaseModel):
    title: str
    description: str = ""
    category: str = "general"
    status: str = "confirmed"
    date: str | None = None
    end_date: str | None = None
    time: str | None = None
    end_time: str | None = None
    date_options: list[str] = Field(default_factory=list)
    pick_owner: str | None = None
    assigned_to: str | None = None
    assigned_phone: str | None = None
    assigned_email: str | None = None
    order: int | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: str | None = None
    date: str | None = None
    end_date: str | None = None
    time: str | None = None
    end_time: str | None = None
    date_options: list[str] | None = None
    pick_owner: str | None = None
    assigned_to: str | None = None
    assigned_phone: str | None = None
    assigned_email: str | None = None
    order: int | None = None


class EventOut(BaseModel):
    id: str
    order: int
    title: str
    description: str
    category: str
    status: str
    date: str | None
    end_date: str | None
    time: str | None
    end_time: str | None
    date_options: list[str]
    pick_owner: str | None
    picked_by: str | None
    picked_at: str | None
    pick_history: list[Any]
    assigned_to: str | None
    assigned_phone: str | None
    assigned_email: str | None
    pick_token: str | None
    pick_token_created_at: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class AdminVerifyIn(BaseModel):
    token: str


class AdminVerifyOut(BaseModel):
    valid: bool
    admin_token: str | None = None


class PickIn(BaseModel):
    date: str
    picked_by: str


class SharePickOut(BaseModel):
    event: EventOut
    property_name: str


class NoteOut(BaseModel):
    id: str
    order: int
    recorded_at: str
    responsible_party: str
    status: str
    description: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    recorded_at: str | None = None
    responsible_party: str = ""
    status: str = "Open"
    description: str = ""
    order: int | None = None


class NoteUpdate(BaseModel):
    recorded_at: str | None = None
    responsible_party: str | None = None
    status: str | None = None
    description: str | None = None
    order: int | None = None


class ClientAuthIn(BaseModel):
    property: str
    passcode: str


class ClientAuthOut(BaseModel):
    valid: bool
    client_token: str | None = None


class PropertyCreate(BaseModel):
    property_name: str
    property_slug: str | None = None
    tagline: str = "New Listing"
    client_passcode: str | None = None


class PropertySummary(BaseModel):
    id: int
    property_slug: str
    property_name: str
