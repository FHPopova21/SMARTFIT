"""
Migration script for Phase 5B Milestone 1:
Merchant Organization & Store Data Foundation.

Provides additive, reversible DDL for:
- merchant_organization
- store
- store_membership
and associated unique/partial indexes.

DO NOT execute against development or production database without explicit approval.
"""

import sqlite3
import os
import sys

UPGRADE_SQL = """
-- 1. Create merchant_organization table
CREATE TABLE IF NOT EXISTS merchant_organization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_merchant_organization_slug ON merchant_organization(slug);

-- 2. Create store table with composite unique constraint (id, organization_id)
CREATE TABLE IF NOT EXISTS store (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BGN',
    platform_type VARCHAR(50) NOT NULL DEFAULT 'custom',
    connection_status VARCHAR(30) NOT NULL DEFAULT 'disconnected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_store_id_org_id UNIQUE (id, organization_id),
    CONSTRAINT fk_store_organization FOREIGN KEY (organization_id)
        REFERENCES merchant_organization (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_store_slug ON store(slug);
CREATE INDEX IF NOT EXISTS ix_store_organization_id ON store(organization_id);

-- 3. Create store_membership table with composite FK & role constraint
CREATE TABLE IF NOT EXISTS store_membership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    store_id INTEGER,
    user_id INTEGER NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_store_membership_role CHECK (role IN ('owner', 'admin', 'staff')),
    CONSTRAINT fk_store_membership_organization FOREIGN KEY (organization_id)
        REFERENCES merchant_organization (id) ON DELETE CASCADE,
    CONSTRAINT fk_store_membership_user FOREIGN KEY (user_id)
        REFERENCES user (id) ON DELETE CASCADE,
    CONSTRAINT fk_store_membership_store_org FOREIGN KEY (store_id, organization_id)
        REFERENCES store (id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_store_membership_organization_id ON store_membership(organization_id);
CREATE INDEX IF NOT EXISTS ix_store_membership_store_id ON store_membership(store_id);
CREATE INDEX IF NOT EXISTS ix_store_membership_user_id ON store_membership(user_id);

-- Partial unique indexes preventing duplicate memberships:
CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_user_store
    ON store_membership(user_id, store_id) WHERE store_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_user_org_wide
    ON store_membership(user_id, organization_id) WHERE store_id IS NULL;
"""

DOWNGRADE_SQL = """
DROP INDEX IF EXISTS uq_membership_user_org_wide;
DROP INDEX IF EXISTS uq_membership_user_store;
DROP INDEX IF EXISTS ix_store_membership_user_id;
DROP INDEX IF EXISTS ix_store_membership_store_id;
DROP INDEX IF EXISTS ix_store_membership_organization_id;
DROP TABLE IF EXISTS store_membership;

DROP INDEX IF EXISTS ix_store_organization_id;
DROP INDEX IF EXISTS ix_store_slug;
DROP TABLE IF EXISTS store;

DROP INDEX IF EXISTS ix_merchant_organization_slug;
DROP TABLE IF EXISTS merchant_organization;
"""


def upgrade(conn: sqlite3.Connection):
    """Executes additive migration statements."""
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(UPGRADE_SQL)
    conn.commit()


def downgrade(conn: sqlite3.Connection):
    """Executes reversible downgrade statements."""
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.executescript(DOWNGRADE_SQL)
    conn.commit()


def dry_run_simulation(source_db_path: str = None) -> bool:
    """
    Performs a safe dry-run migration in a temporary in-memory database
    cloned from source_db_path or schema-only.
    """
    temp_conn = sqlite3.connect(':memory:')
    temp_conn.execute("PRAGMA foreign_keys = ON;")

    if source_db_path and os.path.exists(source_db_path):
        source_conn = sqlite3.connect(source_db_path)
        source_conn.backup(temp_conn)
        source_conn.close()
    else:
        # Mock minimum user table
        temp_conn.execute("CREATE TABLE user (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE);")

    # 1. Apply Upgrade
    upgrade(temp_conn)

    # Verify tables exist
    cursor = temp_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('merchant_organization', 'store', 'store_membership');")
    tables = [row[0] for row in cursor.fetchall()]
    assert len(tables) == 3, f"Expected 3 new tables, got {tables}"

    # Verify PRAGMA foreign_key_check passes
    cursor.execute("PRAGMA foreign_key_check;")
    fk_errors = cursor.fetchall()
    assert len(fk_errors) == 0, f"Foreign key check errors found: {fk_errors}"

    # 2. Apply Downgrade (verify reversibility)
    downgrade(temp_conn)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('merchant_organization', 'store', 'store_membership');")
    tables_after = [row[0] for row in cursor.fetchall()]
    assert len(tables_after) == 0, f"Expected 0 tables after downgrade, got {tables_after}"

    temp_conn.close()
    return True


if __name__ == '__main__':
    print("Testing migration dry-run...")
    success = dry_run_simulation()
    if success:
        print("Dry run succeeded! Migration is valid and fully reversible.")

