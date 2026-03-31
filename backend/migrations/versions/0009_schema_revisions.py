"""Phase 9 schema revisions: audit_logs

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-31
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── audit_logs ────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE auditeventtype AS ENUM ('register', 'login_success', 'login_failed', 'logout', 'logout_all', 'password_reset_request', 'password_reset_confirm', 'email_verification_sent', 'email_verified', 'phone_otp_sent', 'phone_verified', 'totp_enabled', 'totp_disabled', 'totp_failed', 'api_key_created', 'api_key_revoked', 'oauth_login', 'role_assigned', 'role_removed', 'user_banned', 'token_refreshed')")
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "event_type",
            postgresql.ENUM("register", "login_success", "login_failed", "logout", "logout_all", "password_reset_request", "password_reset_confirm", "email_verification_sent", "email_verified", "phone_otp_sent", "phone_verified", "totp_enabled", "totp_disabled", "totp_failed", "api_key_created", "api_key_revoked", "oauth_login", "role_assigned", "role_removed", "user_banned", "token_refreshed",   
            name="auditeventtype",
            create_type=False,),
            nullable=False
        ),
        sa.Column("ip_address", sa.String(45), nullable=False, server_default=""),
        sa.Column("user_agent", sa.String(512), nullable=False, server_default=""),
        sa.Column("metadata", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    
def downgrade() -> None:
    # New tables
    op.drop_index("ix_audit_logs_user_id", "audit_logs")
    op.drop_table("audit_logs")
    op.execute("DROP TYPE auditeventtype")
