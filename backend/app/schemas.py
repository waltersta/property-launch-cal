from typing import Any, Literal

from pydantic import BaseModel, Field


class PartyPerson(BaseModel):
    name: str = ""
    email: str = ""
    color: str = "#e0e7ff"


class ListingParties(BaseModel):
    agent: PartyPerson = Field(default_factory=PartyPerson)
    coordinator: PartyPerson = Field(default_factory=PartyPerson)
    clients: list[PartyPerson] = Field(default_factory=list)


class EventPresetOption(BaseModel):
    title: str
    category: str = "general"


class CategoryPresetOption(BaseModel):
    value: str
    label: str = ""


DealType = Literal["listing", "purchase"]


class ConfigOut(BaseModel):
    property_slug: str
    client_auth_required: bool = False
    property_name: str
    tagline: str
    schedule_type_label: str = "Listing schedule"
    create_property_label: str = "New listing"
    schedule_email_intro: str = ""
    launch_date_label: str
    deal_type: DealType = "listing"
    event_presets: list[EventPresetOption] = Field(default_factory=list)
    category_presets: list[CategoryPresetOption] = Field(default_factory=list)
    hero_image_url: str
    header_image_url: str
    tzid: str
    notifications_enabled: bool
    notify_email: str
    public_base_url: str
    calendar_year: int
    calendar_month_start: int
    calendar_month_end: int
    listing_parties: ListingParties = Field(default_factory=ListingParties)
    updated_at: str = ""


class ConfigUpdate(BaseModel):
    property_slug: str | None = None
    client_passcode: str | None = None
    property_name: str | None = None
    tagline: str | None = None
    schedule_type_label: str | None = None
    create_property_label: str | None = None
    schedule_email_intro: str | None = None
    launch_date_label: str | None = None
    deal_type: DealType | None = None
    event_presets: list[EventPresetOption] | None = None
    category_presets: list[CategoryPresetOption] | None = None
    hero_image_url: str | None = None
    header_image_url: str | None = None
    timezone: str | None = None
    notifications_enabled: bool | None = None
    notify_email: str | None = None
    public_base_url: str | None = None
    calendar_year: int | None = None
    calendar_month_start: int | None = None
    calendar_month_end: int | None = None
    listing_parties: ListingParties | None = None


Visibility = Literal["public", "admin_only"]


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
    visibility: Visibility = "public"
    required_parties: list[str] = Field(default_factory=list)
    completed: bool = False
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
    visibility: Visibility | None = None
    required_parties: list[str] | None = None
    completed: bool | None = None
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
    visibility: Visibility = "public"
    required_parties: list[str] = Field(default_factory=list)
    completed: bool = False
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
    schedule_type_label: str = "Listing schedule"
    create_property_label: str = "New listing"
    client_passcode: str | None = None
    listing_parties: ListingParties | None = None


class AgentOut(BaseModel):
    id: int
    name: str
    email: str = ""
    is_super_admin: bool = False
    onboarding_completed: bool = False


class AgentMeOut(BaseModel):
    is_super_admin: bool
    agent: AgentOut | None = None


class BetaInviteIn(BaseModel):
    name: str
    email: str


class BetaInviteOut(BaseModel):
    agent: AgentOut
    property_slug: str
    property_name: str
    invite_url: str


class AgentClaimIn(BaseModel):
    token: str


class AgentClaimOut(BaseModel):
    admin_token: str
    agent: AgentOut
    property_slug: str
    property_name: str
    onboarding_required: bool = True


class PropertySummary(BaseModel):
    id: int
    property_slug: str
    property_name: str
