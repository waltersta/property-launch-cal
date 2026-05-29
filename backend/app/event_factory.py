from .models import Event


def event_from_seed(data: dict, property_id: int = 1) -> Event:
    ev = Event(
        property_id=property_id,
        title=data["title"],
        description=data.get("description", ""),
        category=data.get("category", "general"),
        status=data.get("status", "confirmed"),
        date=data.get("date"),
        end_date=data.get("end_date"),
        time=data.get("time"),
        end_time=data.get("end_time"),
        pick_owner=data.get("pick_owner"),
        assigned_to=data.get("assigned_to"),
        assigned_phone=data.get("assigned_phone"),
        assigned_email=data.get("assigned_email"),
        visibility=data.get("visibility", "public"),
        order=data.get("order", 0),
    )
    ev.date_options = data.get("date_options", [])
    ev.pick_history = []
    return ev
