"""
Product Recommendation Service (Phase 3E-A)

Deterministic measurement comparison service for store-scoped products.
Calculates factual dimensional differences between shopper body measurements
and merchant-supplied garment or body specifications.

Core Architectural Principles:
1. Strict Scope: Evaluates ONLY variants belonging to the supplied product.
2. Honest Semantics: Strictly distinguishes flat garment width, 360° garment circumference,
   and target body circumferences.
3. Linear Dimension Isolation: Linear lengths (length, sleeve, inseam) are preserved
   as separate factual attributes and never conflated with circumference ease.
4. Unit Normalization: Standardizes explicitly using 1 inch = 2.54 cm. Rejects ambiguous units.
5. Zero Metric Fabrication: Never defaults missing shopper or garment dimensions.
6. Non-Prescriptive Comparisons: Computes factual differences without inventing comfort thresholds,
   arbitrary ease tolerances, confidence scores, or automatic size recommendations.
"""

from typing import Dict, Any, List, Optional
import math
import logging

logger = logging.getLogger(__name__)

INCH_TO_CM = 2.54

SUPPORTED_UNITS = {
    'cm': 1.0,
    'centimeter': 1.0,
    'centimeters': 1.0,
    'inch': INCH_TO_CM,
    'inches': INCH_TO_CM,
    'in': INCH_TO_CM,
}

SUPPORTED_CONVENTIONS = {
    'flat_garment',
    'garment_circumference',
    'body_circumference',
}

CATEGORY_MAP = {
    'top': 'top',
    'tops': 'top',
    'shirt': 'top',
    'shirts': 'top',
    't-shirt': 'top',
    'tee': 'top',
    'jacket': 'top',
    'jackets': 'top',
    'hoodie': 'top',
    'hoodies': 'top',
    'sweater': 'top',
    'sweaters': 'top',
    'outerwear': 'top',
    'blazer': 'top',
    'blazers': 'top',
    'coat': 'top',
    'coats': 'top',
    'bottom': 'bottom',
    'bottoms': 'bottom',
    'pant': 'bottom',
    'pants': 'bottom',
    'jean': 'bottom',
    'jeans': 'bottom',
    'trouser': 'bottom',
    'trousers': 'bottom',
    'short': 'bottom',
    'shorts': 'bottom',
    'skirt': 'bottom',
    'skirts': 'bottom',
    'dress': 'dress',
    'dresses': 'dress',
    'jumpsuit': 'dress',
    'jumpsuits': 'dress',
}


def normalize_unit_str(unit: Optional[str]) -> str:
    """Validates and standardizes a measurement unit string."""
    if not unit or not isinstance(unit, str):
        raise ValueError(f"Invalid or missing unit: {unit!r}")
    cleaned = unit.strip().lower()
    if cleaned not in SUPPORTED_UNITS:
        raise ValueError(f"Unsupported measurement unit: {unit!r}. Supported units: cm, inch")
    return cleaned


def validate_physical_number(val: Any, dimension_name: str) -> float:
    """
    Validates a positive, finite physical dimension.
    Rejects zero, negative values, NaN, and infinity.
    """
    if val is None:
        raise ValueError(f"Missing required dimension '{dimension_name}'")
    try:
        fval = float(val)
    except (ValueError, TypeError):
        raise ValueError(f"Measurement '{dimension_name}' must be numeric, got {type(val).__name__}: {val!r}")

    if math.isnan(fval) or math.isinf(fval):
        raise ValueError(f"Measurement '{dimension_name}' must be a finite real number, got {val!r}")
    if fval <= 0.0:
        raise ValueError(f"Measurement '{dimension_name}' must be strictly positive (> 0), got {fval}")

    return fval


def to_cm(val: Optional[float], unit_str: str) -> Optional[float]:
    """Converts a valid dimension to centimeters."""
    if val is None:
        return None
    factor = SUPPORTED_UNITS[normalize_unit_str(unit_str)]
    return round(val * factor, 2)


def from_cm(val_cm: Optional[float], target_unit_str: str) -> Optional[float]:
    """Converts a centimeter dimension to target unit."""
    if val_cm is None:
        return None
    factor = SUPPORTED_UNITS[normalize_unit_str(target_unit_str)]
    return round(val_cm / factor, 2)


def classify_category(category_raw: Optional[str]) -> Optional[str]:
    """Classifies a category string into a standardized domain type."""
    if not category_raw or not isinstance(category_raw, str):
        return None
    cleaned = category_raw.strip().lower()
    return CATEGORY_MAP.get(cleaned)


def _extract_attr(obj: Any, key: str, default: Any = None) -> Any:
    """Safely extracts attribute from dict or object."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def evaluate_product_fit(
    shopper_measurements: Dict[str, Any],
    shopper_units: str,
    category: Optional[str] = None,
    size_chart: Any = None,
    variants: Optional[List[Any]] = None,
    measurement_convention: Optional[str] = None,
    fabric_stretch: Optional[str] = None,
    product: Any = None,
) -> Dict[str, Any]:
    """
    Evaluates factual measurement comparisons for eligible product variants.

    Returns structured comparison data without fabricating comfort thresholds,
    ranking, fit probabilities, or optimal sizes.
    """
    # If product is supplied, extract defaults
    if product is not None:
        if category is None:
            category = _extract_attr(product, 'category')
        if size_chart is None:
            size_chart = _extract_attr(product, 'size_chart')
        if variants is None:
            variants = _extract_attr(product, 'variants')
        if fabric_stretch is None:
            fabric_stretch = _extract_attr(product, 'material_stretch')

    # 1. Validate Shopper Units
    norm_shopper_unit = normalize_unit_str(shopper_units)

    # 2. Validate Category
    standard_category = classify_category(category)
    if not standard_category:
        return {
            'status': 'unsupported_category',
            'category': category,
            'units': norm_shopper_unit,
            'fabric_stretch': fabric_stretch or 'unknown',
            'missing_dimensions': [],
            'variant_comparisons': [],
            'notes': f"Category '{category}' is unsupported or unrecognized.",
        }

    # 3. Validate Measurement Convention
    chart_convention = measurement_convention
    if not chart_convention and size_chart:
        chart_convention = _extract_attr(size_chart, 'measurement_convention')

    if not chart_convention or chart_convention not in SUPPORTED_CONVENTIONS:
        return {
            'status': 'unsupported_measurement_convention',
            'category': category,
            'measurement_convention': chart_convention,
            'units': norm_shopper_unit,
            'fabric_stretch': fabric_stretch or 'unknown',
            'missing_dimensions': [],
            'variant_comparisons': [],
            'notes': f"Measurement convention '{chart_convention}' is unsupported or missing.",
        }

    # 4. Check for Chart Measurements and Variants
    chart_unit = 'cm'
    raw_measurements = []
    if size_chart:
        chart_unit = normalize_unit_str(_extract_attr(size_chart, 'unit', 'cm'))
        raw_measurements = _extract_attr(size_chart, 'measurements', []) or []

    if not variants or not raw_measurements:
        return {
            'status': 'insufficient_data',
            'category': category,
            'measurement_convention': chart_convention,
            'units': norm_shopper_unit,
            'fabric_stretch': fabric_stretch or 'unknown',
            'missing_dimensions': ['variants' if not variants else 'size_chart_measurements'],
            'variant_comparisons': [],
            'notes': 'Product has no configured variants or size chart measurement rows.',
        }

    # 5. Validate Shopper Measurements
    shopper_cm: Dict[str, float] = {}
    for dim_name in ('chest', 'waist', 'hips', 'height'):
        if dim_name in shopper_measurements and shopper_measurements[dim_name] is not None:
            raw_val = shopper_measurements[dim_name]
            validated_val = validate_physical_number(raw_val, dim_name)
            shopper_cm[dim_name] = to_cm(validated_val, norm_shopper_unit)

    # 6. Check Required Dimensions for Category
    missing_required = []
    if standard_category in ('top', 'dress'):
        if 'chest' not in shopper_cm:
            missing_required.append('chest')
    elif standard_category == 'bottom':
        if 'waist' not in shopper_cm and 'hips' not in shopper_cm:
            missing_required.append('waist or hips')

    if missing_required:
        return {
            'status': 'insufficient_data',
            'category': category,
            'measurement_convention': chart_convention,
            'units': norm_shopper_unit,
            'fabric_stretch': fabric_stretch or 'unknown',
            'missing_dimensions': missing_required,
            'variant_comparisons': [],
            'notes': f"Required customer measurement(s) missing: {', '.join(missing_required)}.",
        }

    # 7. Index Chart Rows by Size Identifier (Preserving exact size string)
    chart_by_size = {}
    for m in raw_measurements:
        m_size = _extract_attr(m, 'size')
        if m_size:
            chart_by_size[str(m_size).strip()] = m

    # 8. Evaluate Eligible Variants Belonging to this Product
    variant_comparisons = []
    at_least_one_comparison_made = False

    for variant in variants:
        v_size_str = str(_extract_attr(variant, 'size', '')).strip()
        if not v_size_str:
            continue

        v_comp: Dict[str, Any] = {
            'size': v_size_str,
            'circumference_comparisons': {},
            'linear_dimensions': {},
            'missing_chart_dimensions': [],
        }

        if v_size_str not in chart_by_size:
            v_comp['missing_chart_dimensions'].append('entire_size_specification')
            variant_comparisons.append(v_comp)
            continue

        m_row = chart_by_size[v_size_str]

        # A. Linear dimensions (kept strictly isolated from ease)
        for linear_dim in ('total_length', 'sleeve_length', 'inseam_length', 'shoulder_width'):
            raw_len = _extract_attr(m_row, linear_dim)
            if raw_len is not None:
                val_cm = to_cm(validate_physical_number(raw_len, linear_dim), chart_unit)
                v_comp['linear_dimensions'][linear_dim] = from_cm(val_cm, norm_shopper_unit)
            else:
                v_comp['linear_dimensions'][linear_dim] = None

        # B. Circumference comparisons according to convention
        # Check primary relevant dimensions: chest, waist, hips
        dim_targets = []
        if standard_category in ('top', 'dress'):
            dim_targets.append('chest')
            if 'waist' in shopper_cm:
                dim_targets.append('waist')
        elif standard_category == 'bottom':
            if 'waist' in shopper_cm:
                dim_targets.append('waist')
            if 'hips' in shopper_cm:
                dim_targets.append('hips')

        for dim in dim_targets:
            shopper_val_cm = shopper_cm.get(dim)
            if shopper_val_cm is None:
                continue

            garment_val_cm = None
            is_approx = False
            comparison_type = ''

            if chart_convention == 'flat_garment':
                raw_flat = _extract_attr(m_row, f'flat_{dim}_width')
                if raw_flat is not None:
                    flat_cm = to_cm(validate_physical_number(raw_flat, f'flat_{dim}_width'), chart_unit)
                    garment_val_cm = round(flat_cm * 2.0, 2)
                    is_approx = True
                    comparison_type = 'estimated_garment_ease'
                else:
                    v_comp['missing_chart_dimensions'].append(f'flat_{dim}_width')

            elif chart_convention == 'garment_circumference':
                raw_circ = _extract_attr(m_row, f'garment_{dim}_circumference')
                if raw_circ is not None:
                    garment_val_cm = to_cm(validate_physical_number(raw_circ, f'garment_{dim}_circumference'), chart_unit)
                    is_approx = False
                    comparison_type = 'garment_ease'
                else:
                    v_comp['missing_chart_dimensions'].append(f'garment_{dim}_circumference')

            elif chart_convention == 'body_circumference':
                raw_body = _extract_attr(m_row, f'body_{dim}_circumference')
                if raw_body is not None:
                    garment_val_cm = to_cm(validate_physical_number(raw_body, f'body_{dim}_circumference'), chart_unit)
                    is_approx = False
                    comparison_type = 'body_target_difference'
                else:
                    v_comp['missing_chart_dimensions'].append(f'body_{dim}_circumference')

            if garment_val_cm is not None:
                diff_cm = round(garment_val_cm - shopper_val_cm, 2)
                shopper_display = from_cm(shopper_val_cm, norm_shopper_unit)
                garment_display = from_cm(garment_val_cm, norm_shopper_unit)
                diff_display = from_cm(diff_cm, norm_shopper_unit)

                v_comp['circumference_comparisons'][dim] = {
                    'shopper_measurement': shopper_display,
                    'garment_specification': garment_display,
                    'difference': diff_display,
                    'unit': norm_shopper_unit,
                    'comparison_type': comparison_type,
                    'is_approximation': is_approx,
                }
                at_least_one_comparison_made = True

        variant_comparisons.append(v_comp)

    # 9. Determine Status
    if not at_least_one_comparison_made:
        return {
            'status': 'insufficient_data',
            'category': category,
            'measurement_convention': chart_convention,
            'units': norm_shopper_unit,
            'fabric_stretch': fabric_stretch or 'unknown',
            'missing_dimensions': ['garment_matching_dimensions'],
            'variant_comparisons': variant_comparisons,
            'notes': 'Size chart lacks compatible dimensional specifications for the eligible variants.',
        }

    # Per Part 5: "If numerical comparisons exist but no validated fit-selection policy exists,
    # return fit_rules_required with the available comparisons, rather than falsely selecting a best size."
    return {
        'status': 'fit_rules_required',
        'category': category,
        'measurement_convention': chart_convention,
        'units': norm_shopper_unit,
        'fabric_stretch': fabric_stretch or 'unknown',
        'missing_dimensions': [],
        'variant_comparisons': variant_comparisons,
        'notes': (
            'Factual measurement comparisons calculated. Sizing selection policy required '
            'before an optimal size can be determined.'
        ),
    }
