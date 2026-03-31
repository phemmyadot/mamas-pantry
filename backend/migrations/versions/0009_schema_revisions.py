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
    op.execute("CREATE TYPE auditeventtype AS ENUM ('REGISTER', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'LOGOUT_ALL', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM', 'EMAIL_VERIFICATION_SENT', 'EMAIL_VERIFIED', 'PHONE_OTP_SENT', 'PHONE_VERIFIED', 'TOTP_ENABLED', 'TOTP_DISABLED', 'TOTP_FAILED', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'OAUTH_LOGIN', 'ROLE_ASSIGNED', 'ROLE_REMOVED', 'USER_BANNED', 'TOKEN_REFRESHED')")
    
def downgrade() -> None:
    # New tables
    op.execute("DROP TYPE auditeventtype")
