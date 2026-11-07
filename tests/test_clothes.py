import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, Clothing

class TestClothesAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key'
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            seller = User(username='seller1', email='seller1@test.bg', role='seller')
            seller.set_password('SellerPass123!')
            db.session.add(seller)
            db.session.commit()

            item = Clothing(
                name='Лятна рокля',
                type='dress',
                material='elastic',
                size='S',
                width=45.0,
                length=90.0,
                price=65.0,
                seller_id=seller.id
            )
            db.session.add(item)
            db.session.commit()
            self.seller_id = seller.id
            self.item_id = item.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_get_all_clothes(self):
        """Тест за извличане на публичния каталог с дрехи"""
        res = self.client.get('/api/clothes')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]['name'], 'Лятна рокля')

    def test_filter_clothes_by_type(self):
        """Тест за филтриране по тип дреха"""
        res = self.client.get('/api/clothes?type=dress')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(all(item['type'] == 'dress' for item in data))

    def test_unauthenticated_cannot_create_clothing(self):
        """Тест че неавтентифициран потребител не може да създава дрехи"""
        res = self.client.post('/api/seller/clothes', json={
            'name': 'Яке',
            'type': 'jacket',
            'material': 'non-elastic',
            'size': 'L',
            'width': 58.0,
            'length': 75.0
        })
        self.assertIn(res.status_code, [401, 302, 403])

    def test_authenticated_seller_create_and_delete_clothing(self):
        """Тест че автентифициран продавач може успешно да добавя и изтрива обяви"""
        # 1. Вход като продавач
        login_res = self.client.post('/api/login', json={
            'username': 'seller1',
            'password': 'SellerPass123!'
        })
        self.assertEqual(login_res.status_code, 200)

        # 2. Създаване на нова дреха
        create_res = self.client.post('/api/seller/clothes', json={
            'name': 'Спортно яке',
            'type': 'jacket',
            'material': 'non-elastic',
            'size': 'M',
            'width': 56.0,
            'length': 72.0,
            'price': 110.0
        })
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.get_json()
        created_id = created_data['clothing']['id']

        # 3. Проверка че дрехата присъства в каталога
        get_res = self.client.get(f'/api/clothes/{created_id}')
        self.assertEqual(get_res.status_code, 200)

        # 4. Изтриване на дрехата от продавача
        del_res = self.client.delete(f'/api/seller/clothes/{created_id}')
        self.assertEqual(del_res.status_code, 200)

        # 5. Проверка че вече не съществува
        check_del_res = self.client.get(f'/api/clothes/{created_id}')
        self.assertEqual(check_del_res.status_code, 404)

if __name__ == '__main__':
    unittest.main()
