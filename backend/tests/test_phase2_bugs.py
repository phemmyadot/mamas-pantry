import uuid
from decimal import Decimal

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

    rider_resp = await client.post(
        "/api/v1/admin/riders",
        headers=auth_header(admin_tokens["access_token"]),
        json={"name": "Delivered Rider", "phone": "08037770000"},
    )
    assert rider_resp.status_code == 201, rider_resp.text
    rider_id = rider_resp.json()["id"]

    out_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "out_for_delivery"},
    )
    assert out_resp.status_code == 200, out_resp.text

    assign_resp = await client.post(
        f"/api/v1/admin/orders/{order_id}/assign-rider",
        headers=auth_header(admin_tokens["access_token"]),
        json={"rider_id": rider_id},
    )
    assert assign_resp.status_code == 200, assign_resp.text

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


@pytest.mark.asyncio
async def test_customer_order_includes_rider_when_out_for_delivery(client, db_session):
    admin = await create_test_user(client, email="admin3@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer3@example.com")

    admin_tokens = await login_user(client, email="admin3@example.com")
    customer_tokens = await login_user(client, email="customer3@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Delivery Test Beans",
            "slug": "delivery-test-beans",
            "description": "Delivery test product",
            "price_ngn": 3500,
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
                "name": "Delivery Customer",
                "phone": "08035550000",
                "address": "2 Delivery Street",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    rider_resp = await client.post(
        "/api/v1/admin/riders",
        headers=auth_header(admin_tokens["access_token"]),
        json={"name": "Tunde Rider", "phone": "08039990000"},
    )
    assert rider_resp.status_code == 201, rider_resp.text
    rider_id = rider_resp.json()["id"]

    status_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "out_for_delivery"},
    )
    assert status_resp.status_code == 200, status_resp.text

    assign_resp = await client.post(
        f"/api/v1/admin/orders/{order_id}/assign-rider",
        headers=auth_header(admin_tokens["access_token"]),
        json={"rider_id": rider_id},
    )
    assert assign_resp.status_code == 200, assign_resp.text

    my_order_resp = await client.get(
        f"/api/v1/orders/me/{order_id}",
        headers=auth_header(customer_tokens["access_token"]),
    )
    assert my_order_resp.status_code == 200, my_order_resp.text
    data = my_order_resp.json()
    assert data["status"] == "out_for_delivery"
    assert data["rider_id"] == rider_id
    assert data["rider"] is not None
    assert data["rider"]["name"] == "Tunde Rider"
    assert data["rider"]["phone"] == "08039990000"


@pytest.mark.asyncio
async def test_assign_rider_requires_out_for_delivery_status(client, db_session):
    admin = await create_test_user(client, email="admin4@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer4@example.com")

    admin_tokens = await login_user(client, email="admin4@example.com")
    customer_tokens = await login_user(client, email="customer4@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Assignment Rule Product",
            "slug": "assignment-rule-product",
            "description": "Rule test product",
            "price_ngn": 2000,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 5,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "delivery_address": {
                "name": "Rule Customer",
                "phone": "08031110000",
                "address": "3 Rule Street",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    rider_resp = await client.post(
        "/api/v1/admin/riders",
        headers=auth_header(admin_tokens["access_token"]),
        json={"name": "Rule Rider", "phone": "08038880000"},
    )
    assert rider_resp.status_code == 201, rider_resp.text

    assign_resp = await client.post(
        f"/api/v1/admin/orders/{order_id}/assign-rider",
        headers=auth_header(admin_tokens["access_token"]),
        json={"rider_id": rider_resp.json()["id"]},
    )
    assert assign_resp.status_code == 422


@pytest.mark.asyncio
async def test_delivered_status_requires_assigned_rider(client, db_session):
    admin = await create_test_user(client, email="admin5@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer5@example.com")

    admin_tokens = await login_user(client, email="admin5@example.com")
    customer_tokens = await login_user(client, email="customer5@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Delivered Rule Product",
            "slug": "delivered-rule-product",
            "description": "Delivered rule test product",
            "price_ngn": 2200,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 5,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "delivery_address": {
                "name": "Delivered Rule Customer",
                "phone": "08032220000",
                "address": "5 Rule Avenue",
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
    assert status_resp.status_code == 422


@pytest.mark.asyncio
async def test_create_order_rejects_non_nigerian_phone(client, db_session):
    customer = await create_test_user(client, email="customer6@example.com")
    admin = await create_test_user(client, email="admin6@example.com")
    await _assign_role(db_session, admin["id"], "admin")

    admin_tokens = await login_user(client, email="admin6@example.com")
    customer_tokens = await login_user(client, email="customer6@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Phone Validation Product",
            "slug": "phone-validation-product",
            "description": "Phone validation test product",
            "price_ngn": 1500,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 10,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "delivery_address": {
                "name": "Phone Test Customer",
                "phone": "08AB123CD67",
                "address": "6 Validation Road",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 422


@pytest.mark.asyncio
async def test_pickup_orders_use_ready_for_pickup_and_disallow_rider_assignment(client, db_session):
    admin = await create_test_user(client, email="admin7@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer7@example.com")

    admin_tokens = await login_user(client, email="admin7@example.com")
    customer_tokens = await login_user(client, email="customer7@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Pickup Rule Product",
            "slug": "pickup-rule-product",
            "description": "Pickup flow test product",
            "price_ngn": 3500,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 10,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "fulfillment_type": "pickup",
            "delivery_address": {
                "name": "Pickup Customer",
                "phone": "08030001111",
                "address": "Pickup Desk",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]
    assert Decimal(str(order_resp.json()["delivery_fee_ngn"])) == Decimal("0")

    out_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "out_for_delivery"},
    )
    assert out_resp.status_code == 422

    ready_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "ready_for_pickup"},
    )
    assert ready_resp.status_code == 200, ready_resp.text

    rider_resp = await client.post(
        "/api/v1/admin/riders",
        headers=auth_header(admin_tokens["access_token"]),
        json={"name": "Pickup Rider", "phone": "08036660000"},
    )
    assert rider_resp.status_code == 201, rider_resp.text

    assign_resp = await client.post(
        f"/api/v1/admin/orders/{order_id}/assign-rider",
        headers=auth_header(admin_tokens["access_token"]),
        json={"rider_id": rider_resp.json()["id"]},
    )
    assert assign_resp.status_code == 422


@pytest.mark.asyncio
async def test_admin_can_set_delivery_fee_by_area_and_order_uses_it(client, db_session):
    admin = await create_test_user(client, email="admin8@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer8@example.com")

    admin_tokens = await login_user(client, email="admin8@example.com")
    customer_tokens = await login_user(client, email="customer8@example.com")

    fee_resp = await client.put(
        "/api/v1/admin/delivery-fees",
        headers=auth_header(admin_tokens["access_token"]),
        json=[{"area": "Ketu", "fee_ngn": 1200}],
    )
    assert fee_resp.status_code == 200, fee_resp.text

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Area Fee Product",
            "slug": "area-fee-product",
            "description": "Area fee test product",
            "price_ngn": 2000,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 10,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "delivery_address": {
                "name": "Area Fee Customer",
                "phone": "08037771234",
                "address": "12 Main Street, Ketu",
                "area": "Ketu",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    data = order_resp.json()
    assert Decimal(str(data["delivery_fee_ngn"])) == Decimal("1200")


@pytest.mark.asyncio
async def test_order_status_change_sends_customer_email(client, db_session, monkeypatch):
    admin = await create_test_user(client, email="admin9@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    customer = await create_test_user(client, email="customer9@example.com")

    admin_tokens = await login_user(client, email="admin9@example.com")
    customer_tokens = await login_user(client, email="customer9@example.com")

    product_resp = await client.post(
        "/api/v1/admin/products",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "name": "Email Status Product",
            "slug": "email-status-product",
            "description": "Order status email test product",
            "price_ngn": 2400,
            "category": "local",
            "is_mums_pick": False,
            "stock_qty": 10,
            "is_active": True,
        },
    )
    assert product_resp.status_code == 201, product_resp.text

    order_resp = await client.post(
        "/api/v1/orders",
        headers=auth_header(customer_tokens["access_token"]),
        json={
            "items": [{"product_id": product_resp.json()["id"], "qty": 1}],
            "delivery_address": {
                "name": "Email Test Customer",
                "phone": "08034445555",
                "address": "7 Email Avenue",
                "city": "Lagos",
            },
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    order_id = order_resp.json()["id"]

    sent_payload = {}

    async def _fake_send_order_status_email(to: str, order_id: str, status: str, customer_name: str | None = None):
        sent_payload["to"] = to
        sent_payload["order_id"] = order_id
        sent_payload["status"] = status
        sent_payload["customer_name"] = customer_name

    monkeypatch.setattr("app.core.email.send_order_status_email", _fake_send_order_status_email)

    status_resp = await client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=auth_header(admin_tokens["access_token"]),
        json={"status": "packed"},
    )
    assert status_resp.status_code == 200, status_resp.text

    assert sent_payload["to"] == "customer9@example.com"
    assert sent_payload["order_id"] == order_id
    assert sent_payload["status"] == "packed"
    assert sent_payload["customer_name"] == "Email Test Customer"


@pytest.mark.asyncio
async def test_admin_can_create_staff_account(client, db_session):
    admin = await create_test_user(client, email="admin10@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    admin_tokens = await login_user(client, email="admin10@example.com")

    resp = await client.post(
        "/api/v1/admin/staff-users",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "email": "newstaff@example.com",
            "password": "StrongPass123",
            "username": "newstaff",
            "role": "staff",
        },
    )
    assert resp.status_code == 201, resp.text
    roles = [r["name"] for r in resp.json().get("roles", [])]
    assert "staff" in roles


@pytest.mark.asyncio
async def test_unverified_staff_can_login(client, db_session):
    admin = await create_test_user(client, email="admin12@example.com")
    await _assign_role(db_session, admin["id"], "admin")
    admin_tokens = await login_user(client, email="admin12@example.com")

    create_resp = await client.post(
        "/api/v1/admin/staff-users",
        headers=auth_header(admin_tokens["access_token"]),
        json={
            "email": "staff-login@example.com",
            "password": "StrongPass123",
            "username": "stafflogin",
            "role": "staff",
        },
    )
    assert create_resp.status_code == 201, create_resp.text

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "staff-login@example.com", "password": "StrongPass123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    data = login_resp.json()
    assert "access_token" in data and "refresh_token" in data
