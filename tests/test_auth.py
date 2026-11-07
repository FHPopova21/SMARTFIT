import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User

class TestAuthAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_user_registration_success(self):
        """Тест за успешна регистрация на обикновен клиент"""
        res = self.client.post('/api/register', json={
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'Password123!',
            'role': 'user'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('User registered successfully', data.get('message', ''))

    def test_seller_registration_success(self):
        """Тест за успешна регистрация на продавач"""
        res = self.client.post('/api/register', json={
            'username': 'boutique_shop',
            'email': 'shop@example.com',
            'password': 'Password123!',
            'role': 'seller'
        })
        self.assertEqual(res.status_code, 201)

    def test_prevent_admin_registration(self):
        """Сигурност: Тест дали се блокира опит за регистрация като администратор"""
        res = self.client.post('/api/register', json={
            'username': 'fake_admin',
            'email': 'hacker@example.com',
            'password': 'Password123!',
            'role': 'admin'
        })
        # Очакваме отказ с грешка 400
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn('Невалидна роля', data.get('error', ''))

    def test_login_invalid_password(self):
        """Тест за отказ при грешна парола"""
        self.client.post('/api/register', json={
            'username': 'validuser',
            'email': 'user@example.com',
            'password': 'CorrectPassword123!',
            'role': 'user'
        })
        res = self.client.post('/api/login', json={
            'username': 'validuser',
            'password': 'WrongPassword!'
        })
        self.assertEqual(res.status_code, 401)

if __name__ == '__main__':
    unittest.main()
