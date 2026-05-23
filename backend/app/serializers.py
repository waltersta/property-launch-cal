from .models import Event, PropertyConfig
from .schemas import ConfigOut, EventOut


def config_to_out(cfg: PropertyConfig) -> ConfigOut:
    return ConfigOut(
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
        pick_token=ev.pick_token,
        pick_token_created_at=ev.pick_token_created_at,
        created_at=ev.created_at,
        updated_at=ev.updated_at,
    )
