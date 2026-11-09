"""
Storefront API Routes (Phase 3E-B)

Public, tenant-scoped storefront fit comparison API.
Exposes factual dimensional comparisons for active products without exposing
unpublished draft or archived catalog items.

Privacy & Security Principles:
1. Zero Data Persistence: Shopper body measurements are NEVER written to the database,
   audit logs, analytics events, or recommendation history.
2. Generic Error Logging: Logs record only high-level status without body measurements.
3. Feature Flag Controlled: Public exposure controlled by STOREFRONT_API_ENABLED config flag
   (disabled by default in production unless explicitly enabled).
4. Strict Payload Validation: Validates JSON type, request size, supported units, and rejects
   unexpected fields, negative values, NaNs, and infinities.
5. Non-Prescriptive Factual Comparisons: Communicates factual dimensional differences;
   does NOT select a best size or compute fit probabilities.
"""

from typing import Set
from flask import Blueprint, request, jsonify, current_app
from app.models import Store, Product
from app.services.product_recommendation_service import (
    evaluate_product_fit,
    validate_physical_number,
    normalize_unit_str,
)
from app.logging_config import log_error

storefront_bp = Blueprint('storefront_bp', __name__)

ALLOWED_REQUEST_TOP_LEVEL_KEYS: Set[str] = {'units', 'measurements'}
ALLOWED_MEASUREMENT_KEYS: Set[str] = {'chest', 'waist', 'hips', 'height'}
MAX_REQUEST_BODY_BYTES = 16 * 1024  # 16 KB payload ceiling for privacy & DoS mitigation


@storefront_bp.route('/v1/storefront/<string:store_slug>/products/<int:product_id>/fit-comparison', methods=['POST'])
def get_storefront_fit_comparison(store_slug: str, product_id: int):
    """
    Public storefront endpoint for factual product fit comparisons.
    Requires:
    - store_slug: string identifier for merchant store.
    - product_id: integer identifier of an active product belonging strictly to that store.

    Request Payload:
    {
        "units": "cm" | "inch",
        "measurements": {
            "chest": 96.0,
            "waist": 82.0
        }
    }
    """
    # 1. Feature Flag Check: Configuration-controlled public exposure
    # Disabled by default unless explicitly configured (e.g. STOREFRONT_API_ENABLED = True)
    if not current_app.config.get('STOREFRONT_API_ENABLED', False):
        return jsonify({
            'error': 'Storefront API access is currently disabled in this environment.',
            'code': 'STOREFRONT_DISABLED'
        }), 403

    # 2. Request Body Size & JSON Content-Type Enforcement
    content_length = request.content_length
    if content_length and content_length > MAX_REQUEST_BODY_BYTES:
        return jsonify({
            'error': f'Request body exceeds maximum allowed size of {MAX_REQUEST_BODY_BYTES} bytes.',
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

    # 3. Reject Unexpected Top-Level Keys
    unexpected_top_keys = set(data.keys()) - ALLOWED_REQUEST_TOP_LEVEL_KEYS
    if unexpected_top_keys:
        return jsonify({
            'error': f"Unexpected field(s) in payload: {', '.join(sorted(unexpected_top_keys))}",
            'code': 'UNEXPECTED_FIELD'
        }), 400

    # 4. Units Validation
    raw_units = data.get('units', 'cm')
    try:
        norm_units = normalize_unit_str(raw_units)
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'INVALID_UNITS'
        }), 400

    # 5. Measurements Payload Validation
    if 'measurements' not in data:
        return jsonify({
            'error': "Missing required field 'measurements'.",
            'code': 'MISSING_MEASUREMENTS'
        }), 400

    raw_measurements = data['measurements']
    if not isinstance(raw_measurements, dict) or len(raw_measurements) == 0:
        return jsonify({
            'error': "Field 'measurements' must be a non-empty object containing customer dimensions.",
            'code': 'INVALID_MEASUREMENTS'
        }), 400

    # Reject unexpected measurement keys (Data Minimization)
    unexpected_meas_keys = set(raw_measurements.keys()) - ALLOWED_MEASUREMENT_KEYS
    if unexpected_meas_keys:
        return jsonify({
            'error': f"Unsupported measurement key(s): {', '.join(sorted(unexpected_meas_keys))}",
            'code': 'UNSUPPORTED_MEASUREMENT_KEY'
        }), 400

    # Validate physical numbers (reject zero, negative, NaN, infinity)
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

    # 6. Store & Organization Resolution
    store = Store.query.filter_by(slug=store_slug.strip()).first()
    if not store:
        return jsonify({
            'error': 'Store not found',
            'code': 'STORE_NOT_FOUND'
        }), 404

    # Verify store organization eligibility
    if not store.organization:
        return jsonify({
            'error': 'Store organization is inactive or not found.',
            'code': 'ORGANIZATION_INACTIVE'
        }), 404

    # 7. Product Resolution & Tenant Scoping
    product = Product.query.filter_by(id=product_id, store_id=store.id).first()
    if not product:
        return jsonify({
            'error': 'Product not found',
            'code': 'PRODUCT_NOT_FOUND'
        }), 404

    # Reject draft and archived products (do not reveal unpublished details)
    if product.status != 'active':
        return jsonify({
            'error': 'Product is not available for fit comparisons.',
            'code': 'PRODUCT_UNAVAILABLE'
        }), 404

    # Require an assigned valid size chart
    if not product.size_chart_id or not product.size_chart:
        return jsonify({
            'error': 'Product has no valid sizing chart assigned.',
            'code': 'SIZE_CHART_MISSING'
        }), 404

    # Require configured variants
    if not product.variants or len(product.variants) == 0:
        return jsonify({
            'error': 'Product has no configured size variants.',
            'code': 'VARIANTS_MISSING'
        }), 404

    # 8. Execute Factual Evaluation via Domain Service
    # Shopper body measurements are NEVER persisted to the database.
    try:
        comparison_result = evaluate_product_fit(
            shopper_measurements=validated_measurements,
            shopper_units=norm_units,
            product=product
        )

        # Build Response Contract adhering strictly to Phase 3E-B specifications:
        # Factual dimensional comparisons only; no confidence scores, fit probabilities, or optimal sizes.
        response_payload = {
            'status': comparison_result['status'],
            'product_id': product.id,
            'category': comparison_result.get('category'),
            'measurement_convention': comparison_result.get('measurement_convention'),
            'units': comparison_result.get('units'),
            'fabric_stretch': comparison_result.get('fabric_stretch', 'unknown'),
            'missing_dimensions': comparison_result.get('missing_dimensions', []),
            'variant_comparisons': comparison_result.get('variant_comparisons', []),
            'notes': comparison_result.get('notes'),
        }

        # HTTP Status Mapping:
        # If required customer measurements are missing, return 422 Unprocessable Entity
        if comparison_result['status'] in ('insufficient_data', 'unsupported_category', 'unsupported_measurement_convention'):
            return jsonify(response_payload), 422

        return jsonify(response_payload), 200

    except Exception as e:
        # Log generic error WITHOUT customer body measurements (Privacy Rule)
        log_error(e, f"Error evaluating fit comparison for product {product_id} in store {store.slug}")
        return jsonify({
            'error': 'An internal error occurred during measurement comparison.',
            'code': 'INTERNAL_ERROR'
        }), 500
