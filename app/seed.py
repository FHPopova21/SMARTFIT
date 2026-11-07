import os
import sys

# Поддръжка както за импорт като пакет, така и за директно стартиране
if __name__ == '__main__':
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from app import create_app
    from app.models import db, User, Clothing, Comment
else:
    from app.models import db, User, Clothing, Comment

from werkzeug.security import generate_password_hash
from datetime import datetime


def seed_database():
    """
    Зарежда начални данни в базата: админ, продавачи, дрехи и коментари.
    """
    # 1. Администраторски акаунт
    admin = User.query.filter_by(username='FHPopova21').first()
    if not admin:
        admin = User(
            username='FHPopova21',
            email='fhpopova21@codingburgas.bg',
            role='admin'
        )
        admin.set_password('Vuk80492')
        db.session.add(admin)
        print("Created admin user: FHPopova21")

    # 2. Продавачи
    sellers_data = [
        {
            'username': 'fashion_store_bg',
            'email': 'fashion@store.bg',
            'password': 'password123',
            'role': 'seller'
        },
        {
            'username': 'sport_world',
            'email': 'info@sportworld.bg',
            'password': 'password123',
            'role': 'seller'
        },
        {
            'username': 'elegant_lady',
            'email': 'contact@elegantlady.bg',
            'password': 'password123',
            'role': 'seller'
        }
    ]

    for seller_data in sellers_data:
        seller = User.query.filter_by(username=seller_data['username']).first()
        if not seller:
            seller = User(
                username=seller_data['username'],
                email=seller_data['email'],
                role=seller_data['role']
            )
            seller.set_password(seller_data['password'])
            db.session.add(seller)
            print(f"Created seller: {seller_data['username']}")

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating users: {e}")

    # 3. Примерни дрехи
    clothes_data = [
        {
            'name': 'Класическа бизнес риза',
            'description': 'Елегантна мъжка риза от 100% памук, подходяща за офис и официални събития.',
            'category': 'Мъже',
            'clothing_type': 'shirt',
            'price': 69.99,
            'image_url': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60',
            'available_sizes': 'S,M,L,XL',
            'seller_username': 'fashion_store_bg',
            'chest_width': 54.0,
            'waist_width': 50.0,
            'length': 74.0,
            'fabric_composition': '100% Cotton',
            'elasticity': 'non-elastic'
        },
        {
            'name': 'Спортна тениска Dry-Fit',
            'description': 'Дишаща спортна тениска за бягане и фитнес с бързосъхнеща материя.',
            'category': 'Спорт',
            'clothing_type': 't-shirt',
            'price': 34.50,
            'image_url': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60',
            'available_sizes': 'XS,S,M,L',
            'seller_username': 'sport_world',
            'chest_width': 50.0,
            'waist_width': 48.0,
            'length': 70.0,
            'fabric_composition': '90% Polyester, 10% Elastane',
            'elasticity': 'elastic'
        },
        {
            'name': 'Дамска вечерна рокля',
            'description': 'Стилна черна рокля с полуеластична кройка за специални поводи.',
            'category': 'Жени',
            'clothing_type': 'dress',
            'price': 119.00,
            'image_url': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=60',
            'available_sizes': 'XS,S,M,L',
            'seller_username': 'elegant_lady',
            'chest_width': 46.0,
            'waist_width': 40.0,
            'length': 95.0,
            'fabric_composition': '95% Viscose, 5% Elastane',
            'elasticity': 'semi-elastic'
        },
        {
            'name': 'Класически прав деним панталон',
            'description': 'Качествен деним с класическа права кройка и висока талия.',
            'category': 'Унисекс',
            'clothing_type': 'pants',
            'price': 89.90,
            'image_url': 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=60',
            'available_sizes': 'S,M,L,XL',
            'seller_username': 'fashion_store_bg',
            'chest_width': 44.0,
            'waist_width': 42.0,
            'length': 102.0,
            'fabric_composition': '98% Cotton, 2% Elastane',
            'elasticity': 'semi-elastic'
        }
    ]

    for item in clothes_data:
        existing = Clothing.query.filter_by(name=item['name']).first()
        if not existing:
            seller = User.query.filter_by(username=item['seller_username']).first()
            seller_id = seller.id if seller else None

            clothing = Clothing(
                name=item['name'],
                description=item['description'],
                type=item['clothing_type'],
                material=item['elasticity'],
                size='M',
                width=item['chest_width'],
                length=item['length'],
                price=item['price'],
                image_url=item['image_url'],
                seller_id=seller_id
            )
            db.session.add(clothing)
            print(f"Created clothing: {item['name']}")

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating clothes: {e}")

    # 4. Примерни коментари
    comments_data = [
        {
            'content': 'Отлично качество на материята и перфектно пасване на размера!',
            'rating': 5,
            'user_username': 'FHPopova21',
            'clothing_name': 'Класическа бизнес риза'
        },
        {
            'content': 'Много удобна тениска за тренировки, дишаща и лека.',
            'rating': 5,
            'user_username': 'FHPopova21',
            'clothing_name': 'Спортна тениска Dry-Fit'
        },
        {
            'content': 'Красива рокля, препоръчвам за официални поводи!',
            'rating': 5,
            'user_username': 'FHPopova21',
            'clothing_name': 'Дамска вечерна рокля'
        }
    ]

    for comment_data in comments_data:
        user = User.query.filter_by(username=comment_data['user_username']).first()
        clothing = Clothing.query.filter_by(name=comment_data['clothing_name']).first()

        if user and clothing:
            existing_comment = Comment.query.filter_by(
                user_id=user.id,
                clothing_id=clothing.id,
                content=comment_data['content']
            ).first()

            if not existing_comment:
                comment = Comment(
                    content=comment_data['content'],
                    rating=comment_data['rating'],
                    user_id=user.id,
                    clothing_id=clothing.id
                )
                db.session.add(comment)
                print(f"Created comment for {comment_data['clothing_name']}")

    try:
        db.session.commit()
        print("✅ Базата данни е успешно захранена с начални данни (Seeded)!")
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding database: {e}")
        raise


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_database()
