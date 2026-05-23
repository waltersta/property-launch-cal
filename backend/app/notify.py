import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from .models import PickNotification, PropertyConfig, Event, utcnow

logger = logging.getLogger(__name__)


def format_pick_date(iso: str) -> str:
    y, m, d = iso.split("-")
    from datetime import date

    dt = date(int(y), int(m), int(d))
    return dt.strftime("%A, %B %d, %Y")


def send_pick_email(to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_addr = os.getenv("SMTP_FROM", user or "noreply@localhost")

    if not host or not to_email:
        logger.info("Email skipped (SMTP_HOST or recipient missing): %s", subject)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    if html_body:
        msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            if user and password:
                server.login(user, password)
            server.sendmail(from_addr, [to_email], msg.as_string())
        logger.info("Pick notification email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("Failed to send pick notification email")
        return False


def record_pick_notification(
    db: Session,
    ev: Event,
    cfg: PropertyConfig,
    *,
    schedule_base_url: str = "",
) -> PickNotification:
    chosen = format_pick_date(ev.date or "")
    client_name = ev.picked_by or "Client"
    property_name = cfg.property_name or "Property"

    subject = f"{property_name}: {client_name} chose {chosen}"
    text_body = (
        f"{client_name} confirmed their preferred date for:\n\n"
        f"  {ev.title}\n\n"
        f"  Chosen date: {chosen}\n\n"
        f"Property: {property_name}\n"
    )
    if schedule_base_url:
        text_body += f"\nView schedule: {schedule_base_url}\n"

    html_body = f"""
    <p><strong>{client_name}</strong> confirmed their preferred date for
    <strong>{ev.title}</strong>.</p>
    <p>Chosen date: <strong>{chosen}</strong></p>
    <p>Property: {property_name}</p>
    """

    row = PickNotification(
        event_id=ev.id,
        event_title=ev.title,
        picked_by=client_name,
        picked_date=ev.date or "",
        message=text_body.strip(),
        read=False,
        email_sent=False,
    )

    if cfg.notifications_enabled and cfg.notify_email:
        sent = send_pick_email(cfg.notify_email, subject, text_body, html_body)
        row.email_sent = sent
        row.email_to = cfg.notify_email

    db.add(row)
    db.commit()
    db.refresh(row)
    return row
