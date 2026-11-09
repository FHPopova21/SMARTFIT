import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User, MerchantOrganization, Store, StoreMembership,
    Product, ProductVariant, SizeChart, GarmentMeasurement, Clothing
)


class TestProductRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-product-routes'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Platform Admin
            self.admin = User(username='platform_admin', email='admin@test.com', role='admin')
            self.admin.set_password('AdminPass123!')

            # 2. Store 1 Owner (seller)
            self.owner1 = User(username='store1_owner', email='owner1@test.com', role='seller')
            self.owner1.set_password('Pass123!')

            # 3. Store 1 Staff (seller)
            self.staff1 = User(username='store1_staff', email='staff1@test.com', role='seller')
            self.staff1.set_password('Pass123!')

            # 4. Store 2 Owner (seller - separate tenant)
            self.owner2 = User(username='store2_owner', email='owner2@test.com', role='seller')
            self.owner2.set_password('Pass123!')

            db.session.add_all([self.admin, self.owner1, self.staff1, self.owner2])
            db.session.commit()

            # Create Organizations & Stores
            org1 = MerchantOrganization(name='Org 1', slug='org-1')
            org2 = MerchantOrganization(name='Org 2', slug='org-2')
            db.session.add_all([org1, org2])
            db.session.commit()

            self.store1 = Store(organization_id=org1.id, name='Boutique Alpha', slug='boutique-alpha')
            self.store2 = Store(organization_id=org2.id, name='Denim Co', slug='denim-co')
            db.session.add_all([self.store1, self.store2])
            db.session.commit()

            # Memberships
            m_owner1 = StoreMembership(organization_id=org1.id, store_id=self.store1.id, user_id=self.owner1.id, role='owner')
            m_staff1 = StoreMembership(organization_id=org1.id, store_id=self.store1.id, user_id=self.staff1.id, role='staff')
            m_owner2 = StoreMembership(organization_id=org2.id, store_id=self.store2.id, user_id=self.owner2.id, role='owner')
            db.session.add_all([m_owner1, m_staff1, m_owner2])

            # Legacy Clothing item for compatibility testing
            legacy_item = Clothing(
                name='Vintage Leather Jacket',
                type='jacket',
                material='non-elastic',
                size='L',
                width=55.0,
                length=70.0,
                price=149.99,
                seller_id=self.owner1.id
            )
            db.session.add(legacy_item)
            db.session.commit()

            self.store1_id = self.store1.id
            self.store2_id = self.store2.id
            self.legacy_item_id = legacy_item.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password='Pass123!'):
        if username == 'platform_admin':
            password = 'AdminPass123!'
        res = self.client.post('/api/login', json={'username': username, 'password': password})
        data = res.get_json() or {}
        self.csrf_token = data.get('csrf_token')
        return res

    def _headers(self, csrf=True):
        h = {}
        if csrf and hasattr(self, 'csrf_token') and self.csrf_token:
            h['X-CSRFToken'] = self.csrf_token
        return h

    # -----------------------------------------------------------
    # 1. Product Creation & Default Draft Status
    # -----------------------------------------------------------
    def test_01_product_creation(self):
        """Seller can create a draft product with valid attributes and default 'draft' status"""
        self._login('store1_owner')
        payload = {
            'name': 'Oxford Cotton Shirt',
            'category': 'tops',
            'brand': 'Alpha Tailors',
            'material_stretch': 'non_stretch',
            'description': 'Classic regular fit cotton shirt',
            'variants': [
                {'size': 'M', 'sku': 'SHIRT-OX-M'},
                {'size': 'L', 'sku': 'SHIRT-OX-L'}
            ]
        }
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json=payload,
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        p = data['product']
        self.assertEqual(p['name'], 'Oxford Cotton Shirt')
        self.assertEqual(p['status'], 'draft')
        self.assertEqual(p['material_stretch'], 'non_stretch')
        self.assertEqual(len(p['variants']), 2)

    # -----------------------------------------------------------
    # 2. Multiple Variants in One Transaction
    # -----------------------------------------------------------
    def test_02_multiple_variants_in_one_transaction(self):
        """Multiple variants are created within the single atomic transaction"""
        self._login('store1_owner')
        payload = {
            'name': 'Casual Tee',
            'category': 'tops',
            'variants': [
                {'size': 'S', 'sku': 'TEE-S', 'barcode': '1111111111'},
                {'size': 'M', 'sku': 'TEE-M', 'barcode': '2222222222'},
                {'size': 'L', 'sku': 'TEE-L', 'barcode': '3333333333'},
                {'size': 'XL', 'sku': 'TEE-XL', 'barcode': '4444444444'}
            ]
        }
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json=payload,
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()['product']
        self.assertEqual(len(data['variants']), 4)
        sizes = [v['size'] for v in data['variants']]
        self.assertListEqual(sizes, ['S', 'M', 'L', 'XL'])

    # -----------------------------------------------------------
    # 3. Product Rollback When a Variant Fails
    # -----------------------------------------------------------
    def test_03_product_rollback_when_variant_fails(self):
        """If a variant fails validation (e.g. empty size or duplicate size), the entire product is rolled back"""
        self._login('store1_owner')
        payload = {
            'name': 'Failing Product',
            'category': 'tops',
            'variants': [
                {'size': 'M', 'sku': 'FAIL-M'},
                {'size': '', 'sku': 'FAIL-BAD'}  # Invalid empty size
            ]
        }
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json=payload,
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 400)

        # Confirm no product or variant was persisted
        with self.app.app_context():
            p = Product.query.filter_by(name='Failing Product').first()
            self.assertIsNone(p)
            v = ProductVariant.query.filter_by(sku='FAIL-M').first()
            self.assertIsNone(v)

    # -----------------------------------------------------------
    # 4. Store-Specific Product Listing
    # -----------------------------------------------------------
    def test_04_store_specific_product_listing(self):
        """Listing products strictly returns products belonging to the authorized store"""
        self._login('store1_owner')
        # Create product in Store 1
        self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Store 1 Item', 'category': 'tops'},
            headers=self._headers()
        )

        # Login as Store 2 Owner and create product in Store 2
        self._login('store2_owner')
        self.client.post(
            f'/api/v1/merchant/stores/{self.store2_id}/products',
            json={'name': 'Store 2 Item', 'category': 'bottoms'},
            headers=self._headers()
        )

        # Fetch Store 2 products: only Store 2 Item should appear
        res2 = self.client.get(f'/api/v1/merchant/stores/{self.store2_id}/products')
        self.assertEqual(res2.status_code, 200)
        names = [p['name'] for p in res2.get_json()['products']]
        self.assertIn('Store 2 Item', names)
        self.assertNotIn('Store 1 Item', names)

    # -----------------------------------------------------------
    # 5. Cross-Store Product Access Rejection
    # -----------------------------------------------------------
    def test_05_cross_store_product_access_rejection(self):
        """Accessing a product ID that belongs to another store returns 404 (prevents IDOR)"""
        self._login('store1_owner')
        res_create = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Secret Item', 'category': 'tops'},
            headers=self._headers()
        )
        prod_id = res_create.get_json()['product']['id']

        # Store 2 owner attempts to access Store 1's product
        self._login('store2_owner')
        res_get = self.client.get(f'/api/v1/merchant/stores/{self.store2_id}/products/{prod_id}')
        self.assertEqual(res_get.status_code, 404)

        # Store 2 owner attempts to access via Store 1's URL -> 404 because no membership in Store 1
        res_cross_url = self.client.get(f'/api/v1/merchant/stores/{self.store1_id}/products/{prod_id}')
        self.assertEqual(res_cross_url.status_code, 404)

    # -----------------------------------------------------------
    # 6. Cross-Store Size Chart Assignment Rejection
    # -----------------------------------------------------------
    def test_06_cross_store_size_chart_assignment_rejection(self):
        """Assigning a size chart belonging to Store 1 to a product in Store 2 is rejected"""
        # Create size chart in Store 1
        self._login('store1_owner')
        chart_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={'name': 'Store 1 Chart', 'garment_category': 'tops'},
            headers=self._headers()
        )
        chart_id = chart_res.get_json()['size_chart']['id']

        # Store 2 owner attempts to assign Store 1's size chart
        self._login('store2_owner')
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store2_id}/products',
            json={
                'name': 'Hacker Product',
                'category': 'tops',
                'size_chart_id': chart_id
            },
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('does not belong to this store', res.get_json()['error'])

    # -----------------------------------------------------------
    # 7. Staff Read-Only Permissions
    # -----------------------------------------------------------
    def test_07_staff_read_only_permissions(self):
        """Staff members can view products and charts (GET), but cannot mutate (POST/PUT/DELETE return 403)"""
        self._login('store1_staff')

        # GET products succeeds
        res_get = self.client.get(f'/api/v1/merchant/stores/{self.store1_id}/products')
        self.assertEqual(res_get.status_code, 200)

        # POST product returns 403 Forbidden
        res_post = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Staff Item', 'category': 'tops'},
            headers=self._headers()
        )
        self.assertEqual(res_post.status_code, 403)

        # POST size-chart returns 403 Forbidden
        res_chart = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={'name': 'Staff Chart', 'garment_category': 'tops'},
            headers=self._headers()
        )
        self.assertEqual(res_chart.status_code, 403)

    # -----------------------------------------------------------
    # 8. Admin and Owner Write Permissions
    # -----------------------------------------------------------
    def test_08_admin_and_owner_write_permissions(self):
        """Store owners and platform admins have full write permissions"""
        # Owner write
        self._login('store1_owner')
        res_owner = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Owner Product', 'category': 'tops'},
            headers=self._headers()
        )
        self.assertEqual(res_owner.status_code, 201)
        prod_id = res_owner.get_json()['product']['id']

        # Platform Admin write override
        self._login('platform_admin')
        res_admin = self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{prod_id}',
            json={'name': 'Admin Updated Product'},
            headers=self._headers()
        )
        self.assertEqual(res_admin.status_code, 200)
        self.assertEqual(res_admin.get_json()['product']['name'], 'Admin Updated Product')

    # -----------------------------------------------------------
    # 9. CSRF on Every Write Operation
    # -----------------------------------------------------------
    def test_09_csrf_protection_on_writes(self):
        """State-changing operations without CSRF token are blocked with 403"""
        self._login('store1_owner')

        # POST without CSRF header
        res_no_csrf = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'CSRF Attack', 'category': 'tops'}
        )
        self.assertEqual(res_no_csrf.status_code, 403)

        # POST with invalid CSRF token
        res_bad_csrf = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'CSRF Attack', 'category': 'tops'},
            headers={'X-CSRFToken': 'tampered-csrf-token'}
        )
        self.assertEqual(res_bad_csrf.status_code, 403)

    # -----------------------------------------------------------
    # 10. Duplicate SKU Rejection
    # -----------------------------------------------------------
    def test_10_duplicate_sku_rejection(self):
        """Duplicate SKU within the same store is rejected with 400"""
        self._login('store1_owner')
        self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={
                'name': 'P1',
                'category': 'tops',
                'variants': [{'size': 'M', 'sku': 'UNIQUE-SKU-99'}]
            },
            headers=self._headers()
        )

        # Attempt to create another product with the same SKU
        res_dup = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={
                'name': 'P2',
                'category': 'tops',
                'variants': [{'size': 'M', 'sku': 'UNIQUE-SKU-99'}]
            },
            headers=self._headers()
        )
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn('already exists in this store', res_dup.get_json()['error'])

    # -----------------------------------------------------------
    # 11. Duplicate Size Label Rejection
    # -----------------------------------------------------------
    def test_11_duplicate_size_label_rejection(self):
        """Duplicate size labels on the same product are rejected"""
        self._login('store1_owner')
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={
                'name': 'Jeans',
                'category': 'bottoms',
                'variants': [
                    {'size': '32x34', 'sku': 'JN-32-1'},
                    {'size': '32x34', 'sku': 'JN-32-2'}
                ]
            },
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('Duplicate size label', res.get_json()['error'])

    # -----------------------------------------------------------
    # 12. Custom Size Labels
    # -----------------------------------------------------------
    def test_12_custom_size_labels(self):
        """Custom size labels (32x34, S/M, One Size) are supported and properly serialized"""
        self._login('store1_owner')
        res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={
                'name': 'Versatile Belt & Denim',
                'category': 'accessories',
                'variants': [
                    {'size': '32x34'},
                    {'size': 'S/M'},
                    {'size': 'One Size'}
                ]
            },
            headers=self._headers()
        )
        self.assertEqual(res.status_code, 201)
        variants = res.get_json()['product']['variants']
        sizes = [v['size'] for v in variants]
        self.assertIn('32x34', sizes)
        self.assertIn('S/M', sizes)
        self.assertIn('One Size', sizes)

    # -----------------------------------------------------------
    # 13. Size Chart Measurement Validation
    # -----------------------------------------------------------
    def test_13_size_chart_measurement_validation(self):
        """Measurement values must be positive floats; negative values or invalid types are rejected"""
        self._login('store1_owner')

        # Negative measurement rejected
        res_neg = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={
                'name': 'Invalid Chart',
                'garment_category': 'tops',
                'measurements': [{'size': 'M', 'flat_chest_width': -5.0}]
            },
            headers=self._headers()
        )
        self.assertEqual(res_neg.status_code, 400)
        self.assertIn('must be greater than 0', res_neg.get_json()['error'])

        # Valid measurements with explicit semantics and NULL for omitted dimensions
        res_valid = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={
                'name': 'Premium Shirt Specs',
                'garment_category': 'tops',
                'chart_type': 'garment_dimensions',
                'measurement_convention': 'flat_garment',
                'unit': 'cm',
                'measurements': [
                    {'size': 'S', 'flat_chest_width': 50.0, 'total_length': 70.0},
                    {'size': 'M', 'flat_chest_width': 53.0, 'total_length': 72.0}
                ]
            },
            headers=self._headers()
        )
        self.assertEqual(res_valid.status_code, 201)
        chart = res_valid.get_json()['size_chart']
        self.assertEqual(len(chart['measurements']), 2)
        m_s = chart['measurements'][0]
        self.assertEqual(m_s['flat_chest_width'], 50.0)
        self.assertIsNone(m_s['flat_waist_width'])  # Omitted dimension remains NULL

    # -----------------------------------------------------------
    # 14. Shared Size Chart Behavior
    # -----------------------------------------------------------
    def test_14_shared_size_chart_behavior(self):
        """Multiple products within the same store can share the same size chart"""
        self._login('store1_owner')
        chart_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={'name': 'Standard Tops Chart', 'garment_category': 'tops'},
            headers=self._headers()
        )
        chart_id = chart_res.get_json()['size_chart']['id']

        # Product 1
        p1 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Product 1', 'category': 'tops', 'size_chart_id': chart_id},
            headers=self._headers()
        )
        self.assertEqual(p1.status_code, 201)

        # Product 2
        p2 = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Product 2', 'category': 'tops', 'size_chart_id': chart_id},
            headers=self._headers()
        )
        self.assertEqual(p2.status_code, 201)

    # -----------------------------------------------------------
    # 15. Active Product Validation Rules
    # -----------------------------------------------------------
    def test_15_active_product_validation(self):
        """Activating a product requires variants, assigned size chart, and complete matching measurements"""
        self._login('store1_owner')

        # Product with NO size chart or variants
        p_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Incomplete Shirt', 'category': 'tops'},
            headers=self._headers()
        )
        p_id = p_res.get_json()['product']['id']

        # Attempt to activate immediately -> 422 Unprocessable Entity
        res_act = self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}',
            json={'status': 'active'},
            headers=self._headers()
        )
        self.assertEqual(res_act.status_code, 422)
        val_errs = res_act.get_json()['validation_errors']
        self.assertTrue(any('at least one size variant' in e for e in val_errs))

        # Add size chart with matching measurements
        c_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={
                'name': 'Complete Tops Chart',
                'garment_category': 'tops',
                'measurements': [
                    {'size': 'M', 'flat_chest_width': 52.0, 'total_length': 71.0}
                ]
            },
            headers=self._headers()
        )
        c_id = c_res.get_json()['size_chart']['id']

        # Add matching variant M and link size chart
        self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}/variants',
            json={'size': 'M', 'sku': 'SHIRT-M-1'},
            headers=self._headers()
        )

        # Now update with size_chart_id and status='active' -> Succeeded
        res_act_ok = self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}',
            json={'size_chart_id': c_id, 'status': 'active'},
            headers=self._headers()
        )
        self.assertEqual(res_act_ok.status_code, 200)
        self.assertEqual(res_act_ok.get_json()['product']['status'], 'active')

    # -----------------------------------------------------------
    # 16. Prevent Deletion & Unsafe Modification of Referenced Charts
    # -----------------------------------------------------------
    def test_16_prevent_deletion_and_modification_of_referenced_chart(self):
        """A size chart referenced by active products cannot be deleted or have its measurements altered (HTTP 409)"""
        self._login('store1_owner')

        # Create chart
        c_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts',
            json={
                'name': 'Active Spec Chart',
                'garment_category': 'tops',
                'measurements': [{'size': 'M', 'flat_chest_width': 50.0, 'total_length': 70.0}]
            },
            headers=self._headers()
        )
        c_id = c_res.get_json()['size_chart']['id']

        # Create and activate product using this chart
        p_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={
                'name': 'Active Product',
                'category': 'tops',
                'size_chart_id': c_id,
                'variants': [{'size': 'M'}]
            },
            headers=self._headers()
        )
        p_id = p_res.get_json()['product']['id']
        self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}',
            json={'status': 'active'},
            headers=self._headers()
        )

        # Attempt to delete referenced size chart -> 409 Conflict
        del_res = self.client.delete(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts/{c_id}',
            headers=self._headers()
        )
        self.assertEqual(del_res.status_code, 409)
        self.assertIn('referenced by existing products', del_res.get_json()['error'])

        # Attempt to alter measurements on active chart -> 409 Conflict
        edit_res = self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts/{c_id}',
            json={'measurements': [{'size': 'M', 'flat_chest_width': 55.0, 'total_length': 75.0}]},
            headers=self._headers()
        )
        self.assertEqual(edit_res.status_code, 409)
        self.assertIn('referenced by active products', edit_res.get_json()['error'])

        # Updating chart name only is allowed
        name_res = self.client.put(
            f'/api/v1/merchant/stores/{self.store1_id}/size-charts/{c_id}',
            json={'name': 'Renamed Spec Chart'},
            headers=self._headers()
        )
        self.assertEqual(name_res.status_code, 200)

    # -----------------------------------------------------------
    # 17. Safe Product Archiving
    # -----------------------------------------------------------
    def test_17_safe_product_archiving(self):
        """DELETE /products defaults to non-destructive archiving, hard_delete=true permanently deletes"""
        self._login('store1_owner')
        p_res = self.client.post(
            f'/api/v1/merchant/stores/{self.store1_id}/products',
            json={'name': 'Archive Me', 'category': 'tops'},
            headers=self._headers()
        )
        p_id = p_res.get_json()['product']['id']

        # Default DELETE -> Soft archive
        del_soft = self.client.delete(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}',
            headers=self._headers()
        )
        self.assertEqual(del_soft.status_code, 200)
        self.assertEqual(del_soft.get_json()['product']['status'], 'archived')

        with self.app.app_context():
            p = db.session.get(Product, p_id)
            self.assertIsNotNone(p)
            self.assertEqual(p.status, 'archived')

        # Hard delete
        del_hard = self.client.delete(
            f'/api/v1/merchant/stores/{self.store1_id}/products/{p_id}?hard_delete=true',
            headers=self._headers()
        )
        self.assertEqual(del_hard.status_code, 200)

        with self.app.app_context():
            p_gone = db.session.get(Product, p_id)
            self.assertIsNone(p_gone)

    # -----------------------------------------------------------
    # 18. Preservation of Legacy Routes
    # -----------------------------------------------------------
    def test_18_preservation_of_legacy_routes(self):
        """Legacy /clothes and authentication endpoints remain fully operational"""
        # Public listing of legacy clothing
        res_clothing = self.client.get('/api/clothes')
        self.assertEqual(res_clothing.status_code, 200)
        data = res_clothing.get_json()
        self.assertTrue(len(data) >= 1)
        self.assertEqual(data[0]['name'], 'Vintage Leather Jacket')

        # Legacy clothing detail
        res_detail = self.client.get(f'/api/clothes/{self.legacy_item_id}')
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(res_detail.get_json()['name'], 'Vintage Leather Jacket')


if __name__ == '__main__':
    unittest.main()
