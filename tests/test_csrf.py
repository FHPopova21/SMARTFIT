import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, Store


class TestCSRFProtection(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-csrf'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            seller = User(username='csrf_seller', email='seller@csrf.com', role='seller')
            seller.set_password('Pass123!')
            db.session.add(seller)
            db.session.commit()
            self.seller_id = seller.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self):
        res = self.client.post('/api/login', json={
            'username': 'csrf_seller',
            'password': 'Pass123!'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('csrf_token', data)
        self.assertIsNotNone(data['csrf_token'])
        return data['csrf_token']

    def test_token_retrieval_endpoint(self):
        """GET /api/v1/auth/csrf-token returns a cryptographically strong token"""
        res = self.client.get('/api/v1/auth/csrf-token')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('csrf_token', data)
        self.assertEqual(len(data['csrf_token']), 64)  # 32 bytes hex = 64 hex chars

    def test_valid_authenticated_request_with_csrf_token(self):
        """State-changing POST with valid session-bound X-CSRFToken succeeds (201)"""
        token = self._login()

        res = self.client.post(
            '/api/v1/merchant/stores',
            headers={'X-CSRFToken': token},
            json={'name': 'Secure Merchant Store', 'currency': 'EUR'}
        )
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['store']['name'], 'Secure Merchant Store')

    def test_missing_csrf_token_rejected(self):
        """State-changing POST without X-CSRFToken is rejected with 403 CSRF_TOKEN_MISSING"""
        self._login()

        # Omit X-CSRFToken header
        res = self.client.post(
            '/api/v1/merchant/stores',
            json={'name': 'Unprotected Store'}
        )
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('code'), 'CSRF_TOKEN_MISSING')
        self.assertIn('missing anti-CSRF token', data.get('error', ''))

    def test_invalid_csrf_token_rejected(self):
        """State-changing POST with a forged / tampered token is rejected with 403 CSRF_TOKEN_INVALID"""
        self._login()

        res = self.client.post(
            '/api/v1/merchant/stores',
            headers={'X-CSRFToken': 'forged_or_tampered_token_value_12345'},
            json={'name': 'Tampered Store'}
        )
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('code'), 'CSRF_TOKEN_INVALID')
        self.assertIn('invalid anti-CSRF token', data.get('error', ''))

    def test_session_expired_csrf_token_rejected(self):
        """If user logs out, their prior session token is invalidated and write is rejected"""
        token = self._login()

        # Logout user (clears session and CSRF token)
        logout_res = self.client.get('/api/logout')
        self.assertEqual(logout_res.status_code, 200)

        # Attempt write using previous token
        res = self.client.post(
            '/api/v1/merchant/stores',
            headers={'X-CSRFToken': token},
            json={'name': 'Expired Session Store'}
        )
        # LoginManager blocks with 401 unauthenticated
        self.assertEqual(res.status_code, 401)

    def test_cross_origin_request_blocked(self):
        """Untrusted Origin header is rejected with 403 CSRF_UNTRUSTED_ORIGIN (Defense-in-Depth)"""
        token = self._login()

        res = self.client.post(
            '/api/v1/merchant/stores',
            headers={
                'X-CSRFToken': token,
                'Origin': 'https://evil-hacker-site.com'
            },
            json={'name': 'Evil Store'}
        )
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('code'), 'CSRF_UNTRUSTED_ORIGIN')

    def test_x_requested_with_alone_never_bypasses_csrf(self):
        """Header X-Requested-With alone MUST NOT bypass CSRF protection"""
        self._login()

        res = self.client.post(
            '/api/v1/merchant/stores',
            headers={'X-Requested-With': 'XMLHttpRequest'},  # No X-CSRFToken
            json={'name': 'Bypass Attempt Store'}
        )
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertEqual(data.get('code'), 'CSRF_TOKEN_MISSING')

    def test_token_rotation_on_login(self):
        """Each new login session generates a distinct, fresh CSRF token (Session Fixation Defense)"""
        token1 = self._login()
        self.client.get('/api/logout')

        token2 = self._login()
        self.assertNotEqual(token1, token2)
        self.assertEqual(len(token2), 64)


if __name__ == '__main__':
    unittest.main()

