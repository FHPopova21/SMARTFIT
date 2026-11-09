from flask import Blueprint, jsonify, request, g
from flask_login import login_required, current_user
from app.models import db, MerchantOrganization, Store, StoreMembership, WidgetConfiguration
from app.decorators import store_required, get_user_stores, csrf_protect
from app.logging_config import log_user_action, log_error
import re
import logging

logger = logging.getLogger(__name__)

store_bp = Blueprint('store_bp', __name__)

ALLOWED_CURRENCIES = {'BGN', 'EUR', 'USD', 'GBP'}
ALLOWED_PLATFORMS = {'custom', 'shopify', 'woocommerce', 'magento'}

def slugify(text: str) -> str:
    """Generate a clean URL slug from a name."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-') or 'store'


def get_unique_slug(model, base_slug: str) -> str:
    """Ensure slug uniqueness by appending an incrementing counter if needed."""
    slug = base_slug
    counter = 1
    while model.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


# ==========================================
# 1. LIST ACCESSIBLE STORES (GET)
# ==========================================

@store_bp.route('/v1/merchant/stores', methods=['GET'])
@login_required
def list_merchant_stores():
    """
    Returns all stores accessible by the current authenticated user,
    scoped strictly to verified StoreMembership records.
    """
    try:
        # Platform admin override sees all stores
        if getattr(current_user, 'role', None) == 'admin':
            all_stores = Store.query.order_by(Store.created_at.desc()).all()
            return jsonify({
                'stores': [{
                    **s.to_dict(),
                    'role': 'owner',
                    'is_platform_admin': True
                } for s in all_stores]
            }), 200

        accessible = get_user_stores(current_user.id)
        result = []
        for item in accessible:
            s_dict = item['store'].to_dict()
            s_dict['role'] = item['role']
            s_dict['is_org_wide'] = item.get('is_org_wide', False)
            result.append(s_dict)

        log_user_action("list_merchant_stores", current_user.id, f"Found {len(result)} stores")
        return jsonify({'stores': result}), 200

    except Exception as e:
        log_error(e, "Error listing merchant stores")
        return jsonify({'error': str(e)}), 500


# ==========================================
# 2. CREATE A NEW STORE (POST)
# ==========================================

@store_bp.route('/v1/merchant/stores', methods=['POST'])
@login_required
@csrf_protect
def create_merchant_store():
    """
    Creates a new store for the current user.
    Executes in a single atomic database transaction:
    1. Validate permissions (seller or admin role required).
    2. Resolve or create MerchantOrganization.
    3. Create Store with connection_status = 'disconnected'.
    4. Create StoreMembership with role = 'owner'.
    """
    try:
        # 1. Role verification: Only registered sellers or admins can create stores
        if getattr(current_user, 'role', None) not in ('seller', 'admin'):
            return jsonify({'error': 'Merchant access required. Only registered sellers can create stores.'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # 2. Field validation
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Store name is required'}), 400
        if len(name) > 150:
            return jsonify({'error': 'Store name must not exceed 150 characters'}), 400

        currency = data.get('currency', 'BGN').strip().upper()
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({'error': f"Invalid currency '{currency}'. Allowed: {', '.join(sorted(ALLOWED_CURRENCIES))}"}), 400

        platform_type = data.get('platform_type', 'custom').strip().lower()
        if platform_type not in ALLOWED_PLATFORMS:
            return jsonify({'error': f"Invalid platform '{platform_type}'. Allowed: {', '.join(sorted(ALLOWED_PLATFORMS))}"}), 400

        # Validate website_url if provided (persistence pending schema migration approval)
        website_url = data.get('website_url')
        if website_url:
            website_url = str(website_url).strip()
            if len(website_url) > 255:
                return jsonify({'error': 'Store website URL must not exceed 255 characters'}), 400
            logger.info("Store website URL provided (length=%d). Full column persistence pending additive migration.", len(website_url))

        # 3. Organization resolution (Zero trust on client-submitted org ID)
        client_org_id = data.get('organization_id')
        org = None

        if client_org_id is not None:
            try:
                client_org_id = int(client_org_id)
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid organization_id format'}), 400

            # Verify that current_user has verified owner/admin membership in this organization
            verified_membership = StoreMembership.query.filter_by(
                user_id=current_user.id,
                organization_id=client_org_id
            ).filter(StoreMembership.role.in_(['owner', 'admin'])).first()

            if not verified_membership and getattr(current_user, 'role', None) != 'admin':
                return jsonify({'error': 'Unauthorized: You do not have permission to add stores to this organization'}), 403

            org = db.session.get(MerchantOrganization, client_org_id)
            if not org:
                return jsonify({'error': 'Specified organization not found'}), 404

        if not org:
            # Check if user already owns an organization
            existing_owner_membership = StoreMembership.query.filter_by(
                user_id=current_user.id,
                role='owner'
            ).first()

            if existing_owner_membership and existing_owner_membership.organization_id:
                org = db.session.get(MerchantOrganization, existing_owner_membership.organization_id)

        # 4. Atomic Execution: Begin transactional creation
        if not org:
            org_base_slug = slugify(f"{current_user.username}-org")
            org_slug = get_unique_slug(MerchantOrganization, org_base_slug)
            org = MerchantOrganization(
                name=f"{current_user.username}'s Organization",
                slug=org_slug,
                status='active'
            )
            db.session.add(org)
            db.session.flush()

        # Generate unique store slug
        store_base_slug = slugify(name)
        store_slug = get_unique_slug(Store, store_base_slug)

        # All newly created stores are initially disconnected
        store = Store(
            organization_id=org.id,
            name=name,
            slug=store_slug,
            currency=currency,
            platform_type=platform_type,
            connection_status='disconnected'
        )
        db.session.add(store)
        db.session.flush()

        # Create store-specific owner membership
        membership = StoreMembership(
            organization_id=org.id,
            store_id=store.id,
            user_id=current_user.id,
            role='owner'
        )
        db.session.add(membership)

        # Commit all entities atomically
        db.session.commit()

        log_user_action("create_merchant_store", current_user.id, f"Store ID: {store.id}, Name: {store.name}")
        logger.info(f"User {current_user.id} created store {store.id} ({store.name})")

        response_payload = store.to_dict()
        response_payload['role'] = 'owner'

        return jsonify({
            'message': 'Store created successfully',
            'store': response_payload
        }), 201

    except Exception as e:
        db.session.rollback()
        log_error(e, "Error creating merchant store")
        return jsonify({'error': str(e)}), 500


# ==========================================
# 3. GET SINGLE STORE DETAILS (GET)
# ==========================================

@store_bp.route('/v1/merchant/stores/<int:store_id>', methods=['GET'])
@login_required
@store_required(min_role='staff')
def get_merchant_store_details(store_id):
    """
    Returns store details for authorized staff, admin, or owner.
    Guarded strictly by @store_required to prevent cross-tenant IDOR.
    """
    try:
        response_payload = g.current_store.to_dict()
        response_payload['role'] = g.current_role
        return jsonify({'store': response_payload}), 200
    except Exception as e:
        log_error(e, f"Error retrieving store {store_id}")
        return jsonify({'error': str(e)}), 500


# ==========================================
# 4. UPDATE STORE DETAILS (PUT)
# ==========================================

@store_bp.route('/v1/merchant/stores/<int:store_id>', methods=['PUT'])
@login_required
@csrf_protect
@store_required(min_role='admin')
def update_merchant_store(store_id):
    """
    Updates store configuration (requires admin or owner privileges).
    Arbitrary modification of connection_status is strictly forbidden.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        store = g.current_store

        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Store name cannot be empty'}), 400
            if len(name) > 150:
                return jsonify({'error': 'Store name must not exceed 150 characters'}), 400
            store.name = name

        if 'currency' in data:
            currency = data['currency'].strip().upper()
            if currency not in ALLOWED_CURRENCIES:
                return jsonify({'error': f"Invalid currency '{currency}'. Allowed: {', '.join(sorted(ALLOWED_CURRENCIES))}"}), 400
            store.currency = currency

        if 'platform_type' in data:
            platform_type = data['platform_type'].strip().lower()
            if platform_type not in ALLOWED_PLATFORMS:
                return jsonify({'error': f"Invalid platform '{platform_type}'. Allowed: {', '.join(sorted(ALLOWED_PLATFORMS))}"}), 400
            store.platform_type = platform_type

        # Note: connection_status cannot be arbitrarily altered by the client
        if 'connection_status' in data and data['connection_status'] != store.connection_status:
            return jsonify({'error': 'Direct modification of connection_status is not permitted'}), 403

        db.session.commit()
        log_user_action("update_merchant_store", current_user.id, f"Store ID: {store.id}")

        response_payload = store.to_dict()
        response_payload['role'] = g.current_role

        return jsonify({
            'message': 'Store updated successfully',
            'store': response_payload
        }), 200

    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error updating store {store_id}")
        return jsonify({'error': str(e)}), 500


# ==========================================
# 6. WIDGET CONFIGURATION MANAGEMENT (GET, PUT)
# ==========================================

HEX_COLOR_REGEX = re.compile(r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$')
ALLOWED_WIDGET_CONFIG_FIELDS = {
    'is_enabled', 'button_label', 'primary_color', 'text_color',
    'border_radius', 'show_ruler_icon', 'default_unit', 'default_language'
}


@store_bp.route('/v1/merchant/stores/<int:store_id>/widget-config', methods=['GET'])
@login_required
@store_required(min_role='staff')
def get_store_widget_config(store_id):
    """
    Retrieves the widget configuration for the authorized store.
    Accessible by staff, admin, and owner roles.
    If no record exists, returns explicit default configuration without database mutation.
    """
    store = g.current_store
    config = WidgetConfiguration.query.filter_by(store_id=store.id).first()
    if config:
        return jsonify({'widget_config': config.to_dict()}), 200

    # Default configuration representation without persisting to DB
    default_payload = {
        'id': None,
        'store_id': store.id,
        'is_enabled': False,
        'button_label': 'Compare My Fit',
        'primary_color': '#4F46E5',
        'text_color': '#FFFFFF',
        'border_radius': 'rounded',
        'show_ruler_icon': True,
        'default_unit': 'cm',
        'default_language': 'en',
        'created_at': None,
        'updated_at': None,
    }
    return jsonify({'widget_config': default_payload}), 200


@store_bp.route('/v1/merchant/stores/<int:store_id>/widget-config', methods=['PUT'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def update_store_widget_config(store_id):
    """
    Creates or updates widget configuration for the authorized store.
    Requires admin or owner privileges.
    Enforces strict field validation, hex color checks, and length limits.
    """
    store = g.current_store
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Request payload must be a valid JSON object'}), 400

    unexpected = set(data.keys()) - ALLOWED_WIDGET_CONFIG_FIELDS
    if unexpected:
        return jsonify({'error': f"Unexpected field(s): {', '.join(sorted(unexpected))}"}), 400

    # Retrieve existing or instantiate new
    config = WidgetConfiguration.query.filter_by(store_id=store.id).first()
    if not config:
        config = WidgetConfiguration(store_id=store.id)
        db.session.add(config)

    # 1. is_enabled
    if 'is_enabled' in data:
        if not isinstance(data['is_enabled'], bool):
            return jsonify({'error': "Field 'is_enabled' must be a boolean"}), 400
        config.is_enabled = data['is_enabled']

    # 2. button_label
    if 'button_label' in data:
        raw_label = str(data['button_label'] or '').strip()
        if not raw_label:
            return jsonify({'error': "Field 'button_label' cannot be empty"}), 400
        if len(raw_label) > 50:
            return jsonify({'error': "Field 'button_label' exceeds 50 characters"}), 400
        config.button_label = raw_label

    # 3. primary_color
    if 'primary_color' in data:
        color = str(data['primary_color'] or '').strip()
        if not HEX_COLOR_REGEX.match(color):
            return jsonify({'error': f"Invalid primary_color '{color}'. Must be a valid hex color code (e.g. #4F46E5)"}), 400
        config.primary_color = color

    # 4. text_color
    if 'text_color' in data:
        t_color = str(data['text_color'] or '').strip()
        if not HEX_COLOR_REGEX.match(t_color):
            return jsonify({'error': f"Invalid text_color '{t_color}'. Must be a valid hex color code (e.g. #FFFFFF)"}), 400
        config.text_color = t_color

    # 5. border_radius
    if 'border_radius' in data:
        radius = str(data['border_radius'] or '').strip().lower()
        if radius not in WidgetConfiguration.VALID_BORDER_RADII:
            return jsonify({'error': f"Invalid border_radius '{radius}'. Allowed values: {', '.join(sorted(WidgetConfiguration.VALID_BORDER_RADII))}"}), 400
        config.border_radius = radius

    # 6. show_ruler_icon
    if 'show_ruler_icon' in data:
        if not isinstance(data['show_ruler_icon'], bool):
            return jsonify({'error': "Field 'show_ruler_icon' must be a boolean"}), 400
        config.show_ruler_icon = data['show_ruler_icon']

    # 7. default_unit
    if 'default_unit' in data:
        unit = str(data['default_unit'] or '').strip().lower()
        if unit not in WidgetConfiguration.VALID_DEFAULT_UNITS:
            return jsonify({'error': f"Invalid default_unit '{unit}'. Allowed values: {', '.join(sorted(WidgetConfiguration.VALID_DEFAULT_UNITS))}"}), 400
        config.default_unit = unit

    # 8. default_language
    if 'default_language' in data:
        lang = str(data['default_language'] or '').strip().lower()
        if lang not in WidgetConfiguration.VALID_LANGUAGES:
            return jsonify({'error': f"Invalid default_language '{lang}'. Allowed values: {', '.join(sorted(WidgetConfiguration.VALID_LANGUAGES))}"}), 400
        config.default_language = lang

    try:
        db.session.commit()
        log_user_action("update_widget_config", current_user.id, f"Store ID: {store.id}")
        return jsonify({
            'message': 'Widget configuration saved successfully',
            'widget_config': config.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error updating widget config for store {store_id}")
        return jsonify({'error': f"Failed to save widget configuration: {str(e)}"}), 500

