import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, MerchantOrganization, Store, StoreMembership


class TestStoreRoutes(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-store-routes'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Customer (role 'user')
            customer = User(username='customer_bob', email='bob@test.com', role='user')
            customer.set_password('CustomerPass123!')

            # 2. Seller 1 (role 'seller')
            seller1 = User(username='seller_one', email='seller1@test.com', role='seller')
            seller1.set_password('Pass123!')

            # 3. Seller 2 (role 'seller' - distinct tenant)
            seller2 = User(username='seller_two', email='seller2@test.com', role='seller')
            seller2.set_password('Pass123!')

            # 4. Platform Admin (role 'admin')
            admin = User(username='super_admin', email='admin@test.com', role='admin')
            admin.set_password('AdminPass123!')

            db.session.add_all([customer, seller1, seller2, admin])
            db.session.commit()

            self.customer_id = customer.id
            self.seller1_id = seller1.id
            self.seller2_id = seller2.id
            self.admin_id = admin.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password='Pass123!'):
        res = self.client.post('/api/login', json={'username': username, 'password': password})
        data = res.get_json() or {}
        self.csrf_token = data.get('csrf_token')
        return res

    def _post(self, url, json=None, headers=None):
        h = {}
        if hasattr(self, 'csrf_token') and self.csrf_token:
            h['X-CSRFToken'] = self.csrf_token
        if headers:
            h.update(headers)
        return self.client.post(url, json=json, headers=h)

    def _put(self, url, json=None, headers=None):
        h = {}
        if hasattr(self, 'csrf_token') and self.csrf_token:
            h['X-CSRFToken'] = self.csrf_token
        if headers:
            h.update(headers)
        return self.client.put(url, json=json, headers=h)

    def test_unauthenticated_store_access(self):
        """Unauthenticated requests must be rejected with 401"""
        res_get = self.client.get('/api/v1/merchant/stores')
        self.assertEqual(res_get.status_code, 401)

        res_post = self.client.post('/api/v1/merchant/stores', json={'name': 'My Store'})
        self.assertEqual(res_post.status_code, 401)

    def test_unauthorized_customer_cannot_create_store(self):
        """Regular customer (role 'user') cannot create stores (403 Forbidden)"""
        self._login('customer_bob', 'CustomerPass123!')
        res = self._post('/api/v1/merchant/stores', json={'name': 'Illegal Customer Store'})
        self.assertEqual(res.status_code, 403)
        self.assertIn('Merchant access required', res.get_json()['error'])

    def test_seller_first_store_creation_atomic(self):
        """Seller creating their first store atomically creates Org, Store, and Owner Membership"""
        self._login('seller_one')
        res = self._post('/api/v1/merchant/stores', json={
            'name': 'Nordic Boutique',
            'currency': 'EUR',
            'platform_type': 'shopify'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        store = data['store']

        self.assertEqual(store['name'], 'Nordic Boutique')
        self.assertEqual(store['slug'], 'nordic-boutique')
        self.assertEqual(store['currency'], 'EUR')
        self.assertEqual(store['platform_type'], 'shopify')
        self.assertEqual(store['connection_status'], 'disconnected')
        self.assertEqual(store['role'], 'owner')

        with self.app.app_context():
            # Verify database records
            created_store = db.session.get(Store, store['id'])
            self.assertIsNotNone(created_store)
            self.assertEqual(created_store.connection_status, 'disconnected')

            # Verify organization
            org = created_store.organization
            self.assertIsNotNone(org)
            self.assertEqual(org.name, "seller_one's Organization")

            # Verify membership
            membership = StoreMembership.query.filter_by(
                user_id=self.seller1_id,
                store_id=created_store.id
            ).first()
            self.assertIsNotNone(membership)
            self.assertEqual(membership.role, 'owner')

    def test_duplicate_store_slug_generation(self):
        """Creating two stores with the same name generates unique, conflict-free slugs"""
        self._login('seller_one')
        res1 = self._post('/api/v1/merchant/stores', json={'name': 'Alpine Style'})
        self.assertEqual(res1.status_code, 201)
        self.assertEqual(res1.get_json()['store']['slug'], 'alpine-style')

        res2 = self._post('/api/v1/merchant/stores', json={'name': 'Alpine Style'})
        self.assertEqual(res2.status_code, 201)
        self.assertEqual(res2.get_json()['store']['slug'], 'alpine-style-1')

    def test_unauthorized_cross_tenant_access_idor_protection(self):
        """Seller 2 cannot view or edit Seller 1's store (returns 404 to prevent enumeration)"""
        # Seller 1 creates store
        self._login('seller_one')
        create_res = self._post('/api/v1/merchant/stores', json={'name': 'Seller 1 Vault'})
        store_id = create_res.get_json()['store']['id']

        # Seller 2 logs in
        self.client.get('/api/logout')
        self._login('seller_two')

        # Seller 2 list is empty
        list_res = self.client.get('/api/v1/merchant/stores')
        self.assertEqual(len(list_res.get_json()['stores']), 0)

        # GET Seller 1 store returns 404
        get_res = self.client.get(f'/api/v1/merchant/stores/{store_id}')
        self.assertEqual(get_res.status_code, 404)
        self.assertEqual(get_res.get_json()['error'], 'Store not found')

        # PUT Seller 1 store returns 404
        put_res = self._put(f'/api/v1/merchant/stores/{store_id}', json={'name': 'Hacked'})
        self.assertEqual(put_res.status_code, 404)

    def test_store_staff_restrictions(self):
        """Staff can view store details but cannot update store settings (403)"""
        self._login('seller_one')
        create_res = self._post('/api/v1/merchant/stores', json={'name': 'Store For Staff Test'})
        store_id = create_res.get_json()['store']['id']

        # Assign Seller 2 as staff of Seller 1's store
        with self.app.app_context():
            store = db.session.get(Store, store_id)
            staff_membership = StoreMembership(
                organization_id=store.organization_id,
                store_id=store.id,
                user_id=self.seller2_id,
                role='staff'
            )
            db.session.add(staff_membership)
            db.session.commit()

        # Seller 2 logs in
        self.client.get('/api/logout')
        self._login('seller_two')

        # Staff can view store details
        get_res = self.client.get(f'/api/v1/merchant/stores/{store_id}')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()['store']['role'], 'staff')

        # Staff cannot update store settings (403)
        put_res = self._put(f'/api/v1/merchant/stores/{store_id}', json={'name': 'Staff Renaming'})
        self.assertEqual(put_res.status_code, 403)
        self.assertIn('Requires admin privileges', put_res.get_json()['error'])

    def test_invalid_request_payloads(self):
        """Payload validation: empty name, invalid currency, invalid platform"""
        self._login('seller_one')

        # Empty name
        r1 = self._post('/api/v1/merchant/stores', json={'name': '   '})
        self.assertEqual(r1.status_code, 400)
        self.assertIn('Store name is required', r1.get_json()['error'])

        # Invalid currency
        r2 = self._post('/api/v1/merchant/stores', json={'name': 'Store', 'currency': 'BITCOIN'})
        self.assertEqual(r2.status_code, 400)
        self.assertIn('Invalid currency', r2.get_json()['error'])

        # Invalid platform
        r3 = self._post('/api/v1/merchant/stores', json={'name': 'Store', 'platform_type': 'myspace'})
        self.assertEqual(r3.status_code, 400)
        self.assertIn('Invalid platform', r3.get_json()['error'])

        # Excessive website_url length (>255)
        r4 = self._post('/api/v1/merchant/stores', json={'name': 'Store', 'website_url': 'https://example.com/' + 'a' * 250})
        self.assertEqual(r4.status_code, 400)
        self.assertIn('Store website URL must not exceed 255 characters', r4.get_json()['error'])

    def test_prevent_client_modification_of_connection_status(self):
        """Clients cannot arbitrarily change connection_status via PUT"""
        self._login('seller_one')
        create_res = self._post('/api/v1/merchant/stores', json={'name': 'Status Security Test'})
        store_id = create_res.get_json()['store']['id']

        put_res = self._put(f'/api/v1/merchant/stores/{store_id}', json={
            'connection_status': 'connected'
        })
        self.assertEqual(put_res.status_code, 403)
        self.assertIn('Direct modification of connection_status is not permitted', put_res.get_json()['error'])

    def test_csrf_protection_blocks_untrusted_origin(self):
        """State-changing request with an untrusted Origin header is rejected with 403"""
        self._login('seller_one')
        res = self._post(
            '/api/v1/merchant/stores',
            headers={'Origin': 'http://malicious-attacker.com'},
            json={'name': 'CSRF Attack Store'}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn('CSRF verification failed', res.get_json()['error'])


if __name__ == '__main__':
    unittest.main()
