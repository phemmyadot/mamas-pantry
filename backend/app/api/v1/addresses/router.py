import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user
from app.db.base import get_db
from app.db.models.address import Address
from app.db.models.delivery_zone_fee import DeliveryZoneFee
from app.db.models.user import User
from app.schemas.delivery_zone import DeliveryZoneFeeResponse
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate

router = APIRouter(tags=["addresses"])


@router.get(
    "/delivery-zones",
    response_model=list[DeliveryZoneFeeResponse],
    summary="Delivery zones and fees",
)
async def delivery_zones(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DeliveryZoneFee).order_by(DeliveryZoneFee.area.asc()))
    return [
        DeliveryZoneFeeResponse(
            id=str(z.id),
            area=z.area,
            fee_ngn=float(z.fee_ngn),
            created_at=z.created_at,
            updated_at=z.updated_at,
        )
        for z in result.scalars().all()
    ]


@router.get(
    "/addresses",
    response_model=list[AddressResponse],
    summary="My saved addresses",
)
async def list_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.created_at.asc())
    )
    return list(result.scalars().all())


@router.post(
    "/addresses",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a delivery address",
)
async def create_address(
    body: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # If this is set as default, clear other defaults first
    if body.is_default:
        existing = await db.execute(
            select(Address).where(Address.user_id == current_user.id, Address.is_default.is_(True))
        )
        for addr in existing.scalars().all():
            addr.is_default = False

    address = Address(user_id=current_user.id, **body.model_dump())
    db.add(address)
    await db.flush()
    await db.refresh(address)
    return address


@router.patch(
    "/addresses/{address_id}",
    response_model=AddressResponse,
    summary="Update a delivery address",
)
async def update_address(
    address_id: uuid.UUID,
    body: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()
    if not address:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Address not found")

    if body.is_default:
        existing = await db.execute(
            select(Address).where(Address.user_id == current_user.id, Address.is_default.is_(True))
        )
        for addr in existing.scalars().all():
            addr.is_default = False

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    await db.flush()
    await db.refresh(address)
    return address


@router.delete(
    "/addresses/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a delivery address",
)
async def delete_address(
    address_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()
    if not address:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(address)
    await db.flush()
