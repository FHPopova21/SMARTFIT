from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from . import db
from datetime import datetime, timezone
from sqlalchemy.orm import validates
from sqlalchemy import text, Index

def get_utc_now():
    return datetime.now(timezone.utc)

class BodyMeasurements(db.Model):
    """
    Модел за телесни мерки на потребителя. Съдържа височина, тегло, пол, гръдна обиколка, талия, тип тяло и възраст.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    height = db.Column(db.Float, nullable=False)  # in cm
    weight = db.Column(db.Float, nullable=False)  # in kg
    gender = db.Column(db.String(10), nullable=False)  # 'male' or 'female'
    chest = db.Column(db.Float, nullable=False)  # in cm
    waist = db.Column(db.Float, nullable=False)  # in cm
    body_type = db.Column(db.String(20), nullable=False)  # 'slim', 'medium', or 'large'
    age = db.Column(db.Integer)  # optional
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    def __init__(self, user_id=None, height=None, weight=None, gender=None, chest=None, waist=None, body_type=None, age=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'user_id': user_id, 'height': height, 'weight': weight, 'gender': gender,
            'chest': chest, 'waist': waist, 'body_type': body_type, 'age': age
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        """
        Връща речник с всички телесни мерки на потребителя.
        """
        return {
            'height': self.height,
            'weight': self.weight,
            'gender': self.gender,
            'chest': self.chest,
            'waist': self.waist,
            'bodyType': self.body_type,
            'age': self.age
        }

class MerchantOrganization(db.Model):
    """
    Модел за търговска организация (Tenant).
    """
    __tablename__ = 'merchant_organization'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    status = db.Column(db.String(30), default='active', nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    stores = db.relationship('Store', backref='organization', lazy=True, cascade='all, delete-orphan')
    memberships = db.relationship('StoreMembership', backref='organization', lazy=True, cascade='all, delete-orphan')

    def __init__(self, name=None, slug=None, status='active', **kwargs):
        kwargs.update({k: v for k, v in {
            'name': name, 'slug': slug, 'status': status
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'status': self.status,
            'stores_count': len(self.stores) if self.stores else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Store(db.Model):
    """
    Модел за конкретен магазин (Storefront) под дадена организация.
    """
    __tablename__ = 'store'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('merchant_organization.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True)
    currency = db.Column(db.String(10), default='BGN', nullable=False)
    platform_type = db.Column(db.String(50), default='custom', nullable=False)  # 'custom', 'shopify', 'woocommerce', 'magento'
    connection_status = db.Column(db.String(30), default='disconnected', nullable=False)  # 'connected', 'disconnected', 'sandbox'
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    __table_args__ = (
        db.UniqueConstraint('id', 'organization_id', name='uq_store_id_org_id'),
    )

    memberships = db.relationship(
        'StoreMembership',
        backref=db.backref('store', overlaps="memberships,organization"),
        lazy=True,
        cascade='all, delete-orphan',
        overlaps="memberships,organization"
    )

    products = db.relationship(
        'Product',
        backref='store',
        lazy=True,
        cascade='all, delete-orphan'
    )

    size_charts = db.relationship(
        'SizeChart',
        backref='store',
        lazy=True,
        cascade='all, delete-orphan'
    )

    widget_configuration = db.relationship(
        'WidgetConfiguration',
        backref='store',
        uselist=False,
        cascade='all, delete-orphan'
    )

    def __init__(self, organization_id=None, name=None, slug=None, currency='BGN', platform_type='custom', connection_status='disconnected', **kwargs):
        kwargs.update({k: v for k, v in {
            'organization_id': organization_id, 'name': name, 'slug': slug,
            'currency': currency, 'platform_type': platform_type, 'connection_status': connection_status
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'organization_name': self.organization.name if self.organization else None,
            'name': self.name,
            'slug': self.slug,
            'currency': self.currency,
            'platform_type': self.platform_type,
            'connection_status': self.connection_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StoreMembership(db.Model):
    """
    Модел за членство на потребител в магазин или организация с права (owner, admin, staff).
    """
    __tablename__ = 'store_membership'
    id = db.Column(db.Integer, primary_key=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('merchant_organization.id', ondelete='CASCADE'), nullable=False, index=True)
    store_id = db.Column(db.Integer, nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False, index=True)
    role = db.Column(db.String(30), default='staff', nullable=False)  # 'owner', 'admin', 'staff'
    created_at = db.Column(db.DateTime, default=get_utc_now)

    VALID_ROLES = {'owner', 'admin', 'staff'}

    __table_args__ = (
        # Composite FK ensures store-specific membership references a store belonging to the SAME organization
        db.ForeignKeyConstraint(
            ['store_id', 'organization_id'],
            ['store.id', 'store.organization_id'],
            ondelete='CASCADE',
            name='fk_store_membership_store_org'
        ),
        db.CheckConstraint("role IN ('owner', 'admin', 'staff')", name='ck_store_membership_role'),
        # Unique index for store-specific memberships (store_id IS NOT NULL):
        Index(
            'uq_membership_user_store',
            'user_id', 'store_id',
            unique=True,
            sqlite_where=text('store_id IS NOT NULL'),
            postgresql_where=text('store_id IS NOT NULL')
        ),
        # Unique index for organization-wide memberships (store_id IS NULL):
        Index(
            'uq_membership_user_org_wide',
            'user_id', 'organization_id',
            unique=True,
            sqlite_where=text('store_id IS NULL'),
            postgresql_where=text('store_id IS NULL')
        ),
    )

    def __init__(self, organization_id=None, store_id=None, user_id=None, role='staff', **kwargs):
        kwargs.update({k: v for k, v in {
            'organization_id': organization_id, 'store_id': store_id, 'user_id': user_id, 'role': role
        }.items() if v is not None})
        super().__init__(**kwargs)

    @validates('role')
    def validate_role(self, key, role):
        if role not in self.VALID_ROLES:
            raise ValueError(f"Invalid membership role '{role}'. Allowed roles: {', '.join(sorted(self.VALID_ROLES))}")
        return role

    def to_dict(self):
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'store_id': self.store_id,
            'user_id': self.user_id,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SizeChart(db.Model):
    """
    Модел за таблица с размери (Size Chart), дефинирана от конкретен магазин.
    Може да се преизползва от множество продукти в рамките на същия магазин.
    """
    __tablename__ = 'size_chart'
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('store.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    garment_category = db.Column(db.String(50), nullable=False)
    chart_type = db.Column(db.String(30), default='garment_dimensions', nullable=False)  # 'garment_dimensions', 'body_measurements'
    measurement_convention = db.Column(db.String(30), default='flat_garment', nullable=False)  # 'flat_garment', 'garment_circumference', 'body_circumference'
    unit = db.Column(db.String(10), default='cm', nullable=False)  # 'cm', 'inch'
    version = db.Column(db.Integer, default=1, nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    __table_args__ = (
        db.UniqueConstraint('id', 'store_id', name='uq_size_chart_id_store_id'),
        db.CheckConstraint("chart_type IN ('garment_dimensions', 'body_measurements')", name='ck_size_chart_type'),
        db.CheckConstraint("measurement_convention IN ('flat_garment', 'garment_circumference', 'body_circumference')", name='ck_size_chart_convention'),
        db.CheckConstraint("unit IN ('cm', 'inch')", name='ck_size_chart_unit'),
    )

    measurements = db.relationship('GarmentMeasurement', backref='size_chart', cascade='all, delete-orphan', lazy=True)

    def __init__(self, store_id=None, name=None, garment_category=None, chart_type='garment_dimensions', measurement_convention='flat_garment', unit='cm', version=1, **kwargs):
        kwargs.update({k: v for k, v in {
            'store_id': store_id, 'name': name, 'garment_category': garment_category,
            'chart_type': chart_type, 'measurement_convention': measurement_convention,
            'unit': unit, 'version': version
        }.items() if v is not None})
        super().__init__(**kwargs)

    def is_referenced_by_active_products(self):
        return Product.query.filter_by(size_chart_id=self.id, status='active').count() > 0

    def to_dict(self, include_measurements=True):
        res = {
            'id': self.id,
            'store_id': self.store_id,
            'name': self.name,
            'garment_category': self.garment_category,
            'chart_type': self.chart_type,
            'measurement_convention': self.measurement_convention,
            'unit': self.unit,
            'version': self.version,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_measurements and self.measurements:
            res['measurements'] = [m.to_dict() for m in self.measurements]
        return res


class GarmentMeasurement(db.Model):
    """
    Модел за мерки на конкретен размер в рамките на таблица с размери.
    Строго разграничава:
    - flat garment widths (плоска ширина)
    - garment circumferences (360° обиколка на дрехата)
    - body circumferences (360° обиколка на човешкото тяло)
    - longitudinal seam lengths (линейни дължини)
    """
    __tablename__ = 'garment_measurement'
    id = db.Column(db.Integer, primary_key=True)
    size_chart_id = db.Column(db.Integer, db.ForeignKey('size_chart.id', ondelete='CASCADE'), nullable=False, index=True)
    size = db.Column(db.String(30), nullable=False)

    # Flat garment widths (measured seam-to-seam across flat garment, cm)
    flat_chest_width = db.Column(db.Float, nullable=True)
    flat_waist_width = db.Column(db.Float, nullable=True)
    flat_hip_width = db.Column(db.Float, nullable=True)

    # Garment 360° circumferences (measured perimeter of garment, cm)
    garment_chest_circumference = db.Column(db.Float, nullable=True)
    garment_waist_circumference = db.Column(db.Float, nullable=True)
    garment_hip_circumference = db.Column(db.Float, nullable=True)

    # Recommended body 360° circumferences (target human body size, cm)
    body_chest_circumference = db.Column(db.Float, nullable=True)
    body_waist_circumference = db.Column(db.Float, nullable=True)
    body_hip_circumference = db.Column(db.Float, nullable=True)

    # Longitudinal seam dimensions (cm)
    total_length = db.Column(db.Float, nullable=True)
    sleeve_length = db.Column(db.Float, nullable=True)
    inseam_length = db.Column(db.Float, nullable=True)
    shoulder_width = db.Column(db.Float, nullable=True)

    __table_args__ = (
        db.UniqueConstraint('size_chart_id', 'size', name='uq_measurement_chart_size'),
        db.CheckConstraint('flat_chest_width IS NULL OR flat_chest_width > 0', name='ck_flat_chest_pos'),
        db.CheckConstraint('flat_waist_width IS NULL OR flat_waist_width > 0', name='ck_flat_waist_pos'),
        db.CheckConstraint('flat_hip_width IS NULL OR flat_hip_width > 0', name='ck_flat_hip_pos'),
        db.CheckConstraint('garment_chest_circumference IS NULL OR garment_chest_circumference > 0', name='ck_garment_chest_circ_pos'),
        db.CheckConstraint('garment_waist_circumference IS NULL OR garment_waist_circumference > 0', name='ck_garment_waist_circ_pos'),
        db.CheckConstraint('garment_hip_circumference IS NULL OR garment_hip_circumference > 0', name='ck_garment_hip_circ_pos'),
        db.CheckConstraint('body_chest_circumference IS NULL OR body_chest_circumference > 0', name='ck_body_chest_circ_pos'),
        db.CheckConstraint('body_waist_circumference IS NULL OR body_waist_circumference > 0', name='ck_body_waist_circ_pos'),
        db.CheckConstraint('body_hip_circumference IS NULL OR body_hip_circumference > 0', name='ck_body_hip_circ_pos'),
        db.CheckConstraint('total_length IS NULL OR total_length > 0', name='ck_total_length_pos'),
        db.CheckConstraint('sleeve_length IS NULL OR sleeve_length > 0', name='ck_sleeve_length_pos'),
        db.CheckConstraint('inseam_length IS NULL OR inseam_length > 0', name='ck_inseam_length_pos'),
        db.CheckConstraint('shoulder_width IS NULL OR shoulder_width > 0', name='ck_shoulder_width_pos'),
    )

    def __init__(self, size_chart_id=None, size=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'size_chart_id': size_chart_id, 'size': size
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'size_chart_id': self.size_chart_id,
            'size': self.size,
            'flat_chest_width': self.flat_chest_width,
            'flat_waist_width': self.flat_waist_width,
            'flat_hip_width': self.flat_hip_width,
            'garment_chest_circumference': self.garment_chest_circumference,
            'garment_waist_circumference': self.garment_waist_circumference,
            'garment_hip_circumference': self.garment_hip_circumference,
            'body_chest_circumference': self.body_chest_circumference,
            'body_waist_circumference': self.body_waist_circumference,
            'body_hip_circumference': self.body_hip_circumference,
            'total_length': self.total_length,
            'sleeve_length': self.sleeve_length,
            'inseam_length': self.inseam_length,
            'shoulder_width': self.shoulder_width,
        }


class Product(db.Model):
    """
    Модел за продукт на търговеца, принадлежащ към конкретен магазин.
    Връзката със SizeChart е защитена с композитен външен ключ (id, store_id) с ON DELETE RESTRICT
    за предотвратяване на cross-store препратки и случайно изтриване на използвани таблици.
    """
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('store.id', ondelete='CASCADE'), nullable=False, index=True)
    size_chart_id = db.Column(db.Integer, nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    material_stretch = db.Column(db.String(30), default='unknown', nullable=True)
    brand = db.Column(db.String(100), nullable=True)
    sku_prefix = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    external_reference = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(30), default='draft', nullable=False)  # 'draft', 'active', 'archived'
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    __table_args__ = (
        db.UniqueConstraint('id', 'store_id', name='uq_product_id_store_id'),
        db.ForeignKeyConstraint(
            ['size_chart_id', 'store_id'],
            ['size_chart.id', 'size_chart.store_id'],
            ondelete='RESTRICT',
            name='fk_product_size_chart_same_store'
        ),
        db.CheckConstraint("status IN ('draft', 'active', 'archived')", name='ck_product_status'),
        db.CheckConstraint("material_stretch IS NULL OR material_stretch IN ('unknown', 'non_stretch', 'low_stretch', 'medium_stretch', 'high_stretch')", name='ck_product_stretch'),
    )

    variants = db.relationship('ProductVariant', backref='product', cascade='all, delete-orphan', lazy=True)
    size_chart = db.relationship(
        'SizeChart',
        backref=db.backref('products', overlaps='products,store'),
        foreign_keys=[size_chart_id, store_id],
        overlaps='products,store',
        lazy=True
    )

    def __init__(self, store_id=None, size_chart_id=None, name=None, category=None, material_stretch='unknown', brand=None, sku_prefix=None, description=None, image_url=None, external_reference=None, status='draft', **kwargs):
        kwargs.update({k: v for k, v in {
            'store_id': store_id, 'size_chart_id': size_chart_id, 'name': name,
            'category': category, 'material_stretch': material_stretch, 'brand': brand,
            'sku_prefix': sku_prefix, 'description': description, 'image_url': image_url,
            'external_reference': external_reference, 'status': status
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self, include_variants=True):
        res = {
            'id': self.id,
            'store_id': self.store_id,
            'size_chart_id': self.size_chart_id,
            'size_chart_name': self.size_chart.name if self.size_chart else None,
            'name': self.name,
            'category': self.category,
            'material_stretch': self.material_stretch or 'unknown',
            'brand': self.brand,
            'sku_prefix': self.sku_prefix,
            'description': self.description,
            'image_url': self.image_url,
            'external_reference': self.external_reference,
            'status': self.status,
            'variants_count': len(self.variants) if self.variants else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_variants and self.variants:
            res['variants'] = [v.to_dict() for v in self.variants]
        return res


class ProductVariant(db.Model):
    """
    Модел за вариант на продукт (размер/SKU).
    Поддържа потребителски етикети за размер (custom size labels).
    Композитният външен ключ гарантира принадлежност към същия магазин,
    а уникалният индекс за SKU е строго ограничен в рамките на магазина.
    """
    __tablename__ = 'product_variant'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, nullable=False, index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('store.id', ondelete='CASCADE'), nullable=False, index=True)
    size = db.Column(db.String(30), nullable=False)
    sku = db.Column(db.String(100), nullable=True)
    barcode = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now)

    __table_args__ = (
        db.ForeignKeyConstraint(
            ['product_id', 'store_id'],
            ['product.id', 'product.store_id'],
            ondelete='CASCADE',
            name='fk_variant_product_same_store'
        ),
        db.UniqueConstraint('product_id', 'size', name='uq_product_variant_size'),
        Index(
            'uq_store_variant_sku',
            'store_id', 'sku',
            unique=True,
            sqlite_where=text('sku IS NOT NULL'),
            postgresql_where=text('sku IS NOT NULL')
        ),
    )

    def __init__(self, product_id=None, store_id=None, size=None, sku=None, barcode=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'product_id': product_id, 'store_id': store_id, 'size': size,
            'sku': sku, 'barcode': barcode
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'store_id': self.store_id,
            'size': self.size,
            'sku': self.sku,
            'barcode': self.barcode,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class WidgetConfiguration(db.Model):
    """
    Store-scoped widget configuration model for FitVision storefront embed.
    Belongs to exactly one store via a unique foreign key constraint.
    Stores trigger button styling, default units, and localization settings.
    """
    __tablename__ = 'widget_configuration'

    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, db.ForeignKey('store.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    is_enabled = db.Column(db.Boolean, default=False, server_default=text('0'), nullable=False)
    button_label = db.Column(db.String(50), default='Compare My Fit', server_default=text("'Compare My Fit'"), nullable=False)
    primary_color = db.Column(db.String(7), default='#4F46E5', server_default=text("'#4F46E5'"), nullable=False)
    text_color = db.Column(db.String(7), default='#FFFFFF', server_default=text("'#FFFFFF'"), nullable=False)
    border_radius = db.Column(db.String(20), default='rounded', server_default=text("'rounded'"), nullable=False)
    show_ruler_icon = db.Column(db.Boolean, default=True, server_default=text('1'), nullable=False)
    default_unit = db.Column(db.String(10), default='cm', server_default=text("'cm'"), nullable=False)
    default_language = db.Column(db.String(5), default='en', server_default=text("'en'"), nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    __table_args__ = (
        db.CheckConstraint("border_radius IN ('pill', 'rounded', 'square')", name='ck_widget_border_radius'),
        db.CheckConstraint("default_unit IN ('cm', 'inch')", name='ck_widget_default_unit'),
        db.CheckConstraint("default_language IN ('en', 'bg')", name='ck_widget_default_lang'),
    )

    VALID_BORDER_RADII = {'pill', 'rounded', 'square'}
    VALID_DEFAULT_UNITS = {'cm', 'inch'}
    VALID_LANGUAGES = {'en', 'bg'}

    def __init__(
        self,
        store_id=None,
        is_enabled=False,
        button_label='Compare My Fit',
        primary_color='#4F46E5',
        text_color='#FFFFFF',
        border_radius='rounded',
        show_ruler_icon=True,
        default_unit='cm',
        default_language='en',
        **kwargs
    ):
        kwargs.update({k: v for k, v in {
            'store_id': store_id,
            'is_enabled': is_enabled,
            'button_label': button_label,
            'primary_color': primary_color,
            'text_color': text_color,
            'border_radius': border_radius,
            'show_ruler_icon': show_ruler_icon,
            'default_unit': default_unit,
            'default_language': default_language,
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'store_id': self.store_id,
            'is_enabled': self.is_enabled,
            'button_label': self.button_label,
            'primary_color': self.primary_color,
            'text_color': self.text_color,
            'border_radius': self.border_radius,
            'show_ruler_icon': self.show_ruler_icon,
            'default_unit': self.default_unit,
            'default_language': self.default_language,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class User(UserMixin, db.Model):
    """
    Модел за потребител. Съдържа данни за вход, роля и връзки към други обекти.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='user')  # 'user', 'seller', or 'admin'
    recommendations = db.relationship('RecommendationHistory', backref='user', lazy=True)
    body_measurements = db.relationship('BodyMeasurements', backref='user', uselist=False, lazy=True)
    clothes = db.relationship('Clothing', backref='seller', lazy=True)
    comments = db.relationship('Comment', backref='user', lazy=True)
    store_memberships = db.relationship('StoreMembership', backref='user', lazy=True, cascade='all, delete-orphan')

    def __init__(self, username=None, email=None, role='user', password_hash=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'username': username, 'email': email, 'role': role, 'password_hash': password_hash
        }.items() if v is not None})
        super().__init__(**kwargs)
    
    def set_password(self, password):
        """
        Задава хеширана парола на потребителя.
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Проверява дали подадената парола съвпада с хешираната парола на потребителя.
        """
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """
        Връща речник с основните данни за потребителя.
        """
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'name': self.username,  # Adding name field for frontend compatibility
            'bodyMeasurements': self.body_measurements.to_dict() if self.body_measurements else None
        }

class Clothing(db.Model):
    """
    Модел за дреха. Съдържа информация за име, тип, материя, размер, мерки, цена, описание и продавач.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'shirt', 'pants', 'dress', 'jacket', 'skirt', 'sweater'
    material = db.Column(db.String(50), nullable=False)  # 'elastic', 'non-elastic', 'semi-elastic'
    size = db.Column(db.String(10), nullable=False)  # 'XS', 'S', 'M', 'L', 'XL', 'XXL'
    width = db.Column(db.Float, nullable=False)  # in cm
    length = db.Column(db.Float, nullable=False)  # in cm
    sleeves = db.Column(db.Float)  # in cm, optional
    price = db.Column(db.Float)  # optional
    description = db.Column(db.Text)  # optional
    image_url = db.Column(db.String(500))  # optional
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)
    comments = db.relationship('Comment', backref='clothing', lazy=True)

    def __init__(self, name=None, type=None, material=None, size=None, width=None, length=None, sleeves=None, price=None, description=None, image_url=None, seller_id=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'name': name, 'type': type, 'material': material, 'size': size,
            'width': width, 'length': length, 'sleeves': sleeves, 'price': price,
            'description': description, 'image_url': image_url, 'seller_id': seller_id
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        """
        Връща речник с всички данни за дрехата.
        """
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'material': self.material,
            'size': self.size,
            'measurements': {
                'width': self.width,
                'length': self.length,
                'sleeves': self.sleeves
            },
            'price': self.price,
            'description': self.description,
            'image_url': self.image_url,
            'image': self.image_url,
            'seller_id': self.seller_id,
            'seller_name': self.seller.username if self.seller else None,
            'merchantId': str(self.seller_id),
            'merchantName': self.seller.username if self.seller else 'SmartFit Store',
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Comment(db.Model):
    """
    Модел за коментар към дреха. Съдържа съдържание, рейтинг, потребител, дреха и дати.
    """
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer)  # 1-5 stars, optional
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    clothing_id = db.Column(db.Integer, db.ForeignKey('clothing.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now)

    def __init__(self, content=None, rating=None, user_id=None, clothing_id=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'content': content, 'rating': rating, 'user_id': user_id, 'clothing_id': clothing_id
        }.items() if v is not None})
        super().__init__(**kwargs)

    def to_dict(self):
        """
        Връща речник с всички данни за коментара.
        """
        return {
            'id': self.id,
            'content': self.content,
            'rating': self.rating,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else None,
            'clothing_id': self.clothing_id,
            'clothing_name': self.clothing.name if self.clothing else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class RecommendationHistory(db.Model):
    """
    Модел за история на препоръките. Съдържа данни за препоръчан размер, мерки и връзка към потребител.
    """
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=get_utc_now)
    clothing_type = db.Column(db.String(50), nullable=False)
    recommended_size = db.Column(db.String(10), nullable=False)
    height = db.Column(db.String(10))
    weight = db.Column(db.String(10))
    chest = db.Column(db.String(10))
    waist = db.Column(db.String(10))
    body_type = db.Column(db.String(20))
    item_identifier = db.Column(db.String(100))  # To group related recommendations

    def __init__(self, user_id=None, clothing_type=None, recommended_size=None, height=None, weight=None, chest=None, waist=None, body_type=None, item_identifier=None, date=None, **kwargs):
        kwargs.update({k: v for k, v in {
            'user_id': user_id, 'clothing_type': clothing_type, 'recommended_size': recommended_size,
            'height': height, 'weight': weight, 'chest': chest, 'waist': waist,
            'body_type': body_type, 'item_identifier': item_identifier, 'date': date
        }.items() if v is not None})
        super().__init__(**kwargs)
    
    def to_dict(self):
        """
        Връща речник с всички данни за препоръката и свързаните препоръки.
        """
        related = []
        if self.item_identifier:
            related = RecommendationHistory.query.filter(
                RecommendationHistory.item_identifier == self.item_identifier,
                RecommendationHistory.id != self.id,
                RecommendationHistory.user_id == self.user_id
            ).order_by(RecommendationHistory.date.desc()).all()

        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'clothingType': self.clothing_type,
            'recommendedSize': self.recommended_size,
            'measurements': {
                'height': self.height,
                'weight': self.weight,
                'chest': self.chest,
                'waist': self.waist,
                'bodyType': self.body_type
            },
            'relatedRecommendations': [r.to_dict_without_related() for r in related]
        }
    
    def to_dict_without_related(self):
        """
        Връща речник с данни за препоръката без свързаните препоръки.
        """
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'clothingType': self.clothing_type,
            'recommendedSize': self.recommended_size,
            'measurements': {
                'height': self.height,
                'weight': self.weight,
                'chest': self.chest,
                'waist': self.waist,
                'bodyType': self.body_type
            }
        }