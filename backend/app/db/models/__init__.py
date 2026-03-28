from app.db.models.user import User
from app.db.models.token import RefreshToken
from app.db.models.product import Product, ProductCategory
from app.db.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.db.models.rider import Rider
from app.db.models.address import Address
from app.db.models.shipment import Shipment, ShipmentStatus
from app.db.models.pre_order import PreOrder, PreOrderStatus
from app.db.models.loyalty import LoyaltyTransaction, LoyaltyTransactionType
from app.db.models.promo_code import PromoCode, DiscountType

__all__ = [
    "User", "RefreshToken",
    "Product", "ProductCategory",
    "Order", "OrderItem", "OrderStatus", "PaymentStatus",
    "Rider",
    "Address",
    "Shipment", "ShipmentStatus",
    "PreOrder", "PreOrderStatus",
    "LoyaltyTransaction", "LoyaltyTransactionType",
    "PromoCode", "DiscountType",
]

# Conditional model imports based on feature flags
from app.core.config import settings

if settings.ENABLE_API_KEY_AUTH:
    from app.db.models.api_key import ApiKey
    __all__.append("ApiKey")

if settings.ENABLE_RBAC:
    from app.db.models.role import Role, UserRole
    __all__.extend(["Role", "UserRole"])

if settings.ENABLE_OAUTH2:
    from app.db.models.oauth_account import OAuthAccount
    __all__.append("OAuthAccount")

if settings.ENABLE_AUDIT_LOGGING:
    from app.db.models.audit_log import AuditLog
    __all__.append("AuditLog")
