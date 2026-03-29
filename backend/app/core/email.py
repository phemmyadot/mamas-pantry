from email.message import EmailMessage
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=True)

ORDER_STATUS_LABELS = {
    "pending": "Pending",
    "confirmed": "Confirmed",
    "packed": "Packed",
    "ready_for_pickup": "Ready for pickup",
    "out_for_delivery": "Out for delivery",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
}


async def send_email(to: str, subject: str, template_name: str, context: dict) -> None:
    """Send an HTML email using aiosmtplib + jinja2 template."""
    template = jinja_env.get_template(template_name)
    html_body = template.render(**context)

    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(html_body, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_password_reset_email(to: str, reset_token: str) -> None:
    await send_email(
        to=to,
        subject="Password Reset Request",
        template_name="password_reset.html",
        context={"reset_token": reset_token, "project_name": settings.PROJECT_NAME},
    )


async def send_verification_email(to: str, verification_token: str) -> None:
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    await send_email(
        to=to,
        subject="Verify Your Email",
        template_name="email_verification.html",
        context={"verification_link": verification_link, "project_name": settings.PROJECT_NAME},
    )


async def send_order_status_email(
    to: str,
    order_id: str,
    status: str,
    customer_name: str | None = None,
) -> None:
    await send_email(
        to=to,
        subject=f"Order #{order_id[:8]} is now {ORDER_STATUS_LABELS.get(status, status.replace('_', ' ').title())}",
        template_name="order_status_update.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "order_id": order_id,
            "status_label": ORDER_STATUS_LABELS.get(status, status.replace("_", " ").title()),
            "customer_name": customer_name or "Customer",
            "orders_link": f"{settings.FRONTEND_URL}/orders/{order_id}",
        },
    )
