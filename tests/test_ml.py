import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.recommendation_service import predict_size
from app.ml.ml_model import predict_size as legacy_predict_size


class TestMLModel(unittest.TestCase):
    def test_predict_standard_sizes(self):
        """Тест за валидност на предсказанията за стандартни размери"""
        cases = [
            # Дребен ръст и мерки -> очакваме XS или S
            {'height': 158, 'weight': 48, 'waist': 61, 'chest': 79, 'garment_width': 42, 'gender': 'female', 'body_type': 'slim', 'material': 'elastic', 'garment_type': 't-shirt'},
            # Среден ръст и мерки -> очакваме M
            {'height': 175, 'weight': 74, 'waist': 82, 'chest': 98, 'garment_width': 52, 'gender': 'male', 'body_type': 'average', 'material': 'semi-elastic', 'garment_type': 'shirt'},
            # Едър ръст и мерки -> очакваме L или XL
            {'height': 188, 'weight': 105, 'waist': 102, 'chest': 118, 'garment_width': 62, 'gender': 'male', 'body_type': 'large', 'material': 'non-elastic', 'garment_type': 'jacket'}
        ]

        valid_sizes = {'XS', 'S', 'M', 'L', 'XL'}
        for case in cases:
            # Тест през основния service слой
            pred_size, confidence, alt_size, alt_conf = predict_size(case)
            self.assertIn(pred_size, valid_sizes)
            self.assertGreater(confidence, 0.0)
            self.assertLessEqual(confidence, 1.0)
            if alt_size:
                self.assertIn(alt_size, valid_sizes)
                self.assertGreater(alt_conf, 0.0)

            # Тест през legacy ml_model bridge
            leg_pred, leg_conf, _, _ = legacy_predict_size(case)
            self.assertEqual(pred_size, leg_pred)
            self.assertEqual(confidence, leg_conf)

    def test_predict_graceful_fallback_missing_width(self):
        """Тест че липсата на ширина на дрехата се попълва автоматично с разумна стойност без срив"""
        incomplete_case = {
            'height': 170,
            'weight': 68,
            'waist': 76,
            'chest': 92,
            # 'garment_width' липсва умишлено
            'gender': 'female',
            'body_type': 'medium', # Тест на синоним
            'material': 'elastic',
            'garment_type': 'dress'
        }
        pred_size, confidence, _, _ = predict_size(incomplete_case)
        self.assertIn(pred_size, {'XS', 'S', 'M', 'L', 'XL'})
        self.assertGreater(confidence, 0.5)


if __name__ == '__main__':
    unittest.main()
