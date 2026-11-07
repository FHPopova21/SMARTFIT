import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, Clothing, Comment, RecommendationHistory

class TestAdminAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            admin = User(username='admin_user', email='admin@test.bg', role='admin')
            admin.set_password('AdminPass123!')
            db.session.add(admin)

            user = User(username='regular_user', email='user@test.bg', role='user')
            user.set_password('UserPass123!')
            db.session.add(user)
            db.session.commit()

            self.admin_id = admin.id
            self.user_id = user.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_admin_dashboard_access_denied_for_regular_user(self):
        """Тест че обикновен потребител няма достъп до админ таблото"""
        self.client.post('/api/login', json={'username': 'regular_user', 'password': 'UserPass123!'})
        res = self.client.get('/api/admin/dashboard')
        self.assertEqual(res.status_code, 403)

    def test_admin_dashboard_access_granted_for_admin(self):
        """Тест че администраторът има пълен достъп до метриките и потребителите"""
        self.client.post('/api/login', json={'username': 'admin_user', 'password': 'AdminPass123!'})
        res = self.client.get('/api/admin/dashboard')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('counts', data)
        self.assertGreaterEqual(data['counts']['users'], 2)

    def test_admin_get_all_users_with_stats(self):
        """Тест за извличане на потребителите с обобщени статистики (както в test_admin_users.py)"""
        self.client.post('/api/login', json={'username': 'admin_user', 'password': 'AdminPass123!'})
        res = self.client.get('/api/admin/users')
        self.assertEqual(res.status_code, 200)
        users = res.get_json()
        self.assertIsInstance(users, list)
        self.assertTrue(any(u['username'] == 'admin_user' for u in users))

if __name__ == '__main__':
    unittest.main()

