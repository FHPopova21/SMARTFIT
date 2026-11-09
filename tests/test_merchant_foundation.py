import unittest
import os
import sys
import sqlite3
from sqlalchemy import event
from sqlalchemy.engine import Engine

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User,
    Clothing,
    BodyMeasurements,
    RecommendationHistory,
    Comment,
    MerchantOrganization,
    Store,
    StoreMembership
)
from sqlalchemy.exc import IntegrityError


# Enable foreign key enforcement for SQLite in tests
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class TestMerchantFoundation(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'test-secret-key-foundation'
        })
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_organization_creation(self):
        """Test creating a MerchantOrganization with valid attributes and slug uniqueness"""
        org = MerchantOrganization(name="Acme Fashion Group", slug="acme-fashion")
        db.session.add(org)
        db.session.commit()

        self.assertIsNotNone(org.id)
        self.assertEqual(org.name, "Acme Fashion Group")
        self.assertEqual(org.slug, "acme-fashion")
        self.assertEqual(org.status, "active")
        self.assertIsNotNone(org.created_at)

        # Duplicate slug must fail
        dup_org = MerchantOrganization(name="Acme Duplicate", slug="acme-fashion")
        db.session.add(dup_org)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_multiple_stores_per_organization(self):
        """Test an organization owning multiple distinct storefronts"""
        org = MerchantOrganization(name="Nordic Apparel Group", slug="nordic-apparel")
        db.session.add(org)
        db.session.commit()

        store1 = Store(organization_id=org.id, name="Nordic Flagship Store", slug="nordic-flagship", currency="EUR")
        store2 = Store(organization_id=org.id, name="Nordic Outlet", slug="nordic-outlet", currency="SEK")
        db.session.add_all([store1, store2])
        db.session.commit()

        self.assertEqual(len(org.stores), 2)
        self.assertIn(store1, org.stores)
        self.assertIn(store2, org.stores)
        self.assertEqual(store1.organization.slug, "nordic-apparel")

        # Duplicate store slug must fail
        dup_store = Store(organization_id=org.id, name="Another Store", slug="nordic-flagship")
        db.session.add(dup_store)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_user_membership_organization_wide(self):
        """Test organization-wide membership (store_id IS NULL) and duplicate prevention"""
        user = User(username="org_owner", email="owner@acme.com", role="seller")
        user.set_password("OwnerPassword123!")
        org = MerchantOrganization(name="Acme Holdings", slug="acme-holdings")
        db.session.add_all([user, org])
        db.session.commit()

        # Org-wide membership
        membership = StoreMembership(organization_id=org.id, store_id=None, user_id=user.id, role="owner")
        db.session.add(membership)
        db.session.commit()

        self.assertIsNotNone(membership.id)
        self.assertIsNone(membership.store_id)
        self.assertEqual(membership.role, "owner")
        self.assertEqual(len(user.store_memberships), 1)

        # Duplicate org-wide membership for the same user must be blocked by partial unique index
        dup_membership = StoreMembership(organization_id=org.id, store_id=None, user_id=user.id, role="admin")
        db.session.add(dup_membership)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_user_membership_store_specific(self):
        """Test store-specific memberships and duplicate store membership prevention"""
        user = User(username="store_staff", email="staff@acme.com", role="seller")
        user.set_password("StaffPass123!")
        org = MerchantOrganization(name="Retail Brands", slug="retail-brands")
        db.session.add_all([user, org])
        db.session.commit()

        store_a = Store(organization_id=org.id, name="Store A", slug="store-a")
        store_b = Store(organization_id=org.id, name="Store B", slug="store-b")
        db.session.add_all([store_a, store_b])
        db.session.commit()

        # Add user to Store A as admin and Store B as staff
        m_a = StoreMembership(organization_id=org.id, store_id=store_a.id, user_id=user.id, role="admin")
        m_b = StoreMembership(organization_id=org.id, store_id=store_b.id, user_id=user.id, role="staff")
        db.session.add_all([m_a, m_b])
        db.session.commit()

        self.assertEqual(len(user.store_memberships), 2)

        # Duplicate membership for the same store must be blocked
        dup_m_a = StoreMembership(organization_id=org.id, store_id=store_a.id, user_id=user.id, role="staff")
        db.session.add(dup_m_a)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_role_validation(self):
        """Test valid roles ('owner', 'admin', 'staff') and rejection of invalid roles"""
        user = User(username="role_tester", email="role@test.com")
        org = MerchantOrganization(name="Role Org", slug="role-org")
        db.session.add_all([user, org])
        db.session.commit()

        # Valid roles
        for valid_role in ['owner', 'admin', 'staff']:
            m = StoreMembership(organization_id=org.id, user_id=user.id, role=valid_role)
            self.assertEqual(m.role, valid_role)

        # Invalid role must raise ValueError
        with self.assertRaises(ValueError):
            StoreMembership(organization_id=org.id, user_id=user.id, role="superadmin")

        with self.assertRaises(ValueError):
            StoreMembership(organization_id=org.id, user_id=user.id, role="guest")

    def test_cross_organization_store_membership_rejected(self):
        """Test composite FK enforces that store_id belongs to the same organization_id"""
        user = User(username="cross_tester", email="cross@test.com")
        org_1 = MerchantOrganization(name="Org One", slug="org-one")
        org_2 = MerchantOrganization(name="Org Two", slug="org-two")
        db.session.add_all([user, org_1, org_2])
        db.session.commit()

        store_of_org_2 = Store(organization_id=org_2.id, name="Org2 Store", slug="org2-store")
        db.session.add(store_of_org_2)
        db.session.commit()

        # Attempt to create membership under Org 1, but referencing Store of Org 2
        # Composite FK (store_id, organization_id) -> (store.id, store.organization_id) must reject this!
        invalid_m = StoreMembership(
            organization_id=org_1.id,
            store_id=store_of_org_2.id,
            user_id=user.id,
            role="staff"
        )
        db.session.add(invalid_m)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

    def test_cascade_delete_integrity(self):
        """Test cascading deletion when an organization or store is deleted"""
        user = User(username="cascade_user", email="cascade@test.com")
        org = MerchantOrganization(name="Cascade Org", slug="cascade-org")
        db.session.add_all([user, org])
        db.session.commit()

        store = Store(organization_id=org.id, name="Cascade Store", slug="cascade-store")
        db.session.add(store)
        db.session.commit()

        membership = StoreMembership(organization_id=org.id, store_id=store.id, user_id=user.id, role="owner")
        db.session.add(membership)
        db.session.commit()

        # Delete the organization -> store and membership must be deleted
        db.session.delete(org)
        db.session.commit()

        self.assertIsNone(db.session.get(Store, store.id))
        self.assertIsNone(db.session.get(StoreMembership, membership.id))
        # User must remain
        self.assertIsNotNone(db.session.get(User, user.id))

    def test_existing_model_compatibility(self):
        """Test all existing models (Clothing, BodyMeasurements, RecommendationHistory, Comment) remain functional"""
        seller = User(username="seller_compat", email="seller_compat@test.com", role="seller")
        seller.set_password("Pass123!")
        db.session.add(seller)
        db.session.commit()

        clothing = Clothing(
            name="Ленена риза",
            type="shirt",
            material="semi-elastic",
            size="M",
            width=54.0,
            length=76.0,
            price=85.0,
            seller_id=seller.id
        )
        db.session.add(clothing)
        db.session.commit()

        self.assertEqual(clothing.seller.username, "seller_compat")
        self.assertEqual(len(seller.clothes), 1)

        # Verify to_dict maintains full compatibility
        clothing_dict = clothing.to_dict()
        self.assertEqual(clothing_dict['name'], "Ленена риза")
        self.assertEqual(clothing_dict['measurements']['width'], 54.0)
        self.assertEqual(clothing_dict['seller_id'], seller.id)
        self.assertEqual(clothing_dict['merchantId'], str(seller.id))


if __name__ == '__main__':
    unittest.main()

