"""
Migration script for Phase 5B Milestone 4B.1:
Widget Configuration Data Model Foundation.

Additive DDL for:
- widget_configuration (scoped to store_id with unique constraint, foreign key with ON DELETE CASCADE,
  and check constraints on border_radius, default_unit, and default_language).

Strictly preserves legacy clothing, user, store, product, and size chart records.
Does NOT modify Store table or add website_url.
"""

import sqlite3
import os
import sys

UPGRADE_SQL = """
-- Create widget_configuration table with store-scoped unique constraint and check constraints
CREATE TABLE IF NOT EXISTS widget_configuration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT 0,
    button_label VARCHAR(50) NOT NULL DEFAULT 'Compare My Fit',
    primary_color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    text_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    border_radius VARCHAR(20) NOT NULL DEFAULT 'rounded',
    show_ruler_icon BOOLEAN NOT NULL DEFAULT 1,
    default_unit VARCHAR(10) NOT NULL DEFAULT 'cm',
    default_language VARCHAR(5) NOT NULL DEFAULT 'en',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_widget_border_radius CHECK (border_radius IN ('pill', 'rounded', 'square')),
    CONSTRAINT ck_widget_default_unit CHECK (default_unit IN ('cm', 'inch')),
    CONSTRAINT ck_widget_default_lang CHECK (default_language IN ('en', 'bg')),
    CONSTRAINT fk_widget_config_store FOREIGN KEY (store_id)
        REFERENCES store (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_widget_config_store_id ON widget_configuration(store_id);
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS widget_configuration;
"""

def upgrade(db_path: str):
    """
    Applies the Milestone 4B.1 schema upgrade to the specified SQLite database path.
    Enforces foreign key checks and integrity verification post-migration.
    """
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    try:
        cursor.executescript(UPGRADE_SQL)
        conn.commit()

        # Run integrity checks
        cursor.execute("PRAGMA integrity_check;")
        integrity = cursor.fetchone()[0]
        cursor.execute("PRAGMA foreign_key_check;")
        fk_violations = cursor.fetchall()

        if integrity != "ok" or fk_violations:
            raise RuntimeError(f"Post-migration check failed! Integrity: {integrity}, FK violations: {fk_violations}")

        return True
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()

def downgrade(db_path: str):
    """
    Reverts the Milestone 4B.1 schema changes on the specified SQLite database path.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.executescript(DOWNGRADE_SQL)
        conn.commit()
        return True
    finally:
        conn.close()

if __name__ == '__main__':
    default_db = os.path.join(os.path.dirname(__file__), '..', '..', 'instance', 'SmartFit.db')
    target = sys.argv[1] if len(sys.argv) > 1 else default_db
    print(f"Applying migration to: {target}")
    upgrade(target)
    print("Migration finished successfully.")

