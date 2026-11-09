import unittest
import os
import sys
import sqlite3
import tempfile
from sqlalchemy.exc import IntegrityError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User, MerchantOrganization, Store, SizeChart,
    GarmentMeasurement, Product, ProductVariant, Clothing
)
from app.migrations.phase5b_m3_migration import upgrade as run_m3_upgrade, downgrade as run_m3_downgrade


class TestProductModelsFoundation(unittest.TestCase):
    """
    Isolated tests for Phase 5B Milestone 3A:
    Product, Variant, SizeChart, and GarmentMeasurement models.
    Operates in an isolated in-memory or temporary SQLite database.
    """

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-product-models'
        })
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Create all tables in isolated test database
        db.create_all()

        # Seed test organization and two distinct stores for multi-tenant isolation tests
        self.org = MerchantOrganization(name="Nordic Apparel Group", slug="nordic-apparel")
        db.session.add(self.org)
        db.session.flush()

        self.store1 = Store(organization_id=self.org.id, name="Nordic Menswear", slug="nordic-menswear")
        self.store2 = Store(organization_id=self.org.id, name="Nordic Womenswear", slug="nordic-womenswear")
        db.session.add_all([self.store1, self.store2])
        db.session.commit()

        self.store1_id = self.store1.id
        self.store2_id = self.store2.id

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_size_chart_and_measurements_creation(self):
        """SizeChart and child GarmentMeasurement records are created with explicit semantics"""
        chart = SizeChart(
            store_id=self.store1_id,
            name="Mens Woven Shirts",
            garment_category="shirt",
            chart_type="garment_dimensions",
            measurement_convention="flat_garment",
            unit="cm"
        )
        db.session.add(chart)
        db.session.flush()

        # Add S and M measurements with explicit flat widths
        m_s = GarmentMeasurement(
            size_chart_id=chart.id,
            size="S",
            flat_chest_width=50.5,
            total_length=73.0,
            sleeve_length=64.0
        )
        m_m = GarmentMeasurement(
            size_chart_id=chart.id,
            size="M",
            flat_chest_width=53.0,
            total_length=75.0,
            sleeve_length=65.5
        )
        db.session.add_all([m_s, m_m])
        db.session.commit()

        self.assertEqual(len(chart.measurements), 2)
        dict_rep = chart.to_dict()
        self.assertEqual(dict_rep['name'], "Mens Woven Shirts")
        self.assertEqual(dict_rep['chart_type'], "garment_dimensions")
        self.assertEqual(dict_rep['measurement_convention'], "flat_garment")
        self.assertEqual(len(dict_rep['measurements']), 2)

    def test_positive_dimension_constraints(self):
        """Non-positive (<=0) garment measurements violate CHECK constraints"""
        chart = SizeChart(store_id=self.store1_id, name="Test Chart", garment_category="shirt")
        db.session.add(chart)
        db.session.flush()

        invalid_m = GarmentMeasurement(
            size_chart_id=chart.id,
            size="L",
            flat_chest_width=-10.0  # Invalid negative dimension
        )
        db.session.add(invalid_m)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_cross_store_size_chart_rejection(self):
        """Composite FK physically prevents assigning a SizeChart from Store 1 to a Product in Store 2"""
        chart_store1 = SizeChart(store_id=self.store1_id, name="Store 1 Chart", garment_category="shirt")
        db.session.add(chart_store1)
        db.session.commit()

        # Product in Store 2 attempting to link chart_store1 (belonging to Store 1)
        cross_product = Product(
            store_id=self.store2_id,
            size_chart_id=chart_store1.id,
            name="Cross Store Attempt",
            category="shirt"
        )
        db.session.add(cross_product)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_safe_size_chart_deletion_restrict(self):
        """Deleting a SizeChart currently referenced by a Product is blocked by ON DELETE RESTRICT"""
        chart = SizeChart(store_id=self.store1_id, name="Referenced Chart", garment_category="shirt")
        db.session.add(chart)
        db.session.flush()

        product = Product(
            store_id=self.store1_id,
            size_chart_id=chart.id,
            name="Oxford Button Down",
            category="shirt"
        )
        db.session.add(product)
        db.session.commit()

        # Verify active reference check
        product.status = 'active'
        db.session.commit()
        self.assertTrue(chart.is_referenced_by_active_products())

        # Attempt to delete the chart while product still references it -> Rejected by RESTRICT!
        db.session.delete(chart)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

        # Unlink product first, then chart deletion succeeds safely
        p = db.session.get(Product, product.id)
        p.size_chart_id = None
        db.session.commit()

        c = db.session.get(SizeChart, chart.id)
        db.session.delete(c)
        db.session.commit()
        self.assertIsNone(db.session.get(SizeChart, chart.id))

    def test_cross_store_variant_rejection(self):
        """Composite FK prevents creating a ProductVariant referencing a parent product in another store"""
        product_store1 = Product(store_id=self.store1_id, name="Store 1 Product", category="pants")
        db.session.add(product_store1)
        db.session.commit()

        # Variant with store_id=store2 attempting to attach to Product in store1
        cross_variant = ProductVariant(
            product_id=product_store1.id,
            store_id=self.store2_id,
            size="32"
        )
        db.session.add(cross_variant)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_product_size_uniqueness_and_custom_labels(self):
        """Product variants must have unique size labels per product, and custom size labels are supported"""
        product = Product(store_id=self.store1_id, name="Custom Denim", category="pants")
        db.session.add(product)
        db.session.flush()

        # Add custom alphanumeric size labels
        v1 = ProductVariant(product_id=product.id, store_id=self.store1_id, size="32x34", sku="DENIM-32-34")
        v2 = ProductVariant(product_id=product.id, store_id=self.store1_id, size="One Size", sku="DENIM-OS")
        v3 = ProductVariant(product_id=product.id, store_id=self.store1_id, size="S/M", sku="DENIM-SM")
        db.session.add_all([v1, v2, v3])
        db.session.commit()

        # Attempt to add a duplicate size to the same product -> Rejected
        duplicate_size_variant = ProductVariant(
            product_id=product.id,
            store_id=self.store1_id,
            size="32x34",  # Duplicate size
            sku="DENIM-DUP"
        )
        db.session.add(duplicate_size_variant)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_store_scoped_sku_uniqueness(self):
        """SKUs are unique within the same store, but identical SKUs across different stores are allowed"""
        p1 = Product(store_id=self.store1_id, name="Store 1 Shirt", category="shirt")
        p2 = Product(store_id=self.store2_id, name="Store 2 Shirt", category="shirt")
        db.session.add_all([p1, p2])
        db.session.commit()

        # Same SKU in different stores -> Allowed!
        v_store1 = ProductVariant(product_id=p1.id, store_id=self.store1_id, size="M", sku="COMMON-SKU-001")
        v_store2 = ProductVariant(product_id=p2.id, store_id=self.store2_id, size="M", sku="COMMON-SKU-001")
        db.session.add_all([v_store1, v_store2])
        db.session.commit()

        # Duplicate SKU within Store 1 -> Rejected!
        v_store1_dup = ProductVariant(product_id=p1.id, store_id=self.store1_id, size="L", sku="COMMON-SKU-001")
        db.session.add(v_store1_dup)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_material_stretch_default_and_validation(self):
        """Material stretch defaults to 'unknown' and rejects arbitrary unvalidated states"""
        p = Product(store_id=self.store1_id, name="Linen Blouse", category="shirt")
        db.session.add(p)
        db.session.commit()

        # Default is 'unknown' (never assumed to be elastic or non-elastic)
        self.assertEqual(p.material_stretch, 'unknown')

        # Valid states: non_stretch, low_stretch, medium_stretch, high_stretch
        for valid_state in ['non_stretch', 'low_stretch', 'medium_stretch', 'high_stretch']:
            p.material_stretch = valid_state
            db.session.commit()
            self.assertEqual(p.material_stretch, valid_state)

        # Invalid state rejected by check constraint
        p.material_stretch = 'super_rubbery_hyper_elastic'
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_cascade_deletion(self):
        """Deleting a Store cascades to its SizeCharts, Measurements, Products, and ProductVariants"""
        chart = SizeChart(store_id=self.store1_id, name="Cascade Chart", garment_category="dress")
        db.session.add(chart)
        db.session.flush()

        m = GarmentMeasurement(size_chart_id=chart.id, size="M", flat_chest_width=48.0)
        p = Product(store_id=self.store1_id, size_chart_id=chart.id, name="Summer Dress", category="dress")
        db.session.add_all([m, p])
        db.session.flush()

        v = ProductVariant(product_id=p.id, store_id=self.store1_id, size="M", sku="DRESS-M")
        db.session.add(v)
        db.session.commit()

        chart_id, m_id, p_id, v_id = chart.id, m.id, p.id, v.id

        # Delete Store 1
        s = db.session.get(Store, self.store1_id)
        db.session.delete(s)
        db.session.commit()

        # All child entities are deleted cleanly
        self.assertIsNone(db.session.get(Product, p_id))
        self.assertIsNone(db.session.get(ProductVariant, v_id))
        self.assertIsNone(db.session.get(SizeChart, chart_id))
        self.assertIsNone(db.session.get(GarmentMeasurement, m_id))

    def test_legacy_clothing_model_compatibility(self):
        """Legacy Clothing table remains 100% operational alongside the new models"""
        seller = User(username="legacy_seller", email="legacy@test.com", role="seller")
        db.session.add(seller)
        db.session.flush()

        legacy_item = Clothing(
            name="Legacy Vintage Shirt",
            type="shirt",
            material="non-elastic",
            size="L",
            width=54.0,
            length=76.0,
            seller_id=seller.id
        )
        db.session.add(legacy_item)
        db.session.commit()

        fetched = db.session.get(Clothing, legacy_item.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.name, "Legacy Vintage Shirt")
        self.assertEqual(fetched.width, 54.0)

    def test_migration_repeatability_and_rollback_on_isolated_db(self):
        """Migration script upgrades and downgrades cleanly on an isolated SQLite file"""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            # Seed minimal store table on isolated file
            conn = sqlite3.connect(tmp_path)
            conn.execute("PRAGMA foreign_keys = ON;")
            conn.execute("""
                CREATE TABLE merchant_organization (
                    id INTEGER PRIMARY KEY,
                    name TEXT, slug TEXT UNIQUE
                );
            """)
            conn.execute("""
                CREATE TABLE store (
                    id INTEGER PRIMARY KEY,
                    organization_id INTEGER,
                    name TEXT, slug TEXT UNIQUE,
                    currency TEXT DEFAULT 'BGN',
                    platform_type TEXT DEFAULT 'custom',
                    connection_status TEXT DEFAULT 'disconnected',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            conn.close()

            # 1. Upgrade
            success = run_m3_upgrade(tmp_path)
            self.assertTrue(success)

            conn = sqlite3.connect(tmp_path)
            c = conn.cursor()
            c.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [r[0] for r in c.fetchall()]
            for expected in ['size_chart', 'garment_measurement', 'product', 'product_variant']:
                self.assertIn(expected, tables)
            conn.close()

            # 2. Downgrade
            rollback_success = run_m3_downgrade(tmp_path)
            self.assertTrue(rollback_success)

            conn = sqlite3.connect(tmp_path)
            c = conn.cursor()
            c.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables_post = [r[0] for r in c.fetchall()]
            for removed in ['size_chart', 'garment_measurement', 'product', 'product_variant']:
                self.assertNotIn(removed, tables_post)
            # Store and merchant_organization were preserved!
            self.assertIn('store', tables_post)
            self.assertIn('merchant_organization', tables_post)
            conn.close()

        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


if __name__ == '__main__':
    unittest.main()

