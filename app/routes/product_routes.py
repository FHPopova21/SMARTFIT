from flask import Blueprint, jsonify, request, g
from flask_login import login_required, current_user
from app.models import db, Store, Product, ProductVariant, SizeChart, GarmentMeasurement
from app.decorators import store_required, csrf_protect
from app.logging_config import log_user_action, log_error
from app.services.product_recommendation_service import (
    evaluate_product_fit,
    validate_physical_number,
    normalize_unit_str,
)
import logging

logger = logging.getLogger(__name__)

product_bp = Blueprint('product_bp', __name__)

ALLOWED_PRODUCT_STRETCH = {'unknown', 'non_stretch', 'low_stretch', 'medium_stretch', 'high_stretch'}
ALLOWED_PRODUCT_STATUSES = {'draft', 'active', 'archived'}
ALLOWED_CHART_TYPES = {'garment_dimensions', 'body_measurements'}
ALLOWED_CONVENTIONS = {'flat_garment', 'garment_circumference', 'body_circumference'}
ALLOWED_UNITS = {'cm', 'inch'}

ALLOWED_PRODUCT_CREATE_FIELDS = {
    'name', 'category', 'brand', 'sku_prefix', 'description',
    'image_url', 'external_reference', 'material_stretch',
    'size_chart_id', 'variants'
}

ALLOWED_PRODUCT_UPDATE_FIELDS = {
    'name', 'category', 'brand', 'sku_prefix', 'description',
    'image_url', 'external_reference', 'material_stretch',
    'size_chart_id', 'status'
}

ALLOWED_SIZE_CHART_FIELDS = {
    'name', 'garment_category', 'chart_type', 'measurement_convention',
    'unit', 'measurements'
}

ALLOWED_VARIANT_FIELDS = {'size', 'sku', 'barcode'}

MEASUREMENT_DIMENSIONS = (
    'flat_chest_width', 'flat_waist_width', 'flat_hip_width',
    'garment_chest_circumference', 'garment_waist_circumference', 'garment_hip_circumference',
    'body_chest_circumference', 'body_waist_circumference', 'body_hip_circumference',
    'total_length', 'sleeve_length', 'inseam_length', 'shoulder_width'
)
ALLOWED_MEASUREMENT_FIELDS = {'size', *MEASUREMENT_DIMENSIONS}


# ==========================================
# VALIDATION HELPERS
# ==========================================

def validate_measurement_row(m_data, index=0):
    """
    Validates a single measurement row.
    Returns (cleaned_dict, error_message).
    All dimensions must be positive floats (> 0) if provided. Missing values remain None.
    """
    if not isinstance(m_data, dict):
        return None, f"Measurement entry at index {index} must be an object"

    # Reject unsupported fields
    unsupported = set(m_data.keys()) - ALLOWED_MEASUREMENT_FIELDS
    if unsupported:
        return None, f"Unsupported field(s) in measurement index {index}: {', '.join(sorted(unsupported))}"

    size = str(m_data.get('size') or '').strip()
    if not size:
        return None, f"Measurement entry at index {index} is missing required 'size' label"
    if len(size) > 30:
        return None, f"Size label '{size}' exceeds maximum length of 30 characters"

    cleaned = {'size': size}
    for dim in MEASUREMENT_DIMENSIONS:
        val = m_data.get(dim)
        if val is None or val == '':
            cleaned[dim] = None
        else:
            try:
                num = float(val)
                if num <= 0:
                    return None, f"Measurement '{dim}' for size '{size}' must be greater than 0, got {num}"
                cleaned[dim] = round(num, 2)
            except (ValueError, TypeError):
                return None, f"Measurement '{dim}' for size '{size}' must be a valid positive number"

    return cleaned, None


def validate_product_activation(product: Product) -> tuple[bool, list[str]]:
    """
    Strict validation required before changing product status to 'active'.
    Does NOT fabricate missing measurements.
    """
    errors = []

    # 1. At least one variant must exist
    if not product.variants or len(product.variants) == 0:
        errors.append("Product must have at least one size variant before activation.")

    # 2. An authorized size chart must be assigned
    if not product.size_chart_id or not product.size_chart:
        errors.append("Product must have an assigned size chart belonging to this store before activation.")
        return False, errors

    chart = product.size_chart
    chart_measurements = {m.size: m for m in chart.measurements}

    if not chart_measurements:
        errors.append(f"Assigned size chart '{chart.name}' contains no measurement specifications.")
        return False, errors

    # 3. Each variant size must have a matching chart row
    cat = (product.category or '').strip().lower()
    is_top = any(t in cat for t in ('top', 'shirt', 'tee', 'jacket', 'hoodie', 'sweater', 'outerwear', 'blazer'))
    is_bottom = any(b in cat for t in ('bottom', 'pant', 'jean', 'trouser', 'short', 'skirt') for b in (t,))
    is_dress = 'dress' in cat or 'jumpsuit' in cat

    for v in product.variants:
        if v.size not in chart_measurements:
            errors.append(f"Variant size '{v.size}' has no matching measurement entry in size chart '{chart.name}'.")
            continue

        m = chart_measurements[v.size]

        # 4 & 5. Category-specific required measurements
        if is_top:
            has_chest = bool(m.flat_chest_width or m.garment_chest_circumference or m.body_chest_circumference)
            has_length = bool(m.total_length)
            if not has_chest:
                errors.append(f"Size '{v.size}': top garments require chest measurement (flat width or circumference).")
            if not has_length:
                errors.append(f"Size '{v.size}': top garments require total length measurement.")
        elif is_bottom:
            has_waist_or_hip = bool(
                m.flat_waist_width or m.garment_waist_circumference or m.body_waist_circumference or
                m.flat_hip_width or m.garment_hip_circumference or m.body_hip_circumference
            )
            has_length = bool(m.total_length or m.inseam_length)
            if not has_waist_or_hip:
                errors.append(f"Size '{v.size}': bottom garments require waist or hip measurement.")
            if not has_length:
                errors.append(f"Size '{v.size}': bottom garments require total length or inseam measurement.")
        elif is_dress:
            has_chest = bool(m.flat_chest_width or m.garment_chest_circumference or m.body_chest_circumference)
            has_length = bool(m.total_length)
            if not has_chest or not has_length:
                errors.append(f"Size '{v.size}': dresses require chest and total length measurements.")
        else:
            # Generic category: requires at least one primary dimension and length
            has_primary = bool(
                m.flat_chest_width or m.garment_chest_circumference or m.body_chest_circumference or
                m.flat_waist_width or m.garment_waist_circumference or m.body_waist_circumference or
                m.flat_hip_width or m.garment_hip_circumference or m.body_hip_circumference
            )
            if not has_primary:
                errors.append(f"Size '{v.size}': requires at least one primary width/circumference measurement.")

    return len(errors) == 0, errors


# ==========================================
# PART 2 & 3: PRODUCT MANAGEMENT API
# ==========================================

@product_bp.route('/v1/merchant/stores/<int:store_id>/products', methods=['GET'])
@login_required
@store_required(min_role='staff')
def list_products(store_id):
    """
    Lists products belonging to the authorized store.
    Staff, admin, and owner can view products.
    Supports filtering by status, category, and search query.
    """
    try:
        query = Product.query.filter_by(store_id=g.current_store.id)

        status_filter = request.args.get('status')
        if status_filter:
            query = query.filter_by(status=status_filter.strip().lower())

        category_filter = request.args.get('category')
        if category_filter:
            query = query.filter_by(category=category_filter.strip())

        search = request.args.get('search')
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (Product.name.ilike(search_term)) |
                (Product.brand.ilike(search_term)) |
                (Product.sku_prefix.ilike(search_term))
            )

        products = query.order_by(Product.created_at.desc()).all()
        return jsonify({
            'products': [p.to_dict(include_variants=True) for p in products],
            'total': len(products)
        }), 200

    except Exception as e:
        log_error(e, f"Error listing products for store {store_id}")
        return jsonify({'error': str(e)}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/products', methods=['POST'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def create_product(store_id):
    """
    Creates a new draft product with optional variants in a single atomic transaction.
    Requires admin or owner role. Protected by session-bound CSRF.
    Never trusts client-submitted store_id.
    """
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON request payload'}), 400

    # Whitelist incoming fields — do not accept unsupported fields silently
    unsupported = set(data.keys()) - ALLOWED_PRODUCT_CREATE_FIELDS
    if unsupported:
        return jsonify({'error': f"Unsupported field(s) in payload: {', '.join(sorted(unsupported))}"}), 400

    # Field validations
    name = str(data.get('name') or '').strip()
    if not name:
        return jsonify({'error': "Field 'name' is required"}), 400
    if len(name) > 200:
        return jsonify({'error': "Field 'name' exceeds maximum length of 200 characters"}), 400

    category = str(data.get('category') or '').strip()
    if not category:
        return jsonify({'error': "Field 'category' is required"}), 400
    if len(category) > 50:
        return jsonify({'error': "Field 'category' exceeds maximum length of 50 characters"}), 400

    brand = str(data.get('brand') or '').strip() or None
    if brand and len(brand) > 100:
        return jsonify({'error': "Field 'brand' exceeds maximum length of 100 characters"}), 400

    sku_prefix = str(data.get('sku_prefix') or '').strip() or None
    if sku_prefix and len(sku_prefix) > 50:
        return jsonify({'error': "Field 'sku_prefix' exceeds maximum length of 50 characters"}), 400

    description = data.get('description')
    if description is not None:
        description = str(description).strip() or None

    image_url = str(data.get('image_url') or '').strip() or None
    if image_url and len(image_url) > 500:
        return jsonify({'error': "Field 'image_url' exceeds maximum length of 500 characters"}), 400

    external_reference = str(data.get('external_reference') or '').strip() or None
    if external_reference and len(external_reference) > 100:
        return jsonify({'error': "Field 'external_reference' exceeds maximum length of 100 characters"}), 400

    material_stretch = str(data.get('material_stretch') or 'unknown').strip().lower()
    if material_stretch not in ALLOWED_PRODUCT_STRETCH:
        return jsonify({'error': f"Invalid material_stretch. Allowed: {', '.join(sorted(ALLOWED_PRODUCT_STRETCH))}"}), 400

    # Size Chart Validation: Must belong to the same store
    size_chart_id = data.get('size_chart_id')
    if size_chart_id is not None:
        try:
            size_chart_id = int(size_chart_id)
        except (ValueError, TypeError):
            return jsonify({'error': "Field 'size_chart_id' must be an integer"}), 400

        size_chart = SizeChart.query.filter_by(id=size_chart_id, store_id=g.current_store.id).first()
        if not size_chart:
            return jsonify({'error': "Selected size chart does not exist or does not belong to this store"}), 400

    # Variant Validation: Process and validate all variants before committing
    variants_input = data.get('variants')
    validated_variants = []
    if variants_input is not None:
        if not isinstance(variants_input, list):
            return jsonify({'error': "Field 'variants' must be an array of variant objects"}), 400

        seen_sizes = set()
        seen_skus_in_request = set()

        for idx, v_item in enumerate(variants_input):
            if not isinstance(v_item, dict):
                return jsonify({'error': f"Variant at index {idx} must be an object"}), 400

            v_unsupported = set(v_item.keys()) - ALLOWED_VARIANT_FIELDS
            if v_unsupported:
                return jsonify({'error': f"Unsupported field(s) in variant index {idx}: {', '.join(sorted(v_unsupported))}"}), 400

            v_size = str(v_item.get('size') or '').strip()
            if not v_size:
                return jsonify({'error': f"Variant at index {idx} is missing required 'size' label"}), 400
            if len(v_size) > 30:
                return jsonify({'error': f"Size label '{v_size}' exceeds 30 characters"}), 400

            size_key = v_size.lower()
            if size_key in seen_sizes:
                return jsonify({'error': f"Duplicate size label '{v_size}' within product variants"}), 400
            seen_sizes.add(size_key)

            v_sku = str(v_item.get('sku') or '').strip() or None
            if v_sku:
                if len(v_sku) > 100:
                    return jsonify({'error': f"SKU '{v_sku}' exceeds 100 characters"}), 400
                sku_key = v_sku.lower()
                if sku_key in seen_skus_in_request:
                    return jsonify({'error': f"Duplicate SKU '{v_sku}' within product request"}), 400
                seen_skus_in_request.add(sku_key)

                # Check store-scoped SKU uniqueness in database
                existing_sku = ProductVariant.query.filter_by(store_id=g.current_store.id, sku=v_sku).first()
                if existing_sku:
                    return jsonify({'error': f"SKU '{v_sku}' already exists in this store"}), 400

            v_barcode = str(v_item.get('barcode') or '').strip() or None
            if v_barcode and len(v_barcode) > 100:
                return jsonify({'error': f"Barcode '{v_barcode}' exceeds 100 characters"}), 400

            validated_variants.append({
                'size': v_size,
                'sku': v_sku,
                'barcode': v_barcode
            })

    # Atomic creation of product and variants
    try:
        product = Product(
            store_id=g.current_store.id,
            size_chart_id=size_chart_id,
            name=name,
            category=category,
            brand=brand,
            sku_prefix=sku_prefix,
            description=description,
            image_url=image_url,
            external_reference=external_reference,
            material_stretch=material_stretch,
            status='draft'  # newly created product strictly defaults to draft
        )
        db.session.add(product)
        db.session.flush()  # Flush to generate product.id

        for v_data in validated_variants:
            variant = ProductVariant(
                product_id=product.id,
                store_id=g.current_store.id,
                size=v_data['size'],
                sku=v_data['sku'],
                barcode=v_data['barcode']
            )
            db.session.add(variant)

        db.session.commit()
        log_user_action("create_product", current_user.id, f"Product {product.id} created in store {g.current_store.id}")
        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict(include_variants=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error creating product in store {store_id}")
        return jsonify({'error': f"Failed to create product: {str(e)}"}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>', methods=['GET'])
@login_required
@store_required(min_role='staff')
def get_product(store_id, product_id):
    """
    Returns single product details, scoped strictly to the authorized store.
    Returns 404 for nonexistent or cross-store product IDs.
    """
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    res = product.to_dict(include_variants=True)
    if product.size_chart:
        res['size_chart'] = product.size_chart.to_dict(include_measurements=True)
    else:
        res['size_chart'] = None

    return jsonify({'product': res}), 200


@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>', methods=['PUT'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def update_product(store_id, product_id):
    """
    Updates product details. Requires admin or owner role.
    If activating (status='active'), validates sizing completeness.
    """
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON request payload'}), 400

    unsupported = set(data.keys()) - ALLOWED_PRODUCT_UPDATE_FIELDS
    if unsupported:
        return jsonify({'error': f"Unsupported field(s) in payload: {', '.join(sorted(unsupported))}"}), 400

    # Field validations
    if 'name' in data:
        name = str(data['name'] or '').strip()
        if not name:
            return jsonify({'error': "Field 'name' cannot be empty"}), 400
        if len(name) > 200:
            return jsonify({'error': "Field 'name' exceeds 200 characters"}), 400
        product.name = name

    if 'category' in data:
        category = str(data['category'] or '').strip()
        if not category:
            return jsonify({'error': "Field 'category' cannot be empty"}), 400
        if len(category) > 50:
            return jsonify({'error': "Field 'category' exceeds 50 characters"}), 400
        product.category = category

    if 'brand' in data:
        brand = str(data['brand'] or '').strip() or None
        if brand and len(brand) > 100:
            return jsonify({'error': "Field 'brand' exceeds 100 characters"}), 400
        product.brand = brand

    if 'sku_prefix' in data:
        sku_prefix = str(data['sku_prefix'] or '').strip() or None
        if sku_prefix and len(sku_prefix) > 50:
            return jsonify({'error': "Field 'sku_prefix' exceeds 50 characters"}), 400
        product.sku_prefix = sku_prefix

    if 'description' in data:
        desc = data['description']
        product.description = str(desc).strip() if desc else None

    if 'image_url' in data:
        img = str(data['image_url'] or '').strip() or None
        if img and len(img) > 500:
            return jsonify({'error': "Field 'image_url' exceeds 500 characters"}), 400
        product.image_url = img

    if 'external_reference' in data:
        ext = str(data['external_reference'] or '').strip() or None
        if ext and len(ext) > 100:
            return jsonify({'error': "Field 'external_reference' exceeds 100 characters"}), 400
        product.external_reference = ext

    if 'material_stretch' in data:
        stretch = str(data['material_stretch'] or 'unknown').strip().lower()
        if stretch not in ALLOWED_PRODUCT_STRETCH:
            return jsonify({'error': f"Invalid material_stretch. Allowed: {', '.join(sorted(ALLOWED_PRODUCT_STRETCH))}"}), 400
        product.material_stretch = stretch

    # Re-linking or unlinking size chart
    if 'size_chart_id' in data:
        new_chart_id = data['size_chart_id']
        if new_chart_id is None:
            # If product is currently active, unlinking size chart is rejected
            target_status = data.get('status', product.status)
            if target_status == 'active':
                return jsonify({'error': "Cannot unlink size chart from an active product. Archive or draft the product first."}), 422
            product.size_chart_id = None
        else:
            try:
                new_chart_id = int(new_chart_id)
            except (ValueError, TypeError):
                return jsonify({'error': "Field 'size_chart_id' must be an integer or null"}), 400

            chart = SizeChart.query.filter_by(id=new_chart_id, store_id=g.current_store.id).first()
            if not chart:
                return jsonify({'error': "Selected size chart does not exist or does not belong to this store"}), 400
            product.size_chart_id = new_chart_id

    # Status transition rules
    if 'status' in data:
        new_status = str(data['status'] or '').strip().lower()
        if new_status not in ALLOWED_PRODUCT_STATUSES:
            return jsonify({'error': f"Invalid status. Allowed: {', '.join(sorted(ALLOWED_PRODUCT_STATUSES))}"}), 400

        if new_status == 'active':
            # Run activation rules
            is_valid, validation_errors = validate_product_activation(product)
            if not is_valid:
                return jsonify({
                    'error': 'Product cannot be activated due to incomplete sizing data',
                    'validation_errors': validation_errors
                }), 422

        product.status = new_status

    try:
        db.session.commit()
        log_user_action("update_product", current_user.id, f"Product {product.id} updated in store {g.current_store.id}")
        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict(include_variants=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error updating product {product_id} in store {store_id}")
        return jsonify({'error': f"Failed to update product: {str(e)}"}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>', methods=['DELETE'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def delete_product(store_id, product_id):
    """
    Deletes or archives a product. Requires admin or owner role.
    Defaults to non-destructive archiving.
    If query parameter hard_delete=true is passed, permanently removes the product and its variants.
    """
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    hard_delete = request.args.get('hard_delete', 'false').lower() in ('true', '1')

    try:
        if hard_delete:
            db.session.delete(product)
            db.session.commit()
            log_user_action("delete_product_hard", current_user.id, f"Product {product_id} permanently deleted")
            return jsonify({'message': 'Product permanently deleted', 'id': product_id}), 200
        else:
            product.status = 'archived'
            db.session.commit()
            log_user_action("delete_product_archive", current_user.id, f"Product {product_id} archived")
            return jsonify({
                'message': 'Product archived successfully',
                'product': product.to_dict(include_variants=True)
            }), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error deleting product {product_id}")
        return jsonify({'error': f"Failed to delete product: {str(e)}"}), 500


# ==========================================
# PART 4: PRODUCT VARIANTS API
# ==========================================

@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>/variants', methods=['POST'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def add_product_variant(store_id, product_id):
    """
    Adds a new size variant to an existing product. Requires admin or owner role.
    Enforces product-scoped size uniqueness and store-scoped SKU uniqueness.
    """
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON request payload'}), 400

    unsupported = set(data.keys()) - ALLOWED_VARIANT_FIELDS
    if unsupported:
        return jsonify({'error': f"Unsupported field(s) in payload: {', '.join(sorted(unsupported))}"}), 400

    size = str(data.get('size') or '').strip()
    if not size:
        return jsonify({'error': "Field 'size' is required"}), 400
    if len(size) > 30:
        return jsonify({'error': "Size label exceeds maximum length of 30 characters"}), 400

    # Size uniqueness within product
    existing_size = ProductVariant.query.filter_by(product_id=product.id, size=size).first()
    if existing_size:
        return jsonify({'error': f"Variant size '{size}' already exists for this product"}), 400

    sku = str(data.get('sku') or '').strip() or None
    if sku:
        if len(sku) > 100:
            return jsonify({'error': "SKU exceeds maximum length of 100 characters"}), 400
        existing_sku = ProductVariant.query.filter_by(store_id=g.current_store.id, sku=sku).first()
        if existing_sku:
            return jsonify({'error': f"SKU '{sku}' already exists in this store"}), 400

    barcode = str(data.get('barcode') or '').strip() or None
    if barcode and len(barcode) > 100:
        return jsonify({'error': "Barcode exceeds maximum length of 100 characters"}), 400

    try:
        variant = ProductVariant(
            product_id=product.id,
            store_id=g.current_store.id,
            size=size,
            sku=sku,
            barcode=barcode
        )
        db.session.add(variant)
        db.session.commit()
        log_user_action("add_variant", current_user.id, f"Variant {variant.id} ({size}) added to product {product.id}")
        return jsonify({
            'message': 'Variant added successfully',
            'variant': variant.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error adding variant to product {product_id}")
        return jsonify({'error': f"Failed to add variant: {str(e)}"}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>/variants/<int:variant_id>', methods=['DELETE'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def delete_product_variant(store_id, product_id, variant_id):
    """
    Deletes a size variant from a product.
    If product is active and this is the sole variant, deletion is rejected.
    """
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    variant = ProductVariant.query.filter_by(id=variant_id, product_id=product.id, store_id=g.current_store.id).first()
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    if product.status == 'active' and len(product.variants) <= 1:
        return jsonify({
            'error': 'Cannot delete the sole variant of an active product. Archive the product or add another variant first.'
        }), 422

    try:
        db.session.delete(variant)
        db.session.commit()
        log_user_action("delete_variant", current_user.id, f"Variant {variant_id} deleted from product {product.id}")
        return jsonify({'message': 'Variant deleted successfully', 'id': variant_id}), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error deleting variant {variant_id}")
        return jsonify({'error': f"Failed to delete variant: {str(e)}"}), 500


# ==========================================
# PART 5 & 6: SIZE CHART API
# ==========================================

@product_bp.route('/v1/merchant/stores/<int:store_id>/size-charts', methods=['GET'])
@login_required
@store_required(min_role='staff')
def list_size_charts(store_id):
    """
    Lists size charts belonging to the store.
    Staff, admin, and owner can view size charts.
    """
    try:
        charts = SizeChart.query.filter_by(store_id=g.current_store.id).order_by(SizeChart.created_at.desc()).all()
        result = []
        for c in charts:
            d = c.to_dict(include_measurements=True)
            d['active_products_count'] = Product.query.filter_by(size_chart_id=c.id, status='active').count()
            d['total_products_count'] = Product.query.filter_by(size_chart_id=c.id).count()
            result.append(d)

        return jsonify({'size_charts': result, 'total': len(result)}), 200
    except Exception as e:
        log_error(e, f"Error listing size charts for store {store_id}")
        return jsonify({'error': str(e)}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/size-charts', methods=['POST'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def create_size_chart(store_id):
    """
    Creates a new size chart with measurement rows.
    Requires admin or owner role. Protected by session-bound CSRF.
    """
    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON request payload'}), 400

    unsupported = set(data.keys()) - ALLOWED_SIZE_CHART_FIELDS
    if unsupported:
        return jsonify({'error': f"Unsupported field(s) in payload: {', '.join(sorted(unsupported))}"}), 400

    name = str(data.get('name') or '').strip()
    if not name:
        return jsonify({'error': "Field 'name' is required"}), 400
    if len(name) > 150:
        return jsonify({'error': "Field 'name' exceeds 150 characters"}), 400

    garment_category = str(data.get('garment_category') or '').strip()
    if not garment_category:
        return jsonify({'error': "Field 'garment_category' is required"}), 400
    if len(garment_category) > 50:
        return jsonify({'error': "Field 'garment_category' exceeds 50 characters"}), 400

    chart_type = str(data.get('chart_type') or 'garment_dimensions').strip().lower()
    if chart_type not in ALLOWED_CHART_TYPES:
        return jsonify({'error': f"Invalid chart_type. Allowed: {', '.join(sorted(ALLOWED_CHART_TYPES))}"}), 400

    convention = str(data.get('measurement_convention') or 'flat_garment').strip().lower()
    if convention not in ALLOWED_CONVENTIONS:
        return jsonify({'error': f"Invalid measurement_convention. Allowed: {', '.join(sorted(ALLOWED_CONVENTIONS))}"}), 400

    unit = str(data.get('unit') or 'cm').strip().lower()
    if unit not in ALLOWED_UNITS:
        return jsonify({'error': f"Invalid unit. Allowed: {', '.join(sorted(ALLOWED_UNITS))}"}), 400

    # Validate measurement rows
    measurements_input = data.get('measurements', [])
    if not isinstance(measurements_input, list):
        return jsonify({'error': "Field 'measurements' must be an array of measurement objects"}), 400

    validated_measurements = []
    seen_sizes = set()

    for idx, m_item in enumerate(measurements_input):
        cleaned_m, err = validate_measurement_row(m_item, idx)
        if err:
            return jsonify({'error': err}), 400

        size_key = cleaned_m['size'].lower()
        if size_key in seen_sizes:
            return jsonify({'error': f"Duplicate size '{cleaned_m['size']}' in measurements list"}), 400
        seen_sizes.add(size_key)
        validated_measurements.append(cleaned_m)

    try:
        chart = SizeChart(
            store_id=g.current_store.id,
            name=name,
            garment_category=garment_category,
            chart_type=chart_type,
            measurement_convention=convention,
            unit=unit,
            version=1
        )
        db.session.add(chart)
        db.session.flush()

        for m_data in validated_measurements:
            gm = GarmentMeasurement(
                size_chart_id=chart.id,
                **m_data
            )
            db.session.add(gm)

        db.session.commit()
        log_user_action("create_size_chart", current_user.id, f"Size chart {chart.id} created in store {g.current_store.id}")
        return jsonify({
            'message': 'Size chart created successfully',
            'size_chart': chart.to_dict(include_measurements=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error creating size chart in store {store_id}")
        return jsonify({'error': f"Failed to create size chart: {str(e)}"}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/size-charts/<int:chart_id>', methods=['GET'])
@login_required
@store_required(min_role='staff')
def get_size_chart(store_id, chart_id):
    """
    Returns single size chart with its measurements.
    Scoped strictly to the authorized store (returns 404 for inaccessible charts).
    """
    chart = SizeChart.query.filter_by(id=chart_id, store_id=g.current_store.id).first()
    if not chart:
        return jsonify({'error': 'Size chart not found'}), 404

    res = chart.to_dict(include_measurements=True)
    res['active_products_count'] = Product.query.filter_by(size_chart_id=chart.id, status='active').count()
    res['total_products_count'] = Product.query.filter_by(size_chart_id=chart.id).count()

    return jsonify({'size_chart': res}), 200


@product_bp.route('/v1/merchant/stores/<int:store_id>/size-charts/<int:chart_id>', methods=['PUT'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def update_size_chart(store_id, chart_id):
    """
    Updates a size chart. Requires admin or owner role.
    If the size chart is referenced by active products, modifying measurements
    or sizing conventions is rejected with HTTP 409 Conflict to preserve sizing integrity.
    """
    chart = SizeChart.query.filter_by(id=chart_id, store_id=g.current_store.id).first()
    if not chart:
        return jsonify({'error': 'Size chart not found'}), 404

    data = request.get_json()
    if not data or not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON request payload'}), 400

    unsupported = set(data.keys()) - ALLOWED_SIZE_CHART_FIELDS
    if unsupported:
        return jsonify({'error': f"Unsupported field(s) in payload: {', '.join(sorted(unsupported))}"}), 400

    active_products_count = Product.query.filter_by(size_chart_id=chart.id, status='active').count()

    # If referenced by active products, check for measurement or convention alterations
    modifies_sizing = any(k in data for k in ('measurements', 'measurement_convention', 'chart_type', 'unit', 'garment_category'))
    if active_products_count > 0 and modifies_sizing:
        return jsonify({
            'error': 'Size chart is referenced by active products. Modifying measurements or sizing conventions on an active chart is prohibited to preserve sizing integrity.',
            'action_required': 'Create a new size chart or explicit chart version, or unlink/archive active products before editing.',
            'active_products_count': active_products_count
        }), 409

    if 'name' in data:
        name = str(data['name'] or '').strip()
        if not name:
            return jsonify({'error': "Field 'name' cannot be empty"}), 400
        if len(name) > 150:
            return jsonify({'error': "Field 'name' exceeds 150 characters"}), 400
        chart.name = name

    if 'garment_category' in data:
        cat = str(data['garment_category'] or '').strip()
        if not cat:
            return jsonify({'error': "Field 'garment_category' cannot be empty"}), 400
        if len(cat) > 50:
            return jsonify({'error': "Field 'garment_category' exceeds 50 characters"}), 400
        chart.garment_category = cat

    if 'chart_type' in data:
        ct = str(data['chart_type'] or '').strip().lower()
        if ct not in ALLOWED_CHART_TYPES:
            return jsonify({'error': f"Invalid chart_type. Allowed: {', '.join(sorted(ALLOWED_CHART_TYPES))}"}), 400
        chart.chart_type = ct

    if 'measurement_convention' in data:
        conv = str(data['measurement_convention'] or '').strip().lower()
        if conv not in ALLOWED_CONVENTIONS:
            return jsonify({'error': f"Invalid measurement_convention. Allowed: {', '.join(sorted(ALLOWED_CONVENTIONS))}"}), 400
        chart.measurement_convention = conv

    if 'unit' in data:
        u = str(data['unit'] or '').strip().lower()
        if u not in ALLOWED_UNITS:
            return jsonify({'error': f"Invalid unit. Allowed: {', '.join(sorted(ALLOWED_UNITS))}"}), 400
        chart.unit = u

    # Replace measurements if provided (only when not referenced by active products)
    if 'measurements' in data:
        measurements_input = data['measurements']
        if not isinstance(measurements_input, list):
            return jsonify({'error': "Field 'measurements' must be an array of measurement objects"}), 400

        validated_measurements = []
        seen_sizes = set()
        for idx, m_item in enumerate(measurements_input):
            cleaned_m, err = validate_measurement_row(m_item, idx)
            if err:
                return jsonify({'error': err}), 400
            size_key = cleaned_m['size'].lower()
            if size_key in seen_sizes:
                return jsonify({'error': f"Duplicate size '{cleaned_m['size']}' in measurements list"}), 400
            seen_sizes.add(size_key)
            validated_measurements.append(cleaned_m)

        # Clear existing measurements and insert updated ones
        GarmentMeasurement.query.filter_by(size_chart_id=chart.id).delete()
        for m_data in validated_measurements:
            gm = GarmentMeasurement(size_chart_id=chart.id, **m_data)
            db.session.add(gm)

        chart.version += 1

    try:
        db.session.commit()
        log_user_action("update_size_chart", current_user.id, f"Size chart {chart.id} updated in store {g.current_store.id}")
        return jsonify({
            'message': 'Size chart updated successfully',
            'size_chart': chart.to_dict(include_measurements=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error updating size chart {chart_id}")
        return jsonify({'error': f"Failed to update size chart: {str(e)}"}), 500


@product_bp.route('/v1/merchant/stores/<int:store_id>/size-charts/<int:chart_id>', methods=['DELETE'])
@login_required
@store_required(min_role='admin')
@csrf_protect
def delete_size_chart(store_id, chart_id):
    """
    Deletes a size chart. Requires admin or owner role.
    If referenced by ANY products, rejects with HTTP 409 Conflict
    to honor database RESTRICT constraints and avoid orphaned product sizing.
    """
    chart = SizeChart.query.filter_by(id=chart_id, store_id=g.current_store.id).first()
    if not chart:
        return jsonify({'error': 'Size chart not found'}), 404

    referenced_count = Product.query.filter_by(size_chart_id=chart.id).count()
    if referenced_count > 0:
        return jsonify({
            'error': 'Cannot delete size chart: it is referenced by existing products.',
            'action_required': 'Unlink or reassign this size chart on all referencing products before deleting.',
            'referenced_products_count': referenced_count
        }), 409

    try:
        db.session.delete(chart)
        db.session.commit()
        log_user_action("delete_size_chart", current_user.id, f"Size chart {chart_id} deleted from store {g.current_store.id}")
        return jsonify({'message': 'Size chart deleted successfully', 'id': chart_id}), 200
    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error deleting size chart {chart_id}")
        return jsonify({'error': f"Failed to delete size chart: {str(e)}"}), 500


# ==========================================
# PART 7: AUTHENTICATED MERCHANT FIT PREVIEW
# ==========================================

@product_bp.route('/v1/merchant/stores/<int:store_id>/products/<int:product_id>/fit-preview', methods=['POST'])
@login_required
@store_required(min_role='staff')
@csrf_protect
def preview_product_fit(store_id, product_id):
    """
    Authenticated merchant preview endpoint for testing product fit comparisons.
    Permits evaluating draft and active products belonging strictly to the authorized store.
    Staff, admin, and owner roles are authorized to preview.
    Zero DB Persistence: Customer body measurements are NEVER written to the database or audit logs.
    """
    # 1. Request Body Size Limit Enforcement (16 KB)
    content_length = request.content_length
    if content_length and content_length > 16 * 1024:
        return jsonify({
            'error': 'Request body exceeds maximum allowed size of 16384 bytes.',
            'code': 'PAYLOAD_TOO_LARGE'
        }), 413

    if not request.is_json:
        return jsonify({
            'error': 'Request content-type must be application/json.',
            'code': 'INVALID_CONTENT_TYPE'
        }), 415

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            'error': 'Request payload must be a valid JSON object.',
            'code': 'INVALID_JSON'
        }), 400

    # 2. Reject Unexpected Top-Level Keys
    allowed_top_keys = {'units', 'measurements'}
    unexpected_top = set(data.keys()) - allowed_top_keys
    if unexpected_top:
        return jsonify({
            'error': f"Unexpected field(s) in payload: {', '.join(sorted(unexpected_top))}",
            'code': 'UNEXPECTED_FIELD'
        }), 400

    # 3. Units Validation
    raw_units = data.get('units', 'cm')
    try:
        norm_units = normalize_unit_str(raw_units)
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'INVALID_UNITS'
        }), 400

    # 4. Measurements Payload Validation
    if 'measurements' not in data:
        return jsonify({
            'error': "Missing required field 'measurements'.",
            'code': 'MISSING_MEASUREMENTS'
        }), 400

    raw_measurements = data['measurements']
    if not isinstance(raw_measurements, dict) or len(raw_measurements) == 0:
        return jsonify({
            'error': "Field 'measurements' must be a non-empty object containing body dimensions.",
            'code': 'INVALID_MEASUREMENTS'
        }), 400

    allowed_meas_keys = {'chest', 'waist', 'hips', 'height'}
    unexpected_meas = set(raw_measurements.keys()) - allowed_meas_keys
    if unexpected_meas:
        return jsonify({
            'error': f"Unsupported measurement key(s): {', '.join(sorted(unexpected_meas))}",
            'code': 'UNSUPPORTED_MEASUREMENT_KEY'
        }), 400

    validated_measurements = {}
    for dim_name, val in raw_measurements.items():
        if val is not None:
            try:
                validated_measurements[dim_name] = validate_physical_number(val, dim_name)
            except ValueError as e:
                return jsonify({
                    'error': str(e),
                    'code': 'INVALID_DIMENSION_VALUE'
                }), 400

    # 5. Product Scoping & Eligibility
    product = Product.query.filter_by(id=product_id, store_id=g.current_store.id).first()
    if not product:
        return jsonify({'error': 'Product not found', 'code': 'PRODUCT_NOT_FOUND'}), 404

    if product.status == 'archived':
        return jsonify({
            'error': 'Archived products cannot be previewed for sizing.',
            'code': 'PRODUCT_ARCHIVED'
        }), 400

    # 6. Handle Incomplete Drafts Gracefully (Actionable 200 responses, never 500 error)
    if not product.size_chart:
        return jsonify({
            'status': 'insufficient_data',
            'product_id': product.id,
            'product_name': product.name,
            'product_status': product.status,
            'category': product.category,
            'measurement_convention': None,
            'units': norm_units,
            'fabric_stretch': product.material_stretch or 'unknown',
            'missing_dimensions': ['size_chart'],
            'variant_comparisons': [],
            'notes': 'This product does not have an assigned size chart. Link a size chart to preview fit comparisons.'
        }), 200

    if not product.variants or len(product.variants) == 0:
        return jsonify({
            'status': 'insufficient_data',
            'product_id': product.id,
            'product_name': product.name,
            'product_status': product.status,
            'category': product.category,
            'measurement_convention': product.size_chart.measurement_convention,
            'units': norm_units,
            'fabric_stretch': product.material_stretch or 'unknown',
            'missing_dimensions': ['variants'],
            'variant_comparisons': [],
            'notes': 'This product does not have any size variants defined. Add variants to preview fit comparisons.'
        }), 200

    # 7. Evaluate Fit via Domain Service (Zero DB Writes)
    try:
        comparison_result = evaluate_product_fit(
            shopper_measurements=validated_measurements,
            shopper_units=norm_units,
            product=product
        )

        response_payload = {
            'status': comparison_result['status'],
            'product_id': product.id,
            'product_name': product.name,
            'product_status': product.status,
            'category': comparison_result.get('category'),
            'measurement_convention': comparison_result.get('measurement_convention'),
            'units': comparison_result.get('units'),
            'fabric_stretch': comparison_result.get('fabric_stretch', 'unknown'),
            'missing_dimensions': comparison_result.get('missing_dimensions', []),
            'variant_comparisons': comparison_result.get('variant_comparisons', []),
            'notes': comparison_result.get('notes'),
        }

        # If required customer measurements are missing, return 422
        if comparison_result['status'] in ('insufficient_data', 'unsupported_category', 'unsupported_measurement_convention'):
            return jsonify(response_payload), 422

        return jsonify(response_payload), 200

    except Exception as e:
        log_error(e, f"Error in merchant fit preview for product {product_id} in store {g.current_store.id}")
        return jsonify({
            'error': 'An internal error occurred during measurement comparison.',
            'code': 'INTERNAL_ERROR'
        }), 500


