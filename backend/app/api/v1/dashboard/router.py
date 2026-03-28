"""Admin dashboard, customers, analytics, promo codes, and riders endpoints."""
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import require_role
from app.db.base import get_db
from app.db.models.order import Order, OrderStatus, PaymentStatus
from app.db.models.product import Product
from app.db.models.promo_code import PromoCode
from app.db.models.rider import Rider
from app.db.models.role import Role, UserRole
from app.db.models.user import User
from app.schemas.promo_code import PromoCodeCreate, PromoCodeResponse
from app.schemas.rider import RiderCreate, RiderResponse, RiderUpdate

router = APIRouter(tags=["admin-dashboard"])


# ── Dashboard KPIs ─────────────────────────────────────────────────────────────

class DailyRevenue(BaseModel):
    date: date
    revenue_ngn: float


class DashboardResponse(BaseModel):
    today_revenue_ngn: float
    active_orders_count: int
    low_stock_count: int
    new_customers_today: int
    weekly_revenue: list[DailyRevenue]
    recent_orders: list[dict]


@router.get(
    "/admin/dashboard",
    response_model=DashboardResponse,
    summary="Dashboard KPIs (admin)",
    description="Single call returning KPI cards, weekly revenue chart, and recent orders.",
)
async def dashboard(
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=6)

    # Today's revenue (paid orders only)
    today_rev_row = await db.execute(
        select(func.coalesce(func.sum(Order.total_ngn), 0))
        .where(Order.payment_status == PaymentStatus.paid, Order.created_at >= today_start)
    )
    today_revenue = float(today_rev_row.scalar_one())

    # Active orders (not delivered/cancelled)
    active_count_row = await db.execute(
        select(func.count(Order.id)).where(
            Order.status.not_in([OrderStatus.delivered, OrderStatus.cancelled])
        )
    )
    active_orders = int(active_count_row.scalar_one())

    # Low-stock products (≤5)
    low_stock_row = await db.execute(
        select(func.count(Product.id)).where(Product.stock_qty <= 5, Product.is_active.is_(True))
    )
    low_stock = int(low_stock_row.scalar_one())

    # New customers today
    new_customers_row = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )
    new_customers = int(new_customers_row.scalar_one())

    # Weekly revenue by day (last 7 days)
    weekly_rev_rows = await db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total_ngn), 0).label("revenue"),
        )
        .where(Order.payment_status == PaymentStatus.paid, Order.created_at >= week_start)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    weekly_revenue = [
        DailyRevenue(date=row.day, revenue_ngn=float(row.revenue))
        for row in weekly_rev_rows
    ]

    # Recent 10 orders
    recent_rows = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(10)
    )
    recent_orders = [
        {
            "id": str(o.id),
            "user_id": str(o.user_id),
            "status": o.status.value,
            "payment_status": o.payment_status.value,
            "total_ngn": float(o.total_ngn),
            "created_at": o.created_at.isoformat(),
        }
        for o in recent_rows.scalars().all()
    ]

    return DashboardResponse(
        today_revenue_ngn=today_revenue,
        active_orders_count=active_orders,
        low_stock_count=low_stock,
        new_customers_today=new_customers,
        weekly_revenue=weekly_revenue,
        recent_orders=recent_orders,
    )


# ── Customers ─────────────────────────────────────────────────────────────────

class CustomerSummary(BaseModel):
    id: str
    email: str
    full_name: str | None
    order_count: int
    total_spend_ngn: float
    created_at: datetime


@router.get(
    "/admin/customers",
    response_model=list[CustomerSummary],
    summary="Customer list (admin)",
    description="Paginated customers with order count and total spend.",
)
async def list_customers(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    # Exclude users that have any staff/admin role
    staff_user_ids = select(UserRole.c.user_id).join(
        Role, Role.id == UserRole.c.role_id
    ).where(Role.name.in_(["admin", "super_admin", "staff"]))

    rows = await db.execute(
        select(
            User.id,
            User.email,
            User.username,
            User.created_at,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_ngn), 0).label("total_spend"),
        )
        .outerjoin(Order, Order.user_id == User.id)
        .where(User.id.not_in(staff_user_ids))
        .group_by(User.id)
        .order_by(User.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [
        CustomerSummary(
            id=str(r.id),
            email=r.email,
            full_name=r.username,
            order_count=r.order_count,
            total_spend_ngn=float(r.total_spend),
            created_at=r.created_at,
        )
        for r in rows
    ]


# ── Analytics ─────────────────────────────────────────────────────────────────

class TopProduct(BaseModel):
    product_id: str
    product_name: str
    total_qty: int
    total_revenue_ngn: float


class AnalyticsResponse(BaseModel):
    revenue_by_date: list[DailyRevenue]
    top_products: list[TopProduct]
    category_breakdown: list[dict]


@router.get(
    "/admin/analytics",
    response_model=AnalyticsResponse,
    summary="Analytics (admin)",
)
async def analytics(
    from_date: date = Query(default=None),
    to_date: date = Query(default=None),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from app.db.models.order import OrderItem

    now = datetime.now(timezone.utc)
    if not from_date:
        from_date = (now - timedelta(days=29)).date()
    if not to_date:
        to_date = now.date()

    from_dt = datetime.combine(from_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    to_dt = datetime.combine(to_date, datetime.max.time()).replace(tzinfo=timezone.utc)

    # Revenue by date
    rev_rows = await db.execute(
        select(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total_ngn), 0).label("revenue"),
        )
        .where(
            Order.payment_status == PaymentStatus.paid,
            Order.created_at.between(from_dt, to_dt),
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    revenue_by_date = [
        DailyRevenue(date=r.day, revenue_ngn=float(r.revenue)) for r in rev_rows
    ]

    # Top 10 products by revenue
    top_rows = await db.execute(
        select(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.qty).label("total_qty"),
            func.sum(OrderItem.qty * OrderItem.unit_price_ngn).label("total_revenue"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.payment_status == PaymentStatus.paid,
            Order.created_at.between(from_dt, to_dt),
        )
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.qty * OrderItem.unit_price_ngn).desc())
        .limit(10)
    )
    top_products = [
        TopProduct(
            product_id=str(r.product_id),
            product_name=r.product_name,
            total_qty=int(r.total_qty),
            total_revenue_ngn=float(r.total_revenue),
        )
        for r in top_rows
    ]

    # Category breakdown
    cat_rows = await db.execute(
        select(
            Product.category,
            func.sum(OrderItem.qty * OrderItem.unit_price_ngn).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.payment_status == PaymentStatus.paid,
            Order.created_at.between(from_dt, to_dt),
        )
        .group_by(Product.category)
    )
    category_breakdown = [
        {"category": r.category.value, "revenue_ngn": float(r.revenue)} for r in cat_rows
    ]

    return AnalyticsResponse(
        revenue_by_date=revenue_by_date,
        top_products=top_products,
        category_breakdown=category_breakdown,
    )


# ── Promo Codes ────────────────────────────────────────────────────────────────

@router.get(
    "/admin/promo-codes",
    response_model=list[PromoCodeResponse],
    summary="List promo codes (admin)",
)
async def list_promo_codes(
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PromoCode).order_by(PromoCode.created_at.desc()))
    return list(result.scalars().all())


@router.post(
    "/admin/promo-codes",
    response_model=PromoCodeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create promo code (admin)",
)
async def create_promo_code(
    body: PromoCodeCreate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    promo = PromoCode(**body.model_dump())
    db.add(promo)
    await db.flush()
    await db.refresh(promo)
    return promo


# ── Riders ────────────────────────────────────────────────────────────────────

@router.get(
    "/admin/riders",
    response_model=list[RiderResponse],
    summary="List riders (admin)",
)
async def list_riders(
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Rider).where(Rider.is_active.is_(True)).order_by(Rider.name)
    )
    return list(result.scalars().all())


@router.post(
    "/admin/riders",
    response_model=RiderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create rider (admin)",
)
async def create_rider(
    body: RiderCreate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    rider = Rider(**body.model_dump())
    db.add(rider)
    await db.flush()
    await db.refresh(rider)
    return rider


@router.patch(
    "/admin/riders/{rider_id}",
    response_model=RiderResponse,
    summary="Update rider (admin)",
)
async def update_rider(
    rider_id: str,
    body: RiderUpdate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    result = await db.execute(select(Rider).where(Rider.id == _uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rider not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rider, field, value)
    await db.flush()
    await db.refresh(rider)
    return rider


class LocationUpdate(BaseModel):
    lat: float
    lng: float


@router.patch(
    "/admin/riders/{rider_id}/location",
    response_model=RiderResponse,
    summary="Update rider location",
    description="Updates a rider's current GPS coordinates. Can be called by a WhatsApp bot or mobile app.",
)
async def update_rider_location(
    rider_id: str,
    body: LocationUpdate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    result = await db.execute(select(Rider).where(Rider.id == _uuid.UUID(rider_id)))
    rider = result.scalar_one_or_none()
    if not rider:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rider not found")
    rider.current_lat = body.lat
    rider.current_lng = body.lng
    await db.flush()
    await db.refresh(rider)
    return rider
