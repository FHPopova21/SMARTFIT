"""
Unit Tests for Phase 3E-A: Product-Specific Fit Evaluation Service
Verifies deterministic measurement comparisons, unit conversions, data quality rejections,
custom size handling, and non-prescriptive result contracts.
"""

import unittest
from types import SimpleNamespace
from app.services.product_recommendation_service import (
    evaluate_product_fit,
    validate_physical_number,
    to_cm,
    from_cm,
    normalize_unit_str,
    classify_category,
)


def make_mock_row(
    size: str,
    flat_chest_width=None,
    garment_chest_circumference=None,
    body_chest_circumference=None,
    flat_waist_width=None,
    garment_waist_circumference=None,
    body_waist_circumference=None,
    flat_hip_width=None,
    garment_hip_circumference=None,
    body_hip_circumference=None,
    total_length=None,
    sleeve_length=None,
    inseam_length=None,
    shoulder_width=None,
):
    """Helper creating a mock size chart measurement row."""
    return SimpleNamespace(
        size=size,
        flat_chest_width=flat_chest_width,
        garment_chest_circumference=garment_chest_circumference,
        body_chest_circumference=body_chest_circumference,
        flat_waist_width=flat_waist_width,
        garment_waist_circumference=garment_waist_circumference,
        body_waist_circumference=body_waist_circumference,
        flat_hip_width=flat_hip_width,
        garment_hip_circumference=garment_hip_circumference,
        body_hip_circumference=body_hip_circumference,
        total_length=total_length,
        sleeve_length=sleeve_length,
        inseam_length=inseam_length,
        shoulder_width=shoulder_width,
    )


class TestProductRecommendationService(unittest.TestCase):
    # -------------------------------------------------------------
    # 1. Garment Circumference Comparison
    # -------------------------------------------------------------
    def test_01_garment_circumference_comparison(self):
        rows = [make_mock_row('M', garment_chest_circumference=104.0, total_length=72.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        comp = res['variant_comparisons'][0]['circumference_comparisons']['chest']
        self.assertEqual(comp['shopper_measurement'], 98.0)
        self.assertEqual(comp['garment_specification'], 104.0)
        self.assertEqual(comp['difference'], 6.0)
        self.assertEqual(comp['comparison_type'], 'garment_ease')
        self.assertFalse(comp['is_approximation'])

    # -------------------------------------------------------------
    # 2. Flat Garment Width Conversion
    # -------------------------------------------------------------
    def test_02_flat_garment_width_conversion(self):
        # Flat chest width = 52.0 cm -> estimated perimeter = 104.0 cm
        rows = [make_mock_row('L', flat_chest_width=52.0, total_length=74.0)]
        variants = [SimpleNamespace(size='L')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 100.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        comp = res['variant_comparisons'][0]['circumference_comparisons']['chest']
        self.assertEqual(comp['shopper_measurement'], 100.0)
        self.assertEqual(comp['garment_specification'], 104.0)
        self.assertEqual(comp['difference'], 4.0)
        self.assertEqual(comp['comparison_type'], 'estimated_garment_ease')
        self.assertTrue(comp['is_approximation'])

    # -------------------------------------------------------------
    # 3. Body Measurement Target Comparison
    # -------------------------------------------------------------
    def test_03_body_measurement_target_comparison(self):
        # Target body chest = 96.0 cm
        rows = [make_mock_row('M', body_chest_circumference=96.0, total_length=71.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='body_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 95.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        comp = res['variant_comparisons'][0]['circumference_comparisons']['chest']
        self.assertEqual(comp['shopper_measurement'], 95.0)
        self.assertEqual(comp['garment_specification'], 96.0)
        self.assertEqual(comp['difference'], 1.0)
        # Must be labeled body target difference, NOT garment ease
        self.assertEqual(comp['comparison_type'], 'body_target_difference')
        self.assertFalse(comp['is_approximation'])

    # -------------------------------------------------------------
    # 4. CM / Inch Conversion
    # -------------------------------------------------------------
    def test_04_cm_inch_conversion(self):
        # 1 inch = 2.54 cm
        # Chart in cm: flat width 50.8 cm -> 101.6 cm perimeter (40.0 inches)
        rows = [make_mock_row('M', flat_chest_width=50.8)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        # Shopper specifies 38.0 inches
        res = evaluate_product_fit(
            shopper_measurements={'chest': 38.0},
            shopper_units='inch',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        self.assertEqual(res['units'], 'inch')
        comp = res['variant_comparisons'][0]['circumference_comparisons']['chest']
        self.assertEqual(comp['shopper_measurement'], 38.0)
        self.assertEqual(comp['garment_specification'], 40.0)
        self.assertEqual(comp['difference'], 2.0)
        self.assertEqual(comp['unit'], 'inch')

    # -------------------------------------------------------------
    # 5. Missing Shopper Chest Measurement
    # -------------------------------------------------------------
    def test_05_missing_shopper_chest_measurement(self):
        rows = [make_mock_row('M', flat_chest_width=52.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        # Shopper only provides waist, omitting required chest for Tops
        res = evaluate_product_fit(
            shopper_measurements={'waist': 80.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'insufficient_data')
        self.assertIn('chest', res['missing_dimensions'])
        self.assertEqual(len(res['variant_comparisons']), 0)

    # -------------------------------------------------------------
    # 6. Missing Garment Dimensions
    # -------------------------------------------------------------
    def test_06_missing_garment_dimensions(self):
        # Size row exists, but flat_chest_width is missing (None)
        rows = [make_mock_row('S', flat_chest_width=None, total_length=68.0)]
        variants = [SimpleNamespace(size='S')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 90.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'insufficient_data')
        self.assertIn('flat_chest_width', res['variant_comparisons'][0]['missing_chart_dimensions'])

    # -------------------------------------------------------------
    # 7. Zero and Negative Measurements Rejection
    # -------------------------------------------------------------
    def test_07_zero_and_negative_measurements(self):
        with self.assertRaises(ValueError):
            validate_physical_number(0.0, 'chest')

        with self.assertRaises(ValueError):
            validate_physical_number(-10.5, 'waist')

        rows = [make_mock_row('M', flat_chest_width=50.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        with self.assertRaises(ValueError):
            evaluate_product_fit(
                shopper_measurements={'chest': -5.0},
                shopper_units='cm',
                category='Tops',
                size_chart=size_chart,
                variants=variants,
            )

    # -------------------------------------------------------------
    # 8. NaN and Infinity Rejection
    # -------------------------------------------------------------
    def test_08_nan_and_infinity_rejection(self):
        with self.assertRaises(ValueError):
            validate_physical_number(float('nan'), 'chest')

        with self.assertRaises(ValueError):
            validate_physical_number(float('inf'), 'chest')

        with self.assertRaises(ValueError):
            validate_physical_number(float('-inf'), 'waist')

    # -------------------------------------------------------------
    # 9. Custom Size Labels
    # -------------------------------------------------------------
    def test_09_custom_size_labels(self):
        custom_sizes = ['XS', 'M', 'XL', 'XXL', '32x34', '38R', 'S/M', 'One Size', 'Petite']
        rows = [
            make_mock_row(sz, garment_chest_circumference=90.0 + idx * 4.0)
            for idx, sz in enumerate(custom_sizes)
        ]
        variants = [SimpleNamespace(size=sz) for sz in custom_sizes]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        returned_sizes = [v['size'] for v in res['variant_comparisons']]
        self.assertEqual(returned_sizes, custom_sizes)

    # -------------------------------------------------------------
    # 10. Unknown Fabric Stretch Metadata
    # -------------------------------------------------------------
    def test_10_unknown_fabric_stretch(self):
        rows = [make_mock_row('M', garment_chest_circumference=100.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 96.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
            fabric_stretch=None,  # Unknown
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        self.assertEqual(res['fabric_stretch'], 'unknown')

    # -------------------------------------------------------------
    # 11. Negative Ease Without False Rejection
    # -------------------------------------------------------------
    def test_11_negative_ease_without_false_rejection(self):
        # Shopper chest = 104 cm, garment perimeter = 100 cm -> ease is -4.0 cm
        rows = [make_mock_row('S', garment_chest_circumference=100.0)]
        variants = [SimpleNamespace(size='S')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 104.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
            fabric_stretch='non_stretch',
        )

        # Factual comparison must be preserved and NOT rejected
        self.assertEqual(res['status'], 'fit_rules_required')
        comp = res['variant_comparisons'][0]['circumference_comparisons']['chest']
        self.assertEqual(comp['difference'], -4.0)

    # -------------------------------------------------------------
    # 12. Multiple Candidate Variant Comparisons
    # -------------------------------------------------------------
    def test_12_multiple_candidate_variant_comparisons(self):
        rows = [
            make_mock_row('S', garment_chest_circumference=96.0),
            make_mock_row('M', garment_chest_circumference=102.0),
            make_mock_row('L', garment_chest_circumference=108.0),
        ]
        variants = [SimpleNamespace(size='S'), SimpleNamespace(size='M'), SimpleNamespace(size='L')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'fit_rules_required')
        self.assertEqual(len(res['variant_comparisons']), 3)
        diffs = [v['circumference_comparisons']['chest']['difference'] for v in res['variant_comparisons']]
        self.assertEqual(diffs, [-2.0, 4.0, 10.0])

    # -------------------------------------------------------------
    # 13. No Fabricated Confidence Score
    # -------------------------------------------------------------
    def test_13_no_fabricated_confidence_score(self):
        rows = [make_mock_row('M', garment_chest_circumference=102.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        # Forbidden fields
        self.assertNotIn('confidence_score', res)
        self.assertNotIn('accuracy_percentage', res)
        self.assertNotIn('predicted_fit_probability', res)

    # -------------------------------------------------------------
    # 14. No Automatic Optimal Size Without Rules
    # -------------------------------------------------------------
    def test_14_no_automatic_optimal_size_without_rules(self):
        rows = [
            make_mock_row('S', garment_chest_circumference=96.0),
            make_mock_row('M', garment_chest_circumference=102.0),
        ]
        variants = [SimpleNamespace(size='S'), SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        # Must NOT invent a recommended_size or pick an optimal size
        self.assertNotIn('recommended_size', res)
        self.assertNotIn('optimal_size', res)
        self.assertNotIn('best_size', res)
        self.assertEqual(res['status'], 'fit_rules_required')

    # -------------------------------------------------------------
    # 15. Linear Measurements Kept Separate
    # -------------------------------------------------------------
    def test_15_linear_measurements_kept_separate(self):
        rows = [
            make_mock_row(
                'M',
                garment_chest_circumference=102.0,
                total_length=72.0,
                sleeve_length=64.0,
                shoulder_width=46.0,
            )
        ]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='garment_circumference', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0, 'height': 180.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        v_comp = res['variant_comparisons'][0]
        # Circumference is compared
        self.assertIn('chest', v_comp['circumference_comparisons'])
        # Linear dimensions are isolated factual values, NOT ease deltas
        linear = v_comp['linear_dimensions']
        self.assertEqual(linear['total_length'], 72.0)
        self.assertEqual(linear['sleeve_length'], 64.0)
        self.assertEqual(linear['shoulder_width'], 46.0)

    # -------------------------------------------------------------
    # 16. Unsupported Measurement Conventions
    # -------------------------------------------------------------
    def test_16_unsupported_measurement_conventions(self):
        rows = [make_mock_row('M', flat_chest_width=50.0)]
        variants = [SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='arbitrary_convention', unit='cm', measurements=rows)

        res = evaluate_product_fit(
            shopper_measurements={'chest': 98.0},
            shopper_units='cm',
            category='Tops',
            size_chart=size_chart,
            variants=variants,
        )

        self.assertEqual(res['status'], 'unsupported_measurement_convention')

    # -------------------------------------------------------------
    # 17. Deterministic Repeated Evaluations
    # -------------------------------------------------------------
    def test_17_deterministic_repeated_evaluations(self):
        rows = [
            make_mock_row('S', flat_chest_width=48.0, total_length=68.0),
            make_mock_row('M', flat_chest_width=52.0, total_length=71.0),
        ]
        variants = [SimpleNamespace(size='S'), SimpleNamespace(size='M')]
        size_chart = SimpleNamespace(measurement_convention='flat_garment', unit='cm', measurements=rows)

        input_data = {
            'shopper_measurements': {'chest': 96.0, 'waist': 80.0},
            'shopper_units': 'cm',
            'category': 'Tops',
            'size_chart': size_chart,
            'variants': variants,
        }

        res_1 = evaluate_product_fit(**input_data)
        res_2 = evaluate_product_fit(**input_data)
        res_3 = evaluate_product_fit(**input_data)

        self.assertEqual(res_1, res_2)
        self.assertEqual(res_2, res_3)


if __name__ == '__main__':
    unittest.main()
