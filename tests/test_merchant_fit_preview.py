"""
Integration tests for Authenticated Merchant Fit Preview API (Phase 3E-C).
Verifies:
1. Authorized merchant preview (owner/admin)
2. Staff preview access
3. Unauthenticated access rejection (401)
4. Cross-store preview rejection (404)
5. Draft product preview (permitted)
6. Incomplete draft handling (no 500 error, actionable 200 response)
7. Active product preview
8. CSRF protection enforcement
9. Invalid shopper measurements rejection (400)
10. Zero persistence of body measurements
11. Preview functions correctly even with STOREFRONT_API_ENABLED=False
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User, MerchantOrganization, Store, StoreMembership,
    Product, ProductVariant, SizeChart, GarmentMeasurement, RecommendationHistory
)


class TestMerchantFitPreview(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'STOREFRONT_API_ENABLED': False,  # Explicitly disabled public storefront API
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-merchant-fit-preview-secret',
            'WTF_CSRF_ENABLED': False,
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Store 1 Setup
            self.owner1 = User(username='owner1', email='owner1@test.com', role='seller')
            self.owner1.set_password('Pass123!')

            self.staff1 = User(username='staff1', email='staff1@test.com', role='seller')
            self.staff1.set_password('Pass123!')

            # Store 2 Owner (unrelated tenant)
            self.owner2 = User(username='owner2', email='owner2@test.com', role='seller')
            self.owner2.set_password('Pass123!')

            db.session.add_all([self.owner1, self.staff1, self.owner2])
            db.session.commit()

            org1 = MerchantOrganization(name='Nordic Group', slug='nordic-group')
            org2 = MerchantOrganization(name='Denim Corp', slug='denim-corp')
            db.session.add_all([org1, org2])
            db.session.commit()

            self.store1 = Store(organization_id=org1.id, name='Nordic Apparel', slug='nordic-apparel')
            self.store2 = Store(organization_id=org2.id, name='Denim Co', slug='denim-co')
            db.session.add_all([self.store1, self.store2])
            db.session.commit()

            m1 = StoreMembership(organization_id=org1.id, store_id=self.store1.id, user_id=self.owner1.id, role='owner')
            m2 = StoreMembership(organization_id=org1.id, store_id=self.store1.id, user_id=self.staff1.id, role='staff')
            m3 = StoreMembership(organization_id=org2.id, store_id=self.store2.id, user_id=self.owner2.id, role='owner')
            db.session.add_all([m1, m2, m3])
            db.session.commit()

            # Size Chart for Store 1
            self.chart1 = SizeChart(
                store_id=self.store1.id,
                name='Classic Tee Chart',
                garment_category='Tops',
                measurement_convention='flat_garment',
                unit='cm',
            )
            db.session.add(self.chart1)
            db.session.commit()

            m_s = GarmentMeasurement(size_chart_id=self.chart1.id, size='S', flat_chest_width=50.0, total_length=70.0)
            m_m = GarmentMeasurement(size_chart_id=self.chart1.id, size='M', flat_chest_width=53.0, total_length=72.0)
            db.session.add_all([m_s, m_m])
            db.session.commit()

            # Active Product in Store 1
            self.active_prod = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Active Cotton Tee',
                category='Tops',
                material_stretch='non_stretch',
                status='active',
            )
            db.session.add(self.active_prod)
            db.session.commit()
            db.session.add_all([
                ProductVariant(product_id=self.active_prod.id, store_id=self.store1.id, size='S', sku='ACT-S'),
                ProductVariant(product_id=self.active_prod.id, store_id=self.store1.id, size='M', sku='ACT-M'),
            ])
            db.session.commit()

            # Draft Product in Store 1 (Has chart & variants)
            self.draft_prod = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Draft Graphic Tee',
                category='Tops',
                material_stretch='low_stretch',
                status='draft',
            )
            db.session.add(self.draft_prod)
            db.session.commit()
            db.session.add_all([
                ProductVariant(product_id=self.draft_prod.id, store_id=self.store1.id, size='S', sku='DFT-S'),
                ProductVariant(product_id=self.draft_prod.id, store_id=self.store1.id, size='M', sku='DFT-M'),
            ])
            db.session.commit()

            # Incomplete Draft Product A (No size chart)
            self.draft_no_chart = Product(
                store_id=self.store1.id,
                size_chart_id=None,
                name='Incomplete Tee (No Chart)',
                category='Tops',
                status='draft',
            )
            db.session.add(self.draft_no_chart)
            db.session.commit()

            # Incomplete Draft Product B (Chart assigned, but no variants)
            self.draft_no_variants = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Incomplete Tee (No Variants)',
                category='Tops',
                status='draft',
            )
            db.session.add(self.draft_no_variants)
            db.session.commit()

            # Archived Product in Store 1
            self.archived_prod = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Archived Tee',
                category='Tops',
                status='archived',
            )
            db.session.add(self.archived_prod)
            db.session.commit()

            # Store 2 Product
            self.store2_prod = Product(
                store_id=self.store2.id,
                name='Store 2 Jacket',
                category='Tops',
                status='active',
            )
            db.session.add(self.store2_prod)
            db.session.commit()

            self.store1_id = self.store1.id
            self.store2_id = self.store2.id
            self.active_id = self.active_prod.id
            self.draft_id = self.draft_prod.id
            self.draft_no_chart_id = self.draft_no_chart.id
            self.draft_no_variants_id = self.draft_no_variants.id
            self.archived_id = self.archived_prod.id
            self.store2_prod_id = self.store2_prod.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password='Pass123!'):
        res = self.client.post('/api/login', json={'username': username, 'password': password})
        data = res.get_json() or {}
        self.csrf_token = data.get('csrf_token')
        return res

    def _get_csrf_headers(self):
        h = {'Origin': 'http://localhost:8080'}
        if hasattr(self, 'csrf_token') and self.csrf_token:
            h['X-CSRFToken'] = self.csrf_token
        return h

    # -------------------------------------------------------------
    # 1. Authorized Merchant Preview (Active Product)
    # -------------------------------------------------------------
    def test_01_authorized_merchant_preview_active_product(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        payload = {
            'units': 'cm',
            'measurements': {'chest': 98.0, 'waist': 82.0}
        }
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json=payload,
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'fit_rules_required')
        self.assertEqual(data['product_id'], self.active_id)
        self.assertEqual(data['product_status'], 'active')
        self.assertEqual(len(data['variant_comparisons']), 2)

    # -------------------------------------------------------------
    # 2. Staff Preview Access
    # -------------------------------------------------------------
    def test_02_staff_preview_access(self):
        self._login('staff1')
        headers = self._get_csrf_headers()

        payload = {'units': 'cm', 'measurements': {'chest': 98.0}}
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json=payload,
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'fit_rules_required')

    # -------------------------------------------------------------
    # 3. Unauthenticated Access Rejection (401)
    # -------------------------------------------------------------
    def test_03_unauthenticated_access_rejection(self):
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': 98.0}}
        )
        self.assertEqual(res.status_code, 401)

    # -------------------------------------------------------------
    # 4. Cross-Store Preview Rejection (404)
    # -------------------------------------------------------------
    def test_04_cross_store_preview_rejection(self):
        # Store 1 owner attempts to preview Store 2's product
        self._login('owner1')
        headers = self._get_csrf_headers()

        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.store2_prod_id}/fit-preview',
            json={'measurements': {'chest': 98.0}},
            headers=headers
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_NOT_FOUND')

    # -------------------------------------------------------------
    # 5. Draft Product Preview (Permitted)
    # -------------------------------------------------------------
    def test_05_draft_product_preview(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        payload = {'units': 'cm', 'measurements': {'chest': 98.0}}
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.draft_id}/fit-preview',
            json=payload,
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'fit_rules_required')
        self.assertEqual(data['product_status'], 'draft')
        self.assertEqual(len(data['variant_comparisons']), 2)

    # -------------------------------------------------------------
    # 6. Incomplete Draft Handling (Actionable 200, No 500)
    # -------------------------------------------------------------
    def test_06_incomplete_draft_handling(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        # A. Draft with no size chart
        res1 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.draft_no_chart_id}/fit-preview',
            json={'measurements': {'chest': 98.0}},
            headers=headers
        )
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertEqual(data1['status'], 'insufficient_data')
        self.assertIn('size_chart', data1['missing_dimensions'])

        # B. Draft with chart but no variants
        res2 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.draft_no_variants_id}/fit-preview',
            json={'measurements': {'chest': 98.0}},
            headers=headers
        )
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2['status'], 'insufficient_data')
        self.assertIn('variants', data2['missing_dimensions'])

    # -------------------------------------------------------------
    # 7. Archived Product Rejection (400)
    # -------------------------------------------------------------
    def test_07_archived_product_rejection(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.archived_id}/fit-preview',
            json={'measurements': {'chest': 98.0}},
            headers=headers
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_ARCHIVED')

    # -------------------------------------------------------------
    # 8. CSRF Protection Enforcement (403)
    # -------------------------------------------------------------
    def test_08_csrf_protection_enforcement(self):
        self._login('owner1')
        # Missing CSRF token header
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': 98.0}}
        )
        self.assertEqual(res.status_code, 403)

    # -------------------------------------------------------------
    # 9. Invalid Shopper Measurements (400)
    # -------------------------------------------------------------
    def test_09_invalid_shopper_measurements(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        # Negative value
        res1 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': -98.0}},
            headers=headers
        )
        self.assertEqual(res1.status_code, 400)
        self.assertEqual(res1.get_json()['code'], 'INVALID_DIMENSION_VALUE')

        # Unsupported key
        res2 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': 98.0, 'shoe_size': 42.0}},
            headers=headers
        )
        self.assertEqual(res2.status_code, 400)
        self.assertEqual(res2.get_json()['code'], 'UNSUPPORTED_MEASUREMENT_KEY')

    # -------------------------------------------------------------
    # 10. No Persistence of Body Measurements
    # -------------------------------------------------------------
    def test_10_no_persistence_of_body_measurements(self):
        self._login('owner1')
        headers = self._get_csrf_headers()

        with self.app.app_context():
            initial_count = RecommendationHistory.query.count()

        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': 98.0, 'waist': 82.0}},
            headers=headers
        )
        self.assertEqual(res.status_code, 200)

        with self.app.app_context():
            final_count = RecommendationHistory.query.count()
            self.assertEqual(initial_count, final_count)

    # -------------------------------------------------------------
    # 11. Preview Works with Public Storefront API Disabled
    # -------------------------------------------------------------
    def test_11_preview_works_with_public_api_disabled(self):
        # Confirm STOREFRONT_API_ENABLED is False in test app config
        self.assertFalse(self.app.config.get('STOREFRONT_API_ENABLED', False))

        self._login('owner1')
        headers = self._get_csrf_headers()

        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{self.active_id}/fit-preview',
            json={'measurements': {'chest': 98.0}},
            headers=headers
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['status'], 'fit_rules_required')


if __name__ == '__main__':
    unittest.main()
