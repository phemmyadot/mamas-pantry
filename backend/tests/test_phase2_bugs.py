import uuid

import pytest
from sqlalchemy import select

from app.db.models.loyalty import LoyaltyTransaction
from app.db.models.role import Role, UserRole
from tests.conftest import auth_header, create_test_user, login_user


async def _ensure_role(db_session, name: str, description: str) -> Role:
    result = await db_session.execute(select(Role).where(Role.name == name))
    role = result.scalar_one_or_none()
    if role:
        return role
    role = Role(name=name, description=description)
    db_session.add(role)
    await db_session.flush()
    return role


async def _assign_role(db_session, user_id: str, role_name: str) -> None:
    role = await _ensure_role(db_session, role_name, f"{role_name} role")
    await db_session.execute(
        UserRole.insert().values(user_id=uuid.UUID(user_id), role_id=role.id)
    )
    await db_session.commit()


@pytest.mark.asyncio
async def test_dashboard_new_customers_excludes_admin_and_staff(client, db_session):
    admin = await create_test_user(client, email="admin1@example.com")
    await _assign_role(db_session, admin["id"], "admin")

    staff = await create_test_user(client, email="staff1@example.com")
    await _assign_role(db_session, staff["id"], "staff")

    await create_test_user(client, email="customer1@example.com")

    tokens = await login_user(client, email="admin1@example.com")
    resp = await client.get(
        "/api/v1/admin/dashboard",
        headers=auth_header(tokens["access_token"]),
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["new_customers_today"] == 1


@pytest.mark.asyncio
async def test_update_order_to_delivered_creates_loyalty_record(client, db_session):
    admin = await create_test_user(client, email="admin2@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer2@example.com")

    admin_tokens = await login_user(client, email="admin2@example.com")
    customer_tokens = await login_user(client, email="customer2@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Test Rice",
            "slug": "test-rice",
            "description": "A test product",
            "price_ngn": 2000,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 10,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text
    product_id = product_resp.json()["id"]

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_id, "qty": 1}],
            "delivery_address": {
                "name": "Test Customer",
                "phone": "08031234567",
                "address": "1 Test Street",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    status_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "delivered"},
    )
    assert status_resp.status_code == 200, status_resp.text
    assert status_resp.json()["status"] == "delivered"

    tx_result = await db_session.execute(
        select(LoyaltyTransaction).where(LoyaltyTransaction.order_id == uuid.UUID(order_id))
    )
    tx = tx_result.scalar_one_or_none()
    assert tx is not None
    assert tx.user_id == uuid.UUID(customer["id"])
    assert tx.points >= 1
