import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import require_role
from app.db.base import get_db
from app.db.models.user import User
from app.schemas.product import ProductResponse
from app.schemas.shipment import ShipmentCreate, ShipmentResponse, ShipmentUpdate
from app.services.shipment_service import ShipmentService

router = APIRouter(tags=["shipments"])


@router.get(
    "/shipments",
    response_model=list[ShipmentResponse],
    summary="List shipments",
    description="Returns upcoming and recent US import shipments.",
)
async def list_shipments(db: AsyncSession = Depends(get_db)):
    service = ShipmentService(db)
    return await service.list()


@router.get(
    "/shipments/{shipment_id}/products",
    response_model=list[ProductResponse],
    summary="Shipment products",
    description="Returns products available for pre-order on a given shipment.",
)
async def shipment_products(
    shipment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ShipmentService(db)
    return await service.get_products(shipment_id)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.post(
    "/admin/shipments",
    response_model=ShipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create shipment (admin)",
)
async def create_shipment(
    body: ShipmentCreate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ShipmentService(db)
    return await service.create(body)


@router.patch(
    "/admin/shipments/{shipment_id}",
    response_model=ShipmentResponse,
    summary="Update shipment (admin)",
)
async def update_shipment(
    shipment_id: uuid.UUID,
    body: ShipmentUpdate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ShipmentService(db)
    return await service.update(shipment_id, body)
