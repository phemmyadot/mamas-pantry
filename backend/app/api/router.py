from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.users.router import router as users_router
from app.api.v1.products.router import router as products_router
from app.api.v1.orders.router import router as orders_router
from app.api.v1.shipments.router import router as shipments_router
from app.api.v1.pre_orders.router import router as pre_orders_router
from app.api.v1.addresses.router import router as addresses_router
from app.api.v1.dashboard.router import router as dashboard_router
from app.api.v1.loyalty.router import router as loyalty_router
from app.api.v1.riders.router import router as riders_router
from app.core.config import settings

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(products_router)
api_router.include_router(orders_router)
api_router.include_router(shipments_router)
api_router.include_router(pre_orders_router)
api_router.include_router(addresses_router)
api_router.include_router(dashboard_router)
api_router.include_router(loyalty_router)
api_router.include_router(riders_router)

if settings.ENABLE_RBAC:
    from app.api.v1.admin.router import router as admin_router
    api_router.include_router(admin_router)
