"""
Migration script for Phase 5B Milestone 3A:
Multi-Tenant Product, Variant and Size Chart Foundation.

Additive DDL for:
- size_chart (scoped to store_id with composite unique (id, store_id))
- garment_measurement (scoped to size_chart_id with positive constraints)
- product (scoped to store_id, composite FK to size_chart(id, store_id) with ON DELETE RESTRICT)
- product_variant (scoped to product_id and store_id with composite FK and store-scoped SKU index)

Strictly preserves legacy clothing, user, and store records.
Does NOT modify Store table or add website_url.
"""

import sqlite3
import os
import sys

UPGRADE_SQL = """
-- 1. Create size_chart table with composite unique constraint (id, store_id)
CREATE TABLE IF NOT EXISTS size_chart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    garment_category VARCHAR(50) NOT NULL,
    chart_type VARCHAR(30) NOT NULL DEFAULT 'garment_dimensions',
    measurement_convention VARCHAR(30) NOT NULL DEFAULT 'flat_garment',
    unit VARCHAR(10) NOT NULL DEFAULT 'cm',
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_size_chart_id_store_id UNIQUE (id, store_id),
    CONSTRAINT ck_size_chart_type CHECK (chart_type IN ('garment_dimensions', 'body_measurements')),
    CONSTRAINT ck_size_chart_convention CHECK (measurement_convention IN ('flat_garment', 'garment_circumference', 'body_circumference')),
    CONSTRAINT ck_size_chart_unit CHECK (unit IN ('cm', 'inch')),
    CONSTRAINT fk_size_chart_store FOREIGN KEY (store_id)
        REFERENCES store (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_size_chart_store_id ON size_chart(store_id);

-- 2. Create garment_measurement table with positive dimension checks and explicit semantics
CREATE TABLE IF NOT EXISTS garment_measurement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    size_chart_id INTEGER NOT NULL,
    size VARCHAR(30) NOT NULL,
    -- Flat garment widths (measured seam-to-seam across flat garment)
    flat_chest_width FLOAT,
    flat_waist_width FLOAT,
    flat_hip_width FLOAT,
    -- Garment 360° circumferences (measured perimeter of garment)
    garment_chest_circumference FLOAT,
    garment_waist_circumference FLOAT,
    garment_hip_circumference FLOAT,
    -- Recommended body 360° circumferences (target human body size)
    body_chest_circumference FLOAT,
    body_waist_circumference FLOAT,
    body_hip_circumference FLOAT,
    -- Longitudinal / seam lengths
    total_length FLOAT,
    sleeve_length FLOAT,
    inseam_length FLOAT,
    shoulder_width FLOAT,
    CONSTRAINT uq_measurement_chart_size UNIQUE (size_chart_id, size),
    CONSTRAINT ck_flat_chest_pos CHECK (flat_chest_width IS NULL OR flat_chest_width > 0),
    CONSTRAINT ck_flat_waist_pos CHECK (flat_waist_width IS NULL OR flat_waist_width > 0),
    CONSTRAINT ck_flat_hip_pos CHECK (flat_hip_width IS NULL OR flat_hip_width > 0),
    CONSTRAINT ck_garment_chest_circ_pos CHECK (garment_chest_circumference IS NULL OR garment_chest_circumference > 0),
    CONSTRAINT ck_garment_waist_circ_pos CHECK (garment_waist_circumference IS NULL OR garment_waist_circumference > 0),
    CONSTRAINT ck_garment_hip_circ_pos CHECK (garment_hip_circumference IS NULL OR garment_hip_circumference > 0),
    CONSTRAINT ck_body_chest_circ_pos CHECK (body_chest_circumference IS NULL OR body_chest_circumference > 0),
    CONSTRAINT ck_body_waist_circ_pos CHECK (body_waist_circumference IS NULL OR body_waist_circumference > 0),
    CONSTRAINT ck_body_hip_circ_pos CHECK (body_hip_circumference IS NULL OR body_hip_circumference > 0),
    CONSTRAINT ck_total_length_pos CHECK (total_length IS NULL OR total_length > 0),
    CONSTRAINT ck_sleeve_length_pos CHECK (sleeve_length IS NULL OR sleeve_length > 0),
    CONSTRAINT ck_inseam_length_pos CHECK (inseam_length IS NULL OR inseam_length > 0),
    CONSTRAINT ck_shoulder_width_pos CHECK (shoulder_width IS NULL OR shoulder_width > 0),
    CONSTRAINT fk_measurement_chart FOREIGN KEY (size_chart_id)
        REFERENCES size_chart (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_garment_measurement_chart_id ON garment_measurement(size_chart_id);

-- 3. Create product table with same-store composite FK constraint to size_chart (ON DELETE RESTRICT)
CREATE TABLE IF NOT EXISTS product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    size_chart_id INTEGER,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    material_stretch VARCHAR(30) DEFAULT 'unknown',
    brand VARCHAR(100),
    sku_prefix VARCHAR(50),
    description TEXT,
    image_url VARCHAR(500),
    external_reference VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_id_store_id UNIQUE (id, store_id),
    CONSTRAINT ck_product_status CHECK (status IN ('draft', 'active', 'archived')),
    CONSTRAINT ck_product_stretch CHECK (material_stretch IS NULL OR material_stretch IN ('unknown', 'non_stretch', 'low_stretch', 'medium_stretch', 'high_stretch')),
    CONSTRAINT fk_product_store FOREIGN KEY (store_id)
        REFERENCES store (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_size_chart_same_store FOREIGN KEY (size_chart_id, store_id)
        REFERENCES size_chart (id, store_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_product_store_id ON product(store_id);
CREATE INDEX IF NOT EXISTS ix_product_status ON product(status);
CREATE INDEX IF NOT EXISTS ix_product_size_chart_id ON product(size_chart_id);

-- 4. Create product_variant table with composite FK to product(id, store_id)
CREATE TABLE IF NOT EXISTS product_variant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    size VARCHAR(30) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_product_variant_size UNIQUE (product_id, size),
    CONSTRAINT fk_variant_product_same_store FOREIGN KEY (product_id, store_id)
        REFERENCES product (id, store_id) ON DELETE CASCADE,
    CONSTRAINT fk_variant_store FOREIGN KEY (store_id)
        REFERENCES store (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_product_variant_product_id ON product_variant(product_id);
CREATE INDEX IF NOT EXISTS ix_product_variant_store_id ON product_variant(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_variant_sku ON product_variant(store_id, sku) WHERE sku IS NOT NULL;
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS product_variant;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS garment_measurement;
DROP TABLE IF EXISTS size_chart;
"""

def upgrade(db_path: str):
    """
    Applies the Milestone 3A schema upgrade to the specified SQLite database path.
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
    Reverts the Milestone 3A schema changes on the specified SQLite database path.
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
