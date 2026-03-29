import uuid
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProductCategory(str, enum.Enum):
    imported = "imported"
    local = "local"
    chilled = "chilled"
    household = "household"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_ngn: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    compare_price_ngn: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    category: Mapped[ProductCategory] = mapped_column(
        Enum(ProductCategory, name="productcategory"), nullable=False, index=True
    )
    is_mums_pick: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    badge: Mapped[str | None] = mapped_column(String(50), nullable=True)
    origin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    images: Mapped[list[str]] = mapped_column(ARRAY(String(500)), nullable=False, server_default="{}")
    stock_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product", lazy="noload")
    pre_orders: Mapped[list["PreOrder"]] = relationship("PreOrder", back_populates="product", lazy="noload")
