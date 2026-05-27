from .listing_parties import parse_listing_parties
from .models import Event, PropertyConfig, ScheduleNote
from .property import client_auth_required
from .schemas import ConfigOut, EventOut, NoteOut


def config_to_out(cfg: PropertyConfig) -> ConfigOut:
    return ConfigOut(
        property_slug=cfg.property_slug or "property",
        client_auth_required=client_auth_required(cfg),
        property_name=cfg.property_name,
        tagline=cfg.tagline,
        launch_date_label=cfg.launch_date_label,
        hero_image_url=cfg.hero_image_url,
        header_image_url=cfg.header_image_url,
        tzid=cfg.timezone,
        notifications_enabled=cfg.notifications_enabled,
        notify_email=cfg.notify_email or "",
        public_base_url=cfg.public_base_url or "",
        calendar_year=cfg.calendar_year,
        calendar_month_start=cfg.calendar_month_start,
        calendar_month_end=cfg.calendar_month_end,
        listing_parties=parse_listing_parties(cfg.listing_parties_json),
    )


def event_to_out(ev: Event) -> EventOut:
    return EventOut(
        id=ev.id,
        order=ev.order,
        title=ev.title,
        description=ev.description,
        category=ev.category,
        status=ev.status,
        date=ev.date,
        end_date=ev.end_date,
        time=ev.time,
        end_time=ev.end_time,
        date_options=ev.date_options,
        pick_owner=ev.pick_owner,
        picked_by=ev.picked_by,
        picked_at=ev.picked_at,
        pick_history=ev.pick_history,
        assigned_to=ev.assigned_to,
        assigned_phone=ev.assigned_phone,
        assigned_email=ev.assigned_email,
        visibility=ev.visibility or "public",
        required_parties=ev.required_parties,
        completed=bool(ev.completed),
        pick_token=ev.pick_token,
        pick_token_created_at=ev.pick_token_created_at,
        created_at=ev.created_at,
        updated_at=ev.updated_at,
    )


def note_to_out(note: ScheduleNote) -> NoteOut:
    return NoteOut(
        id=note.id,
        order=note.order,
        recorded_at=note.recorded_at,
        responsible_party=note.responsible_party,
        status=note.status,
        description=note.description,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )
