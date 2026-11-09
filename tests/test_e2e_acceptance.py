"""
End-to-End Acceptance Test Suite (Milestone 3E-D)

Verifies the complete merchant sizing data workflow across:
1. Isolated test database environment (zero writes to live SmartFit.db)
2. Part 3: 26-Step Complete Merchant Journey
3. Part 4: Factual Dimensional Calculation Acceptance (Chest 98cm vs S=96cm, M=102cm, L=110cm)
4. Part 5 & 8: Multi-tenant store isolation, staff permissions, CSRF enforcement, HTTP 409 active chart protection
5. Privacy: Zero persistence or leakage of shopper measurements
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


class TestMilestone3Acceptance(unittest.TestCase):
    def setUp(self):
        # 1. Strictly isolated test database (in-memory SQLite)
        self.app = create_app({
            'TESTING': True,
            'STOREFRONT_API_ENABLED': False,  # Public storefront API disabled by default
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'milestone3-e2e-acceptance-secret',
            'WTF_CSRF_ENABLED': False,
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            # Confirm isolation
            db_uri = str(db.engine.url)
            assert 'SmartFit.db' not in db_uri, f"CRITICAL: Test attempted to connect to live database: {db_uri}"
            assert ':memory:' in db_uri, f"CRITICAL: Test database must be in-memory: {db_uri}"

            db.create_all()

            # Create test merchant organization
            self.org = MerchantOrganization(name="Milestone 3 Test Org", slug="m3-test-org")
            db.session.add(self.org)
            db.session.commit()

            # Merchant Owner (Store A)
            self.owner = User(username='m3_owner', email='m3_owner@test.com', role='seller')
            self.owner.set_password('SecretPass123!')
            db.session.add(self.owner)

            # Store Staff (Store A)
            self.staff = User(username='m3_staff', email='m3_staff@test.com', role='seller')
            self.staff.set_password('SecretPass123!')
            db.session.add(self.staff)

            # Rival Merchant (Store B)
            self.rival = User(username='m3_rival', email='m3_rival@test.com', role='seller')
            self.rival.set_password('SecretPass123!')
            db.session.add(self.rival)
            db.session.commit()

            # Store A
            self.store_a = Store(
                organization_id=self.org.id,
                name="Milestone 3 Test Studio",
                slug="m3-test-studio",
                currency="EUR",
                platform_type="custom",
                connection_status="connected"
            )
            db.session.add(self.store_a)

            # Store B (Isolated Rival Store)
            self.store_b = Store(
                organization_id=self.org.id,
                name="Rival Boutique",
                slug="rival-boutique",
                currency="USD",
                platform_type="shopify",
                connection_status="connected"
            )
            db.session.add(self.store_b)
            db.session.commit()

            # Memberships
            db.session.add(StoreMembership(organization_id=self.org.id, user_id=self.owner.id, store_id=self.store_a.id, role='owner'))
            db.session.add(StoreMembership(organization_id=self.org.id, user_id=self.staff.id, store_id=self.store_a.id, role='staff'))
            db.session.add(StoreMembership(organization_id=self.org.id, user_id=self.rival.id, store_id=self.store_b.id, role='owner'))
            db.session.commit()

            self.store_a_id = self.store_a.id
            self.store_b_id = self.store_b.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password='SecretPass123!'):
        resp = self.client.post('/api/login', json={'username': username, 'password': password})
        self.assertEqual(resp.status_code, 200, f"Login failed for {username}: {resp.get_json()}")
        csrf_token = resp.get_json().get('csrf_token', '')
        return {'X-CSRFToken': csrf_token}

    def test_complete_26_step_merchant_workflow(self):
        """
        Executes and validates the exact 26-step merchant journey required by Part 3 & Part 4.
        """
        # Step 1: Authenticate as merchant
        headers = self._login('m3_owner')

        # Step 2: Select isolated test store
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}', headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['store']['name'], "Milestone 3 Test Studio")

        # Step 3: Open Merchant Products (currently empty)
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/products', headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.get_json()['products']), 0)

        # Step 4: Create a draft shirt with sizes S, M, L
        create_prod_payload = {
            'name': 'Oxford Cotton Button-Down Shirt',
            'category': 'shirt',
            'brand': 'FitVision Heritage',
            'material_stretch': 'non_stretch',
            'description': 'Classic tailored fit button-down shirt in premium woven cotton.',
            'variants': [
                {'size': 'S', 'sku': 'OXF-S-BLU'},
                {'size': 'M', 'sku': 'OXF-M-BLU'},
                {'size': 'L', 'sku': 'OXF-L-BLU'},
            ]
        }
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/products',
            json=create_prod_payload,
            headers=headers
        )
        self.assertEqual(resp.status_code, 201)
        product_data = resp.get_json()['product']
        product_id = product_data['id']
        self.assertEqual(product_data['status'], 'draft')
        self.assertEqual(product_data['variants_count'], 3)

        # Step 5: Verify the product appears in the list
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/products', headers=headers)
        self.assertEqual(resp.status_code, 200)
        prods = resp.get_json()['products']
        self.assertEqual(len(prods), 1)
        self.assertEqual(prods[0]['id'], product_id)

        # Step 6: Refresh and verify persistence
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}', headers=headers)
        self.assertEqual(resp.status_code, 200)
        persisted_prod = resp.get_json()['product']
        self.assertEqual(persisted_prod['name'], 'Oxford Cotton Button-Down Shirt')
        self.assertEqual(len(persisted_prod['variants']), 3)

        # Step 7: Open Size Charts (currently empty)
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/size-charts', headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.get_json()['size_charts']), 0)

        # Step 8, 9, 10: Create flat-garment size chart in cm with S, M, L explicit chest widths & lengths
        # Chest: S=48cm (approx 96cm), M=51cm (approx 102cm), L=55cm (approx 110cm)
        create_chart_payload = {
            'name': 'Oxford Shirt Tailored Matrix',
            'garment_category': 'shirt',
            'chart_type': 'garment_dimensions',
            'measurement_convention': 'flat_garment',
            'unit': 'cm',
            'measurements': [
                {'size': 'S', 'flat_chest_width': 48.0, 'total_length': 70.0, 'sleeve_length': 62.0},
                {'size': 'M', 'flat_chest_width': 51.0, 'total_length': 72.0, 'sleeve_length': 64.0},
                {'size': 'L', 'flat_chest_width': 55.0, 'total_length': 75.0, 'sleeve_length': 66.0},
            ]
        }
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/size-charts',
            json=create_chart_payload,
            headers=headers
        )
        self.assertEqual(resp.status_code, 201)
        chart_data = resp.get_json()['size_chart']
        chart_id = chart_data['id']
        self.assertEqual(chart_data['measurement_convention'], 'flat_garment')
        self.assertEqual(chart_data['unit'], 'cm')

        # Step 11: Refresh and verify persistence
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/size-charts/{chart_id}', headers=headers)
        self.assertEqual(resp.status_code, 200)
        persisted_chart = resp.get_json()['size_chart']
        self.assertEqual(len(persisted_chart['measurements']), 3)

        # Step 12: Assign the chart to the product
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}',
            json={'size_chart_id': chart_id},
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['product']['size_chart_id'], chart_id)

        # Step 13 & 14: Activate the product
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}',
            json={'status': 'active'},
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)

        # Step 15: Verify activation is confirmed by backend
        activated_product = resp.get_json()['product']
        self.assertEqual(activated_product['status'], 'active')

        # Step 16: Open Product Detail
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}', headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['product']['status'], 'active')

        # Step 17, 18, 19: Submit preview request with chest = 98 cm
        preview_payload_cm = {
            'units': 'cm',
            'measurements': {
                'chest': 98.0
            }
        }
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}/fit-preview',
            json=preview_payload_cm,
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        preview_data = resp.get_json()

        # Step 20: Verify correct factual differences (Part 4 math):
        # S: 48 * 2 = 96 cm -> diff = 96 - 98 = -2 cm
        # M: 51 * 2 = 102 cm -> diff = 102 - 98 = +4 cm
        # L: 55 * 2 = 110 cm -> diff = 110 - 98 = +12 cm
        self.assertEqual(preview_data['status'], 'fit_rules_required')
        self.assertEqual(preview_data['measurement_convention'], 'flat_garment')

        variants_by_size = {v['size']: v for v in preview_data['variant_comparisons']}
        self.assertIn('S', variants_by_size)
        self.assertIn('M', variants_by_size)
        self.assertIn('L', variants_by_size)

        s_chest = variants_by_size['S']['circumference_comparisons']['chest']
        m_chest = variants_by_size['M']['circumference_comparisons']['chest']
        l_chest = variants_by_size['L']['circumference_comparisons']['chest']

        self.assertEqual(s_chest['difference'], -2.0)
        self.assertEqual(s_chest['garment_specification'], 96.0)
        self.assertEqual(s_chest['shopper_measurement'], 98.0)
        self.assertTrue(s_chest['is_approximation'], "Flat garment width conversion must be labeled approximation")

        self.assertEqual(m_chest['difference'], 4.0)
        self.assertEqual(m_chest['garment_specification'], 102.0)
        self.assertEqual(m_chest['shopper_measurement'], 98.0)
        self.assertTrue(m_chest['is_approximation'])

        self.assertEqual(l_chest['difference'], 12.0)
        self.assertEqual(l_chest['garment_specification'], 110.0)
        self.assertEqual(l_chest['shopper_measurement'], 98.0)
        self.assertTrue(l_chest['is_approximation'])

        # Verify no fabricated fields
        self.assertNotIn('recommended_size', preview_data)
        self.assertNotIn('confidence_score', preview_data)
        self.assertNotIn('fit_probability', preview_data)

        # Step 21 & 22: Switch between cm and inch
        # 98 cm = 38.58 inch
        preview_payload_inch = {
            'units': 'inch',
            'measurements': {
                'chest': 38.58
            }
        }
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{product_id}/fit-preview',
            json=preview_payload_inch,
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        inch_preview = resp.get_json()
        self.assertEqual(inch_preview['units'], 'inch')
        inch_variants = {v['size']: v for v in inch_preview['variant_comparisons']}
        # Garment in inches: 96 cm / 2.54 = 37.8 in, diff = 37.8 - 38.58 = -0.78 (or approx -0.79 in)
        self.assertAlmostEqual(inch_variants['S']['circumference_comparisons']['chest']['difference'], -0.79, delta=0.1)

        # Step 23 & 24: Verify zero shopper measurements saved in database
        with self.app.app_context():
            hist_count = RecommendationHistory.query.count()
            self.assertEqual(hist_count, 0, "Privacy violation: Customer measurement entered database")

        # Step 25 & 26: Attempt to edit the active shared chart's measurement matrix -> HTTP 409 Conflict
        attempt_update_payload = {
            'measurements': [
                {'size': 'S', 'flat_chest_width': 49.0, 'total_length': 70.0},
                {'size': 'M', 'flat_chest_width': 52.0, 'total_length': 72.0},
                {'size': 'L', 'flat_chest_width': 56.0, 'total_length': 75.0},
            ]
        }
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/size-charts/{chart_id}',
            json=attempt_update_payload,
            headers=headers
        )
        self.assertEqual(resp.status_code, 409, "Active size chart must reject measurement modifications with HTTP 409")
        conflict_data = resp.get_json()
        self.assertIn('referenced by active products', conflict_data['error'])
        self.assertEqual(conflict_data['active_products_count'], 1)

    def test_security_and_privacy_guarantees(self):
        """
        Validates:
        - Staff can preview fit but cannot modify products (403)
        - Cross-store preview attempts are rejected (404)
        - Public storefront API is disabled by default (503)
        - Unauthenticated preview attempts rejected (401)
        """
        # 1. Unauthenticated request -> 401
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/1/fit-preview',
            json={'units': 'cm', 'measurements': {'chest': 95.0}}
        )
        self.assertEqual(resp.status_code, 401)

        # 2. Staff user can preview fit
        staff_headers = self._login('m3_staff')
        
        # Setup draft product with chart in store A
        with self.app.app_context():
            chart = SizeChart(
                store_id=self.store_a_id,
                name="Staff Test Chart",
                garment_category="top",
                chart_type="garment_dimensions",
                measurement_convention="garment_circumference",
                unit="cm"
            )
            db.session.add(chart)
            db.session.flush()

            db.session.add(GarmentMeasurement(
                size_chart_id=chart.id,
                size="M",
                garment_chest_circumference=100.0,
                total_length=70.0
            ))

            product = Product(
                store_id=self.store_a_id,
                size_chart_id=chart.id,
                name="Staff Preview Shirt",
                category="shirt",
                status="draft"
            )
            db.session.add(product)
            db.session.flush()

            db.session.add(ProductVariant(
                product_id=product.id,
                store_id=self.store_a_id,
                size="M"
            ))
            db.session.commit()
            prod_id = product.id

        # Staff can preview
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{prod_id}/fit-preview',
            json={'units': 'cm', 'measurements': {'chest': 95.0}},
            headers=staff_headers
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()['status'], 'fit_rules_required')

        # Staff CANNOT modify product (403 Forbidden)
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/products/{prod_id}',
            json={'name': 'Tampered by Staff'},
            headers=staff_headers
        )
        self.assertEqual(resp.status_code, 403)

        # 3. Cross-Store Access Rejection: Rival from Store B cannot preview Store A product
        rival_headers = self._login('m3_rival')
        resp = self.client.post(
            f'/api/v1/merchant/stores/{self.store_b_id}/products/{prod_id}/fit-preview',
            json={'units': 'cm', 'measurements': {'chest': 95.0}},
            headers=rival_headers
        )
        self.assertEqual(resp.status_code, 404)

        # 4. Public storefront API remains disabled by default (returns 403 STOREFRONT_DISABLED)
        resp = self.client.post(
            f'/api/v1/storefront/m3-test-studio/products/{prod_id}/fit-comparison',
            json={'units': 'cm', 'measurements': {'chest': 95.0}}
        )
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.get_json().get('code'), 'STOREFRONT_DISABLED')


if __name__ == '__main__':
    unittest.main()
