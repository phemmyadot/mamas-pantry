import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditEventType(str, enum.Enum):
    REGISTER = "REGISTER"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    LOGOUT_ALL = "LOGOUT_ALL"
    PASSWORD_RESET_REQUEST = "PASSWORD_RESET_REQUEST"
    PASSWORD_RESET_CONFIRM = "PASSWORD_RESET_CONFIRM"
    EMAIL_VERIFICATION_SENT = "EMAIL_VERIFICATION_SENT"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    PHONE_OTP_SENT = "PHONE_OTP_SENT"
    PHONE_VERIFIED = "PHONE_VERIFIED"
    TOTP_ENABLED = "TOTP_ENABLED"
    TOTP_DISABLED = "TOTP_DISABLED"
    TOTP_FAILED = "TOTP_FAILED"
    API_KEY_CREATED = "API_KEY_CREATED"
    API_KEY_REVOKED = "API_KEY_REVOKED"
    OAUTH_LOGIN = "OAUTH_LOGIN"
    ROLE_ASSIGNED = "ROLE_ASSIGNED"
    ROLE_REMOVED = "ROLE_REMOVED"
    USER_BANNED = "USER_BANNED"
    TOKEN_REFRESHED = "TOKEN_REFRESHED"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type: Mapped[AuditEventType] = mapped_column(
        Enum(AuditEventType, name="auditeventtype"), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(
        String(45), nullable=False, default="")
    user_agent: Mapped[str] = mapped_column(
        String(512), nullable=False, default="")
    metadata_: Mapped[dict] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
