import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flask import Blueprint, jsonify, g
from app import create_app, db
from app.models import User, MerchantOrganization, Store, StoreMembership
from app.decorators import store_required, get_user_stores

# Test blueprint
test_auth_bp = Blueprint('test_auth_bp', __name__)

@test_auth_bp.route('/test/stores/<int:store_id>/staff-only')
@store_required(min_role='staff')
def staff_endpoint(store_id):
    return jsonify({
        'message': 'staff access granted',
        'store_id': g.current_store.id,
        'role': g.current_role
    }), 200

@test_auth_bp.route('/test/stores/<int:store_id>/admin-only')
@store_required(min_role='admin')
def admin_endpoint(store_id):
    return jsonify({
        'message': 'admin access granted',
        'store_id': g.current_store.id,
        'role': g.current_role
    }), 200

@test_auth_bp.route('/test/stores/<int:store_id>/owner-only')
@store_required(min_role='owner')
def owner_endpoint(store_id):
    return jsonify({
        'message': 'owner access granted',
        'store_id': g.current_store.id,
        'role': g.current_role
    }), 200


class TestStoreAuthorization(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-auth'
        })
        self.app.register_blueprint(test_auth_bp)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # 1. Organization A
            org_a = MerchantOrganization(name="Org A", slug="org-a")
            db.session.add(org_a)
            db.session.commit()

            store_a1 = Store(organization_id=org_a.id, name="Store A1", slug="store-a1")
            store_a2 = Store(organization_id=org_a.id, name="Store A2", slug="store-a2")
            db.session.add_all([store_a1, store_a2])
            db.session.commit()

            # 2. Organization B (isolated tenant)
            org_b = MerchantOrganization(name="Org B", slug="org-b")
            db.session.add(org_b)
            db.session.commit()

            store_b1 = Store(organization_id=org_b.id, name="Store B1", slug="store-b1")
            db.session.add(store_b1)
            db.session.commit()

            # 3. Users
            user_owner = User(username="owner_user", email="owner@test.com", role="seller")
            user_owner.set_password("Pass123!")

            user_admin = User(username="admin_user", email="admin@test.com", role="seller")
            user_admin.set_password("Pass123!")

            user_staff = User(username="staff_user", email="staff@test.com", role="seller")
            user_staff.set_password("Pass123!")

            user_outsider = User(username="outsider_user", email="outsider@test.com", role="seller")
            user_outsider.set_password("Pass123!")

            platform_admin = User(username="superadmin", email="superadmin@fitvision.com", role="admin")
            platform_admin.set_password("AdminPass123!")

            db.session.add_all([
                user_owner, user_admin, user_staff,
                user_outsider, platform_admin
            ])
            db.session.commit()

            # 4. Memberships
            m_owner = StoreMembership(organization_id=org_a.id, store_id=None, user_id=user_owner.id, role="owner")
            m_admin = StoreMembership(organization_id=org_a.id, store_id=store_a1.id, user_id=user_admin.id, role="admin")
            m_staff = StoreMembership(organization_id=org_a.id, store_id=store_a1.id, user_id=user_staff.id, role="staff")
            m_outsider = StoreMembership(organization_id=org_b.id, store_id=store_b1.id, user_id=user_outsider.id, role="owner")

            db.session.add_all([m_owner, m_admin, m_staff, m_outsider])
            db.session.commit()

            self.store_a1_id = store_a1.id
            self.store_a2_id = store_a2.id
            self.store_b1_id = store_b1.id
            self.user_owner_id = user_owner.id
            self.user_admin_id = user_admin.id
            self.user_staff_id = user_staff.id
            self.user_outsider_id = user_outsider.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password="Pass123!"):
        return self.client.post('/api/login', json={'username': username, 'password': password})

    def test_unauthenticated_access_returns_401(self):
        """Unauthenticated request must return HTTP 401"""
        res = self.client.get(f'/test/stores/{self.store_a1_id}/staff-only')
        self.assertEqual(res.status_code, 401)
        self.assertIn('Authentication required', res.get_json()['error'])

    def test_nonexistent_store_returns_404(self):
        """Requesting an invalid store ID returns 404"""
        self._login("owner_user")
        res = self.client.get('/test/stores/99999/staff-only')
        self.assertEqual(res.status_code, 404)

    def test_non_member_access_returns_404(self):
        """User with no membership in Store A1 receives 404 (prevents tenant enumeration)"""
        self._login("outsider_user")
        res = self.client.get(f'/test/stores/{self.store_a1_id}/staff-only')
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json()['error'], 'Store not found')

    def test_staff_role_privileges(self):
        """Staff can access staff-only endpoint, but blocked from admin/owner with 403"""
        self._login("staff_user")

        # 1. Staff endpoint -> 200 OK
        res = self.client.get(f'/test/stores/{self.store_a1_id}/staff-only')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['role'], 'staff')

        # 2. Admin endpoint -> 403 Forbidden
        res_admin = self.client.get(f'/test/stores/{self.store_a1_id}/admin-only')
        self.assertEqual(res_admin.status_code, 403)
        self.assertIn('Requires admin privileges', res_admin.get_json()['error'])

        # 3. Owner endpoint -> 403 Forbidden
        res_owner = self.client.get(f'/test/stores/{self.store_a1_id}/owner-only')
        self.assertEqual(res_owner.status_code, 403)
        self.assertIn('Requires owner privileges', res_owner.get_json()['error'])

    def test_admin_role_privileges(self):
        """Admin can access staff and admin endpoints, but blocked from owner with 403"""
        self._login("admin_user")

        # 1. Staff endpoint -> 200 OK
        res_staff = self.client.get(f'/test/stores/{self.store_a1_id}/staff-only')
        self.assertEqual(res_staff.status_code, 200)

        # 2. Admin endpoint -> 200 OK
        res_admin = self.client.get(f'/test/stores/{self.store_a1_id}/admin-only')
        self.assertEqual(res_admin.status_code, 200)
        self.assertEqual(res_admin.get_json()['role'], 'admin')

        # 3. Owner endpoint -> 403 Forbidden
        res_owner = self.client.get(f'/test/stores/{self.store_a1_id}/owner-only')
        self.assertEqual(res_owner.status_code, 403)
        self.assertIn('Requires owner privileges', res_owner.get_json()['error'])

    def test_owner_role_privileges(self):
        """Owner has full access to all endpoints across all stores in their organization"""
        self._login("owner_user")

        # Access Store A1
        res1 = self.client.get(f'/test/stores/{self.store_a1_id}/owner-only')
        self.assertEqual(res1.status_code, 200)

        # Access Store A2 (inherited via org-wide membership)
        res2 = self.client.get(f'/test/stores/{self.store_a2_id}/owner-only')
        self.assertEqual(res2.status_code, 200)

        # Cannot access Store B1 (belonging to Org B) -> 404
        res3 = self.client.get(f'/test/stores/{self.store_b1_id}/owner-only')
        self.assertEqual(res3.status_code, 404)

    def test_platform_admin_override(self):
        """Platform administrator has system-wide access to any store"""
        self._login("superadmin", "AdminPass123!")

        res_a = self.client.get(f'/test/stores/{self.store_a1_id}/owner-only')
        self.assertEqual(res_a.status_code, 200)

        res_b = self.client.get(f'/test/stores/{self.store_b1_id}/owner-only')
        self.assertEqual(res_b.status_code, 200)

    def test_get_user_stores_helper(self):
        """Helper function returns all accessible stores for a user"""
        with self.app.app_context():
            owner_stores = get_user_stores(self.user_owner_id)
            self.assertEqual(len(owner_stores), 2)
            store_ids = {s['store'].id for s in owner_stores}
            self.assertIn(self.store_a1_id, store_ids)
            self.assertIn(self.store_a2_id, store_ids)

            admin_stores = get_user_stores(self.user_admin_id)
            self.assertEqual(len(admin_stores), 1)
            self.assertEqual(admin_stores[0]['store'].id, self.store_a1_id)
            self.assertEqual(admin_stores[0]['role'], 'admin')


if __name__ == '__main__':
    unittest.main()

