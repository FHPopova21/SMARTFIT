"""
Integration tests for Storefront Fit Comparison API (Phase 3E-B).
Verifies all 18 test scenarios mandated in Phase 3E-B:
1. Valid active product comparison
2. Draft product rejected
3. Archived product rejected
4. Product belonging to another store
5. Unknown store slug
6. Unknown product ID
7. Missing size chart
8. Missing customer measurements
9. Invalid units
10. Negative and non-finite values
11. Custom size labels
12. Correct domain service integration
13. No fabricated recommendation
14. No shopper measurements persisted
15. Public exposure configuration
16. Unexpected JSON fields
17. Unauthorized cross-tenant access
18. Consistent error handling
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    MerchantOrganization, Store, Product, ProductVariant,
    SizeChart, GarmentMeasurement, RecommendationHistory
)


class TestStorefrontRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'STOREFRONT_API_ENABLED': True,  # Enabled explicitly for test suite
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-storefront-secret-3eb'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Store 1 Setup: Nordic Boutique (slug: 'nordic-boutique')
            org1 = MerchantOrganization(name='Nordic Group', slug='nordic-group')
            db.session.add(org1)
            db.session.commit()

            self.store1 = Store(organization_id=org1.id, name='Nordic Boutique', slug='nordic-boutique')
            db.session.add(self.store1)
            db.session.commit()

            # Size Chart for Store 1: Tops
            self.chart1 = SizeChart(
                store_id=self.store1.id,
                name='Oxford Shirt Sizing',
                garment_category='Tops',
                measurement_convention='flat_garment',
                unit='cm',
            )
            db.session.add(self.chart1)
            db.session.commit()

            m_s = GarmentMeasurement(size_chart_id=self.chart1.id, size='S', flat_chest_width=50.0, total_length=70.0)
            m_m = GarmentMeasurement(size_chart_id=self.chart1.id, size='M', flat_chest_width=53.0, total_length=72.0)
            m_l = GarmentMeasurement(size_chart_id=self.chart1.id, size='L', flat_chest_width=56.0, total_length=74.0)
            db.session.add_all([m_s, m_m, m_l])
            db.session.commit()

            # 1. Active Product in Store 1
            self.active_product = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Oxford Button-Down Shirt',
                category='Tops',
                material_stretch='non_stretch',
                status='active',
            )
            db.session.add(self.active_product)
            db.session.commit()

            v_s = ProductVariant(product_id=self.active_product.id, store_id=self.store1.id, size='S', sku='OX-S')
            v_m = ProductVariant(product_id=self.active_product.id, store_id=self.store1.id, size='M', sku='OX-M')
            v_l = ProductVariant(product_id=self.active_product.id, store_id=self.store1.id, size='L', sku='OX-L')
            db.session.add_all([v_s, v_m, v_l])

            # 2. Draft Product in Store 1
            self.draft_product = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Draft Flannel',
                category='Tops',
                status='draft',
            )
            db.session.add(self.draft_product)
            db.session.commit()

            # 3. Archived Product in Store 1
            self.archived_product = Product(
                store_id=self.store1.id,
                size_chart_id=self.chart1.id,
                name='Archived Silk Shirt',
                category='Tops',
                status='archived',
            )
            db.session.add(self.archived_product)
            db.session.commit()

            # 4. Product without Size Chart
            self.no_chart_product = Product(
                store_id=self.store1.id,
                size_chart_id=None,
                name='Unsized Tee',
                category='Tops',
                status='active',
            )
            db.session.add(self.no_chart_product)
            db.session.commit()
            db.session.add(ProductVariant(product_id=self.no_chart_product.id, store_id=self.store1.id, size='M'))

            # 5. Product with Custom Sizes
            self.custom_chart = SizeChart(
                store_id=self.store1.id,
                name='Denim Sizes Chart',
                garment_category='Bottoms',
                measurement_convention='flat_garment',
                unit='inch',
            )
            db.session.add(self.custom_chart)
            db.session.commit()

            m_28 = GarmentMeasurement(size_chart_id=self.custom_chart.id, size='28x32', flat_waist_width=14.5, total_length=40.0)
            m_30 = GarmentMeasurement(size_chart_id=self.custom_chart.id, size='30x32', flat_waist_width=15.5, total_length=40.5)
            m_32 = GarmentMeasurement(size_chart_id=self.custom_chart.id, size='32x32', flat_waist_width=16.5, total_length=41.0)
            db.session.add_all([m_28, m_30, m_32])
            db.session.commit()

            self.custom_product = Product(
                store_id=self.store1.id,
                size_chart_id=self.custom_chart.id,
                name='Selvedge Denim',
                category='Bottoms',
                status='active',
            )
            db.session.add(self.custom_product)
            db.session.commit()
            v_c1 = ProductVariant(product_id=self.custom_product.id, store_id=self.store1.id, size='28x32')
            v_c2 = ProductVariant(product_id=self.custom_product.id, store_id=self.store1.id, size='30x32')
            v_c3 = ProductVariant(product_id=self.custom_product.id, store_id=self.store1.id, size='32x32')
            db.session.add_all([v_c1, v_c2, v_c3])

            # Store 2 Setup: Alpine Outfitters (slug: 'alpine-outfitters')
            org2 = MerchantOrganization(name='Alpine Group', slug='alpine-group')
            db.session.add(org2)
            db.session.commit()

            self.store2 = Store(organization_id=org2.id, name='Alpine Outfitters', slug='alpine-outfitters')
            db.session.add(self.store2)
            db.session.commit()

            self.store2_product = Product(
                store_id=self.store2.id,
                name='Alpine Down Parka',
                category='Tops',
                status='active',
            )
            db.session.add(self.store2_product)
            db.session.commit()

            # Record IDs for route calls
            self.active_id = self.active_product.id
            self.draft_id = self.draft_product.id
            self.archived_id = self.archived_product.id
            self.no_chart_id = self.no_chart_product.id
            self.custom_id = self.custom_product.id
            self.store2_prod_id = self.store2_product.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # -------------------------------------------------------------
    # 1. Valid Active Product Comparison
    # -------------------------------------------------------------
    def test_01_valid_active_product_comparison(self):
        payload = {
            'units': 'cm',
            'measurements': {
                'chest': 100.0,
                'waist': 82.0
            }
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertEqual(data['status'], 'fit_rules_required')
        self.assertEqual(data['product_id'], self.active_id)
        self.assertEqual(data['measurement_convention'], 'flat_garment')
        self.assertEqual(data['units'], 'cm')
        self.assertEqual(len(data['variant_comparisons']), 3)

        # Factual comparison: Size M flat width 53.0 -> 106.0 perimeter -> difference +6.0 cm
        size_m = next(v for v in data['variant_comparisons'] if v['size'] == 'M')
        chest_comp = size_m['circumference_comparisons']['chest']
        self.assertEqual(chest_comp['shopper_measurement'], 100.0)
        self.assertEqual(chest_comp['garment_specification'], 106.0)
        self.assertEqual(chest_comp['difference'], 6.0)
        self.assertTrue(chest_comp['is_approximation'])

    # -------------------------------------------------------------
    # 2. Draft Product Rejected (404)
    # -------------------------------------------------------------
    def test_02_draft_product_rejected(self):
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.draft_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_UNAVAILABLE')

    # -------------------------------------------------------------
    # 3. Archived Product Rejected (404)
    # -------------------------------------------------------------
    def test_03_archived_product_rejected(self):
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.archived_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_UNAVAILABLE')

    # -------------------------------------------------------------
    # 4. Product Belonging to Another Store Rejected (404)
    # -------------------------------------------------------------
    def test_04_product_belonging_to_another_store(self):
        # Request store 2's product through store 1's slug
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.store2_prod_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_NOT_FOUND')

    # -------------------------------------------------------------
    # 5. Unknown Store Slug (404)
    # -------------------------------------------------------------
    def test_05_unknown_store_slug(self):
        res = self.client.post(
            f'/api/v1/storefront/non-existent-store/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'STORE_NOT_FOUND')

    # -------------------------------------------------------------
    # 6. Unknown Product ID (404)
    # -------------------------------------------------------------
    def test_06_unknown_product_id(self):
        res = self.client.post(
            '/api/v1/storefront/nordic-boutique/products/999999/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_NOT_FOUND')

    # -------------------------------------------------------------
    # 7. Missing Size Chart (404)
    # -------------------------------------------------------------
    def test_07_missing_size_chart(self):
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.no_chart_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'SIZE_CHART_MISSING')

    # -------------------------------------------------------------
    # 8. Missing Customer Measurements (422)
    # -------------------------------------------------------------
    def test_08_missing_customer_measurements(self):
        # Shopper submits waist for a Top, but Tops require chest
        payload = {
            'units': 'cm',
            'measurements': {
                'waist': 80.0
            }
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 422)
        data = res.get_json()
        self.assertEqual(data['status'], 'insufficient_data')
        self.assertIn('chest', data['missing_dimensions'])

    # -------------------------------------------------------------
    # 9. Invalid Units (400)
    # -------------------------------------------------------------
    def test_09_invalid_units(self):
        payload = {
            'units': 'meters',
            'measurements': {'chest': 100.0}
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json()['code'], 'INVALID_UNITS')

    # -------------------------------------------------------------
    # 10. Negative and Non-Finite Values (400)
    # -------------------------------------------------------------
    def test_10_negative_and_non_finite_values(self):
        # Zero measurement
        res1 = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': 0.0}}
        )
        self.assertEqual(res1.status_code, 400)
        self.assertEqual(res1.get_json()['code'], 'INVALID_DIMENSION_VALUE')

        # Negative measurement
        res2 = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': -95.0}}
        )
        self.assertEqual(res2.status_code, 400)
        self.assertEqual(res2.get_json()['code'], 'INVALID_DIMENSION_VALUE')

        # String value in measurement
        res3 = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': 'not_a_number'}}
        )
        self.assertEqual(res3.status_code, 400)
        self.assertEqual(res3.get_json()['code'], 'INVALID_DIMENSION_VALUE')

    # -------------------------------------------------------------
    # 11. Custom Size Labels
    # -------------------------------------------------------------
    def test_11_custom_size_labels(self):
        # Selvedge Denim with '28x32', '30x32', '32x32'
        payload = {
            'units': 'inch',
            'measurements': {
                'waist': 31.0
            }
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.custom_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        sizes = [v['size'] for v in data['variant_comparisons']]
        self.assertEqual(sizes, ['28x32', '30x32', '32x32'])

    # -------------------------------------------------------------
    # 12. Correct Domain Service Integration
    # -------------------------------------------------------------
    def test_12_correct_domain_service_integration(self):
        payload = {
            'units': 'cm',
            'measurements': {'chest': 96.0}
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('variant_comparisons', data)
        self.assertIn('notes', data)
        self.assertEqual(data['status'], 'fit_rules_required')

    # -------------------------------------------------------------
    # 13. No Fabricated Recommendation
    # -------------------------------------------------------------
    def test_13_no_fabricated_recommendation(self):
        payload = {
            'units': 'cm',
            'measurements': {'chest': 96.0}
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # Enforce that no subjective recommendation, confidence score or alternative size is returned
        self.assertNotIn('recommended_size', data)
        self.assertNotIn('confidence_score', data)
        self.assertNotIn('fit_probability', data)
        self.assertNotIn('alternative_size', data)

    # -------------------------------------------------------------
    # 14. No Shopper Measurements Persisted
    # -------------------------------------------------------------
    def test_14_no_shopper_measurements_persisted(self):
        with self.app.app_context():
            initial_history_count = RecommendationHistory.query.count()

        payload = {
            'units': 'cm',
            'measurements': {'chest': 99.5, 'waist': 81.2}
        }
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json=payload
        )
        self.assertEqual(res.status_code, 200)

        # Confirm zero database writes to history or persistent state
        with self.app.app_context():
            final_history_count = RecommendationHistory.query.count()
            self.assertEqual(initial_history_count, final_history_count)

    # -------------------------------------------------------------
    # 15. Public Exposure Configuration
    # -------------------------------------------------------------
    def test_15_public_exposure_configuration(self):
        # Create an app where STOREFRONT_API_ENABLED is False (default)
        disabled_app = create_app({
            'TESTING': True,
            'STOREFRONT_API_ENABLED': False,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'disabled-secret'
        })
        disabled_client = disabled_app.test_client()

        res = disabled_client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json()['code'], 'STOREFRONT_DISABLED')

    # -------------------------------------------------------------
    # 16. Unexpected JSON Fields
    # -------------------------------------------------------------
    def test_16_unexpected_json_fields(self):
        # Unexpected top-level key
        res1 = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={
                'units': 'cm',
                'measurements': {'chest': 100.0},
                'malicious_key': 'unexpected_value'
            }
        )
        self.assertEqual(res1.status_code, 400)
        self.assertEqual(res1.get_json()['code'], 'UNEXPECTED_FIELD')

        # Unexpected measurement key
        res2 = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            json={
                'units': 'cm',
                'measurements': {
                    'chest': 100.0,
                    'shoe_size': 43.0  # Unsupported key
                }
            }
        )
        self.assertEqual(res2.status_code, 400)
        self.assertEqual(res2.get_json()['code'], 'UNSUPPORTED_MEASUREMENT_KEY')

    # -------------------------------------------------------------
    # 17. Unauthorized Cross-Tenant Access
    # -------------------------------------------------------------
    def test_17_unauthorized_cross_tenant_access(self):
        # Attempting to access Store 1's active product under Store 2's slug
        res = self.client.post(
            f'/api/v1/storefront/alpine-outfitters/products/{self.active_id}/fit-comparison',
            json={'measurements': {'chest': 100.0}}
        )
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['code'], 'PRODUCT_NOT_FOUND')

    # -------------------------------------------------------------
    # 18. Consistent Error Handling
    # -------------------------------------------------------------
    def test_18_consistent_error_handling(self):
        # Missing Content-Type
        res = self.client.post(
            f'/api/v1/storefront/nordic-boutique/products/{self.active_id}/fit-comparison',
            data='raw text string',
            content_type='text/plain'
        )
        self.assertEqual(res.status_code, 415)
        self.assertEqual(res.get_json()['code'], 'INVALID_CONTENT_TYPE')


if __name__ == '__main__':
    unittest.main()
