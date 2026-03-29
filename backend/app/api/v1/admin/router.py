import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import require_role
from app.core.audit import emit_audit_log
from app.db.base import get_db
from app.db.models.audit_log import AuditEventType, AuditLog
from app.db.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


ACCESS_ROLE_NAMES = {"staff", "rider"}


class CreateAccessUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    role: str


class StaffPerformanceOrder(BaseModel):
    id: uuid.UUID
    status: str
    payment_status: str
    total_ngn: float
    item_count: int
    created_at: datetime
    processing_minutes: float


class StaffPerformanceMetrics(BaseModel):
    total_orders: int
    paid_orders: int
    pending_orders: int
    total_items: int
    total_revenue_ngn: float
    avg_time_per_item_minutes: float
    avg_order_processing_minutes: float
    avg_daily_orders: float
    avg_daily_revenue_ngn: float
    first_order_at: datetime | None
    last_order_at: datetime | None


class StaffPerformanceResponse(BaseModel):
    user: UserResponse
    metrics: StaffPerformanceMetrics
    recent_orders: list[StaffPerformanceOrder]


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List all users",
    description="Returns a paginated list of all users. Admin only.",
)
async def list_users(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_users(offset=offset, limit=limit)


@router.get(
    "/staff-users",
    response_model=list[UserResponse],
    summary="List staff/rider users",
)
async def list_staff_users(
    role: str | None = Query(default=None, description="Optional role filter: staff or rider"),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    if role:
        role_name = role.strip().lower()
        if role_name not in ACCESS_ROLE_NAMES:
            from app.core.exceptions import ValidationError

            raise ValidationError("Role must be either 'staff' or 'rider'")
        return await service.list_users_by_role_names([role_name])
    return await service.list_users_by_role_names(sorted(ACCESS_ROLE_NAMES))


@router.get(
    "/staff-users/{user_id}/performance",
    response_model=StaffPerformanceResponse,
    summary="Staff performance detail",
)
async def get_staff_performance(
    user_id: uuid.UUID,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_staff_performance(user_id=user_id)


@router.post(
    "/staff-users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create staff/rider account",
)
async def create_staff_user(
    body: CreateAccessUserRequest,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    role_name = body.role.strip().lower()
    if role_name not in ACCESS_ROLE_NAMES:
        from app.core.exceptions import ValidationError

        raise ValidationError("Role must be either 'staff' or 'rider'")
    service = AdminService(db)
    user = await service.create_user_with_role(
        email=body.email,
        password=body.password,
        username=body.username,
        role_name=role_name,
    )
    emit_audit_log(
        AuditEventType.ROLE_ASSIGNED,
        user_id=user.id,
        metadata={"role": role_name, "created_by": str(_current_user.id)},
    )
    return user


@router.post(
    "/users/{user_id}/access-role",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Assign staff/rider role (admin)",
)
async def assign_access_role(
    user_id: uuid.UUID,
    role: str = Query(..., description="staff or rider"),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    role_name = role.strip().lower()
    if role_name not in ACCESS_ROLE_NAMES:
        from app.core.exceptions import ValidationError

        raise ValidationError("Role must be either 'staff' or 'rider'")
    service = AdminService(db)
    await service.assign_named_role(user_id=user_id, role_name=role_name)
    emit_audit_log(
        AuditEventType.ROLE_ASSIGNED,
        user_id=user_id,
        metadata={"role": role_name, "assigned_by": str(_current_user.id)},
    )


@router.delete(
    "/users/{user_id}/access-role",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove staff/rider role (admin)",
)
async def remove_access_role(
    user_id: uuid.UUID,
    role: str = Query(..., description="staff or rider"),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    role_name = role.strip().lower()
    if role_name not in ACCESS_ROLE_NAMES:
        from app.core.exceptions import ValidationError

        raise ValidationError("Role must be either 'staff' or 'rider'")
    service = AdminService(db)
    await service.remove_named_role(user_id=user_id, role_name=role_name)
    emit_audit_log(
        AuditEventType.ROLE_REMOVED,
        user_id=user_id,
        metadata={"role": role_name, "removed_by": str(_current_user.id)},
    )


@router.post(
    "/users/{user_id}/roles",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Assign role to user",
    description="Assigns a role to a user by role_id. Super admin only.",
)
async def assign_role(
    user_id: uuid.UUID,
    role_id: uuid.UUID = Query(...),
    _current_user: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    await service.assign_role(user_id=user_id, role_id=role_id)
    emit_audit_log(
        AuditEventType.ROLE_ASSIGNED,
        user_id=user_id,
        metadata={"role_id": str(role_id), "assigned_by": str(_current_user.id)},
    )


@router.delete(
    "/users/{user_id}/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove role from user",
    description="Removes a role from a user. Super admin only.",
)
async def remove_role(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    _current_user: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    await service.remove_role(user_id=user_id, role_id=role_id)
    emit_audit_log(
        AuditEventType.ROLE_REMOVED,
        user_id=user_id,
        metadata={"role_id": str(role_id), "removed_by": str(_current_user.id)},
    )


@router.post(
    "/users/{user_id}/ban",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Ban user",
    description="Deactivates account and revokes all tokens. Admin only.",
)
async def ban_user(
    user_id: uuid.UUID,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    await service.ban_user(user_id=user_id)
    emit_audit_log(
        AuditEventType.USER_BANNED,
        user_id=user_id,
        metadata={"banned_by": str(_current_user.id)},
    )


@router.post(
    "/users/{user_id}/unban",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unban user",
    description="Reactivates a banned account. Admin only.",
)
async def unban_user(
    user_id: uuid.UUID,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    await service.unban_user(user_id=user_id)


@router.get(
    "/audit-logs",
    response_model=list[AuditLogResponse],
    summary="List audit logs",
    description="Returns paginated audit logs. Filterable by user_id, event_type, and date range. Admin only.",
)
async def list_audit_logs(
    user_id: uuid.UUID | None = Query(default=None),
    event_type: AuditEventType | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if start_date:
        query = query.where(AuditLog.created_at >= start_date)
    if end_date:
        query = query.where(AuditLog.created_at <= end_date)
    query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())
