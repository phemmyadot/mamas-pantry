"""
Seed product catalogue and a test shipment.

Run from the backend/ directory:
    python -m app.scripts.seed_catalogue
"""

import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app.db.base import async_session_factory
from app.db.models.product import Product, ProductCategory
from app.db.models.shipment import Shipment, ShipmentStatus


# ── Products ──────────────────────────────────────────────────────────────────

PRODUCTS = [
    # ── IMPORTED ──────────────────────────────────────────────────────────────
    {
        "name": "Betty Crocker Supermoist Vanilla Cake Mix",
        "slug": "betty-crocker-vanilla-cake-mix",
        "description": "Classic American vanilla cake mix. Makes two 8-inch layers. A family favourite straight from the USA.",
        "price_ngn": Decimal("4500"),
        "compare_price_ngn": Decimal("5200"),
        "category": ProductCategory.imported,
        "is_mums_pick": True,
        "origin": "USA",
        "stock_qty": 18,
        "is_active": True,
    },
    {
        "name": "Quaker Old Fashioned Oats (1kg)",
        "slug": "quaker-old-fashioned-oats-1kg",
        "description": "100% whole grain rolled oats. Heart-healthy breakfast, straight from Quaker USA.",
        "price_ngn": Decimal("5200"),
        "category": ProductCategory.imported,
        "is_mums_pick": True,
        "origin": "USA",
        "stock_qty": 24,
        "is_active": True,
    },
    {
        "name": "Jif Creamy Peanut Butter (510g)",
        "slug": "jif-creamy-peanut-butter-510g",
        "description": "America's #1 peanut butter. Rich, creamy, and perfect on toast or in smoothies.",
        "price_ngn": Decimal("5500"),
        "compare_price_ngn": Decimal("6200"),
        "category": ProductCategory.imported,
        "is_mums_pick": True,
        "origin": "USA",
        "stock_qty": 30,
        "is_active": True,
    },
    {
        "name": "Heinz Tomato Ketchup (570g)",
        "slug": "heinz-tomato-ketchup-570g",
        "description": "The original Heinz tomato ketchup. Thick, tangy, and made with ripe red tomatoes.",
        "price_ngn": Decimal("3800"),
        "category": ProductCategory.imported,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 40,
        "is_active": True,
    },
    {
        "name": "Kraft Mac & Cheese Original (206g)",
        "slug": "kraft-mac-and-cheese-original-206g",
        "description": "The classic blue box. Ready in 7 minutes. Iconic American comfort food.",
        "price_ngn": Decimal("2800"),
        "category": ProductCategory.imported,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 50,
        "is_active": True,
    },
    {
        "name": "Campbell's Cream of Mushroom Soup (305g)",
        "slug": "campbells-cream-of-mushroom-soup-305g",
        "description": "Condensed cream of mushroom soup. Great as a base for casseroles, pasta bakes, and sauces.",
        "price_ngn": Decimal("3200"),
        "category": ProductCategory.imported,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 22,
        "is_active": True,
    },

    # ── LOCAL ─────────────────────────────────────────────────────────────────
    {
        "name": "Semovita (2kg)",
        "slug": "semovita-2kg",
        "description": "Smooth semovita for swallow. Made from wheat semolina. The Lagos kitchen staple.",
        "price_ngn": Decimal("2200"),
        "category": ProductCategory.local,
        "is_mums_pick": True,
        "origin": "Nigeria",
        "stock_qty": 35,
        "is_active": True,
    },
    {
        "name": "Golden Penny Spaghetti (500g)",
        "slug": "golden-penny-spaghetti-500g",
        "description": "Nigeria's best-loved spaghetti. Perfectly smooth texture, great with tomato stew or jollof sauce.",
        "price_ngn": Decimal("1200"),
        "category": ProductCategory.local,
        "is_mums_pick": True,
        "origin": "Nigeria",
        "stock_qty": 60,
        "is_active": True,
    },
    {
        "name": "Honeywell Wheat Flour (5kg)",
        "slug": "honeywell-wheat-flour-5kg",
        "description": "All-purpose wheat flour for baking, thickening, and frying. A must-have in every Nigerian kitchen.",
        "price_ngn": Decimal("4800"),
        "category": ProductCategory.local,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 28,
        "is_active": True,
    },
    {
        "name": "Titus Sardines in Tomato Sauce (400g)",
        "slug": "titus-sardines-tomato-sauce-400g",
        "description": "The iconic Titus brand. Tender sardines packed in a rich tomato sauce. Perfect with rice or bread.",
        "price_ngn": Decimal("1800"),
        "category": ProductCategory.local,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 45,
        "is_active": True,
    },
    {
        "name": "Tasty Tom Tomato Puree (800g)",
        "slug": "tasty-tom-tomato-puree-800g",
        "description": "Thick, rich tomato puree for stews, sauces, and soups. The base of every Nigerian pot.",
        "price_ngn": Decimal("1500"),
        "category": ProductCategory.local,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 55,
        "is_active": True,
    },

    # ── CHILLED ───────────────────────────────────────────────────────────────
    {
        "name": "Farm Fresh Eggs (30 pieces)",
        "slug": "farm-fresh-eggs-30-pieces",
        "description": "Large, farm-fresh eggs from free-range hens. Collected daily. Perfect protein for every meal.",
        "price_ngn": Decimal("3500"),
        "category": ProductCategory.chilled,
        "is_mums_pick": True,
        "origin": "Nigeria",
        "stock_qty": 15,
        "is_active": True,
    },
    {
        "name": "Turkey Wings (1kg)",
        "slug": "turkey-wings-1kg",
        "description": "Fresh-frozen turkey wings. Cleaned and portioned. Perfect for pepper soup, stew, or the grill.",
        "price_ngn": Decimal("5800"),
        "compare_price_ngn": Decimal("6500"),
        "category": ProductCategory.chilled,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 12,
        "is_active": True,
    },
    {
        "name": "Lacto Full Cream Yoghurt (500ml)",
        "slug": "lacto-full-cream-yoghurt-500ml",
        "description": "Thick, creamy natural yoghurt. No added sugar. Great for breakfast, smoothies, or marinades.",
        "price_ngn": Decimal("2200"),
        "category": ProductCategory.chilled,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 20,
        "is_active": True,
    },
    {
        "name": "Fresh Plum Tomatoes (500g)",
        "slug": "fresh-plum-tomatoes-500g",
        "description": "Ripe, juicy plum tomatoes sourced locally. Ideal for stews, sauces, and salads.",
        "price_ngn": Decimal("1200"),
        "category": ProductCategory.chilled,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 25,
        "is_active": True,
    },

    # ── HOUSEHOLD ─────────────────────────────────────────────────────────────
    {
        "name": "Ariel Washing Powder (1.2kg)",
        "slug": "ariel-washing-powder-1-2kg",
        "description": "Deep-clean washing powder. Removes tough stains even in cold water. Freshness that lasts.",
        "price_ngn": Decimal("3200"),
        "category": ProductCategory.household,
        "is_mums_pick": True,
        "origin": "Nigeria",
        "stock_qty": 30,
        "is_active": True,
    },
    {
        "name": "Dettol Antibacterial Liquid Soap (500ml)",
        "slug": "dettol-antibacterial-liquid-soap-500ml",
        "description": "Kills 99.9% of germs. Gentle on hands, tough on bacteria. A household must-have.",
        "price_ngn": Decimal("2500"),
        "category": ProductCategory.household,
        "is_mums_pick": False,
        "origin": "Nigeria",
        "stock_qty": 40,
        "is_active": True,
    },
    {
        "name": "Joy Dishwashing Liquid (473ml)",
        "slug": "joy-dishwashing-liquid-473ml",
        "description": "American-formula dish soap. Cuts through grease with just a drop. Imported from the USA.",
        "price_ngn": Decimal("2800"),
        "category": ProductCategory.household,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 20,
        "is_active": True,
    },
    {
        "name": "Glad Press & Seal Wrap (70 sq ft)",
        "slug": "glad-press-and-seal-wrap-70sqft",
        "description": "The multi-purpose sealing wrap from the USA. Sticks to bowls, plates, and containers. No clips needed.",
        "price_ngn": Decimal("4500"),
        "category": ProductCategory.household,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 15,
        "is_active": True,
    },
    {
        "name": "Scotch-Brite Heavy Duty Sponge (3-pack)",
        "slug": "scotch-brite-heavy-duty-sponge-3pack",
        "description": "Tough scrubbing pad with soft side. Cleans without scratching. Imported 3-pack.",
        "price_ngn": Decimal("1800"),
        "category": ProductCategory.household,
        "is_mums_pick": False,
        "origin": "USA",
        "stock_qty": 35,
        "is_active": True,
    },
]


# ── Shipment ──────────────────────────────────────────────────────────────────

SHIPMENTS = [
    {
        "name": "April 2026 USA Haul",
        "origin_country": "USA",
        "departure_date": date(2026, 3, 28),
        "arrival_date": date(2026, 4, 14),
        "status": ShipmentStatus.upcoming,
        "notes": "Spring haul — cake mixes, peanut butter, oats, and household goods.",
    },
]


# ── Runner ────────────────────────────────────────────────────────────────────

async def seed() -> None:
    async with async_session_factory() as session:
        # Products
        created = 0
        skipped = 0
        for i, data in enumerate(PRODUCTS, start=1):
            data.setdefault("sku", f"SKU-{i:06d}")
            result = await session.execute(select(Product).where(Product.slug == data["slug"]))
            if result.scalar_one_or_none():
                skipped += 1
                continue
            session.add(Product(**data))
            created += 1

        # Shipments
        ship_created = 0
        for data in SHIPMENTS:
            result = await session.execute(select(Shipment).where(Shipment.name == data["name"]))
            if result.scalar_one_or_none():
                continue
            session.add(Shipment(**data))
            ship_created += 1

        await session.commit()

    print(f"Products  — created: {created}, skipped (already exist): {skipped}")
    print(f"Shipments — created: {ship_created}")


if __name__ == "__main__":
    asyncio.run(seed())
