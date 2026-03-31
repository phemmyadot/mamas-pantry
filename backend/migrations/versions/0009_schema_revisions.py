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
    
def downgrade() -> None:
    # New tables
    op.execute("DROP TYPE auditeventtype")
