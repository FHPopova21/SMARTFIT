"""
Test suite for Milestone 4B.1: Widget Configuration Foundation.

Covers:
1. Default configuration retrieval (without DB mutation)
2. First-time configuration creation
3. Configuration update
4. One config per store (unique constraint)
5. Cross-store isolation
6. Staff read-only access
7. Admin/owner write access
8. Unauthenticated access rejection
9. CSRF validation
10. Invalid color values
11. Invalid border radius
12. Invalid measurement units
13. Invalid language values
14. Unexpected JSON properties
15. Configuration persistence
16. No public API activation (STOREFRONT_API_ENABLED remains False)
17. Migration dry-run (upgrade and downgrade on isolated database)
18. Legacy compatibility (preservation of existing tables & Etsy shop)
"""

import unittest
import os
import sys
import tempfile
import sqlite3
import shutil

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import (
    User, MerchantOrganization, Store, StoreMembership, WidgetConfiguration
)
from app.migrations import phase5b_m4b1_migration


class TestWidgetConfiguration(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'STOREFRONT_API_ENABLED': False,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SECRET_KEY': 'widget-config-test-secret-key',
            'WTF_CSRF_ENABLED': True,
        })
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()

            # Create test organization
            self.org = MerchantOrganization(name="Widget Test Org", slug="widget-test-org")
            db.session.add(self.org)
            db.session.commit()

            # Store A Owner
            self.owner = User(username='widget_owner', email='owner@widget.com', role='seller')
            self.owner.set_password('Pass123!')
            db.session.add(self.owner)

            # Store A Admin
            self.admin = User(username='widget_admin', email='admin@widget.com', role='seller')
            self.admin.set_password('Pass123!')
            db.session.add(self.admin)

            # Store A Staff
            self.staff = User(username='widget_staff', email='staff@widget.com', role='seller')
            self.staff.set_password('Pass123!')
            db.session.add(self.staff)

            # Store B Owner (Rival)
            self.rival = User(username='widget_rival', email='rival@widget.com', role='seller')
            self.rival.set_password('Pass123!')
            db.session.add(self.rival)
            db.session.commit()

            # Stores
            self.store_a = Store(
                organization_id=self.org.id,
                name="Widget Store Alpha",
                slug="widget-store-alpha",
                currency="EUR",
                platform_type="custom",
                connection_status="connected"
            )
            self.store_b = Store(
                organization_id=self.org.id,
                name="Widget Store Beta",
                slug="widget-store-beta",
                currency="USD",
                platform_type="shopify",
                connection_status="connected"
            )
            db.session.add_all([self.store_a, self.store_b])
            db.session.commit()

            # Memberships
            db.session.add(StoreMembership(organization_id=self.org.id, store_id=self.store_a.id, user_id=self.owner.id, role='owner'))
            db.session.add(StoreMembership(organization_id=self.org.id, store_id=self.store_a.id, user_id=self.admin.id, role='admin'))
            db.session.add(StoreMembership(organization_id=self.org.id, store_id=self.store_a.id, user_id=self.staff.id, role='staff'))
            db.session.add(StoreMembership(organization_id=self.org.id, store_id=self.store_b.id, user_id=self.rival.id, role='owner'))
            db.session.commit()

            self.store_a_id = self.store_a.id
            self.store_b_id = self.store_b.id

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def _login(self, username, password='Pass123!'):
        res = self.client.post('/api/login', json={'username': username, 'password': password})
        self.assertEqual(res.status_code, 200, f"Login failed for {username}")
        data = res.get_json() or {}
        return {'X-CSRFToken': data.get('csrf_token', '')}

    # -------------------------------------------------------------
    # 1. Default configuration retrieval (without DB mutation)
    # -------------------------------------------------------------
    def test_01_default_configuration_retrieval(self):
        headers = self._login('widget_staff')
        resp = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config', headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['widget_config']

        self.assertIsNone(data['id'])
        self.assertEqual(data['store_id'], self.store_a_id)
        self.assertFalse(data['is_enabled'])
        self.assertEqual(data['button_label'], 'Compare My Fit')
        self.assertEqual(data['primary_color'], '#4F46E5')
        self.assertEqual(data['text_color'], '#FFFFFF')
        self.assertEqual(data['border_radius'], 'rounded')
        self.assertTrue(data['show_ruler_icon'])
        self.assertEqual(data['default_unit'], 'cm')
        self.assertEqual(data['default_language'], 'en')

        # Verify no record was inserted into database
        with self.app.app_context():
            self.assertIsNone(WidgetConfiguration.query.filter_by(store_id=self.store_a_id).first())

    # -------------------------------------------------------------
    # 2. First-time configuration creation
    # -------------------------------------------------------------
    def test_02_first_time_configuration_creation(self):
        headers = self._login('widget_admin')
        payload = {
            'is_enabled': True,
            'button_label': 'Find My Size',
            'primary_color': '#10B981',
            'text_color': '#000000',
            'border_radius': 'pill',
            'show_ruler_icon': False,
            'default_unit': 'inch',
            'default_language': 'bg',
        }
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json=payload,
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['widget_config']
        self.assertIsNotNone(data['id'])
        self.assertTrue(data['is_enabled'])
        self.assertEqual(data['button_label'], 'Find My Size')
        self.assertEqual(data['primary_color'], '#10B981')
        self.assertEqual(data['text_color'], '#000000')
        self.assertEqual(data['border_radius'], 'pill')
        self.assertFalse(data['show_ruler_icon'])
        self.assertEqual(data['default_unit'], 'inch')
        self.assertEqual(data['default_language'], 'bg')

        # Verify record exists in DB
        with self.app.app_context():
            config = WidgetConfiguration.query.filter_by(store_id=self.store_a_id).first()
            self.assertIsNotNone(config)
            self.assertEqual(config.button_label, 'Find My Size')

    # -------------------------------------------------------------
    # 3. Configuration update
    # -------------------------------------------------------------
    def test_03_configuration_update(self):
        headers = self._login('widget_owner')
        # Create
        self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Initial Label'},
            headers=headers
        )
        # Update
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Updated Label', 'primary_color': '#3B82F6'},
            headers=headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['widget_config']
        self.assertEqual(data['button_label'], 'Updated Label')
        self.assertEqual(data['primary_color'], '#3B82F6')

        with self.app.app_context():
            configs = WidgetConfiguration.query.filter_by(store_id=self.store_a_id).all()
            self.assertEqual(len(configs), 1)

    # -------------------------------------------------------------
    # 4. One config per store constraint
    # -------------------------------------------------------------
    def test_04_one_config_per_store_constraint(self):
        with self.app.app_context():
            c1 = WidgetConfiguration(store_id=self.store_a_id, button_label="First")
            db.session.add(c1)
            db.session.commit()

            c2 = WidgetConfiguration(store_id=self.store_a_id, button_label="Duplicate")
            db.session.add(c2)
            with self.assertRaises(Exception):
                db.session.commit()
            db.session.rollback()

    # -------------------------------------------------------------
    # 5. Cross-store isolation
    # -------------------------------------------------------------
    def test_05_cross_store_isolation(self):
        rival_headers = self._login('widget_rival')
        # Rival cannot GET Store A config
        resp_get = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config', headers=rival_headers)
        self.assertEqual(resp_get.status_code, 404)

        # Rival cannot PUT Store A config
        resp_put = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Hacked'},
            headers=rival_headers
        )
        self.assertEqual(resp_put.status_code, 404)

    # -------------------------------------------------------------
    # 6. Staff read-only access
    # -------------------------------------------------------------
    def test_06_staff_read_only_access(self):
        staff_headers = self._login('widget_staff')
        # Staff can GET
        resp_get = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config', headers=staff_headers)
        self.assertEqual(resp_get.status_code, 200)

        # Staff CANNOT PUT (403 Forbidden)
        resp_put = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Staff Tamper'},
            headers=staff_headers
        )
        self.assertEqual(resp_put.status_code, 403)

    # -------------------------------------------------------------
    # 7. Admin and owner write access
    # -------------------------------------------------------------
    def test_07_admin_and_owner_write_access(self):
        # Admin write
        admin_headers = self._login('widget_admin')
        resp_admin = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Admin Saved'},
            headers=admin_headers
        )
        self.assertEqual(resp_admin.status_code, 200)

        # Owner write
        owner_headers = self._login('widget_owner')
        resp_owner = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Owner Saved'},
            headers=owner_headers
        )
        self.assertEqual(resp_owner.status_code, 200)

    # -------------------------------------------------------------
    # 8. Unauthenticated access rejection
    # -------------------------------------------------------------
    def test_08_unauthenticated_access_rejection(self):
        resp_get = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config')
        self.assertEqual(resp_get.status_code, 401)

        resp_put = self.client.put(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config', json={'is_enabled': True})
        self.assertEqual(resp_put.status_code, 401)

    # -------------------------------------------------------------
    # 9. CSRF validation on PUT
    # -------------------------------------------------------------
    def test_09_csrf_validation(self):
        self._login('widget_admin')
        # Missing CSRF header
        resp_no_csrf = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'No CSRF'}
        )
        self.assertEqual(resp_no_csrf.status_code, 403)
        self.assertIn('CSRF', resp_no_csrf.get_json().get('error', ''))

        # Invalid CSRF header
        resp_bad_csrf = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'button_label': 'Bad CSRF'},
            headers={'X-CSRFToken': 'invalid_token_12345'}
        )
        self.assertEqual(resp_bad_csrf.status_code, 403)

    # -------------------------------------------------------------
    # 10. Invalid color values rejection
    # -------------------------------------------------------------
    def test_10_invalid_color_values(self):
        headers = self._login('widget_admin')
        for bad_color in ['red', 'rgb(0,0,0)', '#1234567', '#12', 'blue', '']:
            resp = self.client.put(
                f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
                json={'primary_color': bad_color},
                headers=headers
            )
            self.assertEqual(resp.status_code, 400, f"Did not reject invalid color: {bad_color}")
            self.assertIn('hex color code', resp.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 11. Invalid border radius rejection
    # -------------------------------------------------------------
    def test_11_invalid_border_radius(self):
        headers = self._login('widget_admin')
        for bad_radius in ['circle', 'extra-rounded', 'none', '12px']:
            resp = self.client.put(
                f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
                json={'border_radius': bad_radius},
                headers=headers
            )
            self.assertEqual(resp.status_code, 400, f"Did not reject invalid border radius: {bad_radius}")
            self.assertIn('border_radius', resp.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 12. Invalid measurement units rejection
    # -------------------------------------------------------------
    def test_12_invalid_measurement_units(self):
        headers = self._login('widget_admin')
        for bad_unit in ['mm', 'meters', 'feet', 'cm_and_inch']:
            resp = self.client.put(
                f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
                json={'default_unit': bad_unit},
                headers=headers
            )
            self.assertEqual(resp.status_code, 400, f"Did not reject invalid default_unit: {bad_unit}")
            self.assertIn('default_unit', resp.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 13. Invalid language values rejection
    # -------------------------------------------------------------
    def test_13_invalid_language_values(self):
        headers = self._login('widget_admin')
        for bad_lang in ['fr', 'de', 'es', 'english']:
            resp = self.client.put(
                f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
                json={'default_language': bad_lang},
                headers=headers
            )
            self.assertEqual(resp.status_code, 400, f"Did not reject invalid default_language: {bad_lang}")
            self.assertIn('default_language', resp.get_json().get('error', ''))

    # -------------------------------------------------------------
    # 14. Unexpected JSON properties rejection
    # -------------------------------------------------------------
    def test_14_unexpected_json_properties(self):
        headers = self._login('widget_admin')
        # Attempting client-controlled store_id or arbitrary injection
        resp = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'store_id': 999, 'button_label': 'Exploit'},
            headers=headers
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Unexpected field(s)', resp.get_json().get('error', ''))

        resp2 = self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'malicious_script': '<script>alert(1)</script>'},
            headers=headers
        )
        self.assertEqual(resp2.status_code, 400)

    # -------------------------------------------------------------
    # 15. Configuration persistence across requests
    # -------------------------------------------------------------
    def test_15_configuration_persistence(self):
        headers = self._login('widget_admin')
        self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={
                'is_enabled': True,
                'button_label': 'Persistent Sizing Guide',
                'primary_color': '#6366F1',
                'border_radius': 'square'
            },
            headers=headers
        )

        resp_get = self.client.get(f'/api/v1/merchant/stores/{self.store_a_id}/widget-config', headers=headers)
        self.assertEqual(resp_get.status_code, 200)
        data = resp_get.get_json()['widget_config']
        self.assertTrue(data['is_enabled'])
        self.assertEqual(data['button_label'], 'Persistent Sizing Guide')
        self.assertEqual(data['primary_color'], '#6366F1')
        self.assertEqual(data['border_radius'], 'square')

    # -------------------------------------------------------------
    # 16. No public API activation (STOREFRONT_API_ENABLED=False)
    # -------------------------------------------------------------
    def test_16_no_public_api_activation(self):
        headers = self._login('widget_admin')
        # Enable widget in store config
        self.client.put(
            f'/api/v1/merchant/stores/{self.store_a_id}/widget-config',
            json={'is_enabled': True},
            headers=headers
        )

        # Public storefront API must STILL return 403 STOREFRONT_DISABLED
        resp_public = self.client.post(
            f'/api/v1/storefront/{self.store_a.slug}/products/1/fit-comparison',
            json={'units': 'cm', 'measurements': {'chest': 95.0}}
        )
        self.assertEqual(resp_public.status_code, 403)
        self.assertEqual(resp_public.get_json().get('code'), 'STOREFRONT_DISABLED')

    # -------------------------------------------------------------
    # 17. Migration dry-run (upgrade and downgrade on isolated database)
    # -------------------------------------------------------------
    def test_17_migration_dry_run(self):
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_db:
            tmp_db_path = tmp_db.name

        try:
            # Create store table in isolated test DB
            conn = sqlite3.connect(tmp_db_path)
            conn.execute("PRAGMA foreign_keys = ON;")
            conn.execute("""
                CREATE TABLE store (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(150) NOT NULL
                );
            """)
            conn.execute("INSERT INTO store (name) VALUES ('Test Store');")
            conn.commit()
            conn.close()

            # Execute upgrade
            upgrade_ok = phase5b_m4b1_migration.upgrade(tmp_db_path)
            self.assertTrue(upgrade_ok)

            # Verify table and constraints exist
            conn = sqlite3.connect(tmp_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='widget_configuration';")
            self.assertIsNotNone(cursor.fetchone())

            # Insert valid config
            cursor.execute("""
                INSERT INTO widget_configuration (store_id, button_label, primary_color, border_radius)
                VALUES (1, 'Fit Check', '#4F46E5', 'rounded');
            """)
            conn.commit()

            # Verify unique constraint on store_id
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO widget_configuration (store_id, button_label)
                    VALUES (1, 'Duplicate');
                """)
                conn.commit()

            # Verify check constraint on border_radius
            with self.assertRaises(sqlite3.IntegrityError):
                cursor.execute("""
                    INSERT INTO widget_configuration (store_id, border_radius)
                    VALUES (2, 'invalid_radius');
                """)
                conn.commit()
            conn.close()

            # Execute downgrade (rollback)
            downgrade_ok = phase5b_m4b1_migration.downgrade(tmp_db_path)
            self.assertTrue(downgrade_ok)

            conn = sqlite3.connect(tmp_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='widget_configuration';")
            self.assertIsNone(cursor.fetchone(), "Table must be dropped on downgrade")
            conn.close()

        finally:
            if os.path.exists(tmp_db_path):
                os.remove(tmp_db_path)

    # -------------------------------------------------------------
    # 18. Legacy compatibility: Dry-run against transactionally consistent clone of SmartFit.db
    # -------------------------------------------------------------
    def test_18_legacy_compatibility_dry_run(self):
        live_db = os.path.join(os.path.dirname(__file__), '..', 'instance', 'SmartFit.db')
        self.assertTrue(os.path.exists(live_db), f"Live DB not found at {live_db}")

        with tempfile.NamedTemporaryFile(suffix='_clone.db', delete=False) as tmp_clone:
            clone_path = tmp_clone.name

        try:
            # Create consistent clone
            shutil.copy2(live_db, clone_path)

            # Record baseline
            conn = sqlite3.connect(clone_path)
            cursor = conn.cursor()
            cursor.execute("SELECT count(*) FROM user;")
            user_count = cursor.fetchone()[0]
            cursor.execute("SELECT count(*) FROM store;")
            store_count = cursor.fetchone()[0]
            cursor.execute("SELECT name, slug FROM store WHERE id=1;")
            etsy_shop = cursor.fetchone()
            self.assertEqual(etsy_shop[0], 'Etsy shop')
            self.assertEqual(etsy_shop[1], 'etsy-shop')
            conn.close()

            # Apply migration on clone
            phase5b_m4b1_migration.upgrade(clone_path)

            # Verify baseline data completely preserved
            conn = sqlite3.connect(clone_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA integrity_check;")
            self.assertEqual(cursor.fetchone()[0], 'ok')
            cursor.execute("PRAGMA foreign_key_check;")
            self.assertEqual(len(cursor.fetchall()), 0)

            cursor.execute("SELECT count(*) FROM user;")
            self.assertEqual(cursor.fetchone()[0], user_count)
            cursor.execute("SELECT count(*) FROM store;")
            self.assertEqual(cursor.fetchone()[0], store_count)
            cursor.execute("SELECT name, slug FROM store WHERE id=1;")
            self.assertEqual(cursor.fetchone(), etsy_shop)

            # Verify widget_configuration table exists and can accept config for store 1
            cursor.execute("""
                INSERT INTO widget_configuration (store_id, button_label, primary_color)
                VALUES (1, 'Etsy Sizing Guide', '#F97316');
            """)
            conn.commit()

            cursor.execute("SELECT button_label FROM widget_configuration WHERE store_id=1;")
            self.assertEqual(cursor.fetchone()[0], 'Etsy Sizing Guide')
            conn.close()

            # Test repeatable upgrade (idempotency)
            repeat_ok = phase5b_m4b1_migration.upgrade(clone_path)
            self.assertTrue(repeat_ok)

        finally:
            if os.path.exists(clone_path):
                os.remove(clone_path)


if __name__ == '__main__':
    unittest.main()

