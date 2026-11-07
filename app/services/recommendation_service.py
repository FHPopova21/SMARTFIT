"""
Recommendation Service (Runtime ML Inference):
Отговаря за онлайн инференса при клиентски заявки:
- Зарежда предварително населения и калибриран модел от ml_pipeline/models/smartfit_model.pkl.
- Валидира и нормализира входните данни (алиаси, липсващи числови стойности).
- Връща най-вероятния размер и алтернативен размер с надеждни вероятности.
"""

import os
import logging
import traceback
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Път към моделния артефакт в ml_pipeline/models/
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..', '..'))

PRIMARY_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_pipeline', 'models', 'smartfit_model.pkl')
LEGACY_MODEL_PATH = os.path.join(PROJECT_ROOT, 'app', 'ml', 'model.pkl')

MODEL_PATH = os.environ.get('SMARTFIT_MODEL_PATH')
if not MODEL_PATH or not os.path.exists(MODEL_PATH):
    if os.path.exists(PRIMARY_MODEL_PATH):
        MODEL_PATH = PRIMARY_MODEL_PATH
    elif os.path.exists(LEGACY_MODEL_PATH):
        MODEL_PATH = LEGACY_MODEL_PATH
    else:
        MODEL_PATH = PRIMARY_MODEL_PATH

# Кеширан контейнер за заредения модел
_MODEL_CACHE = None


def _load_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    if not os.path.exists(MODEL_PATH):
        logger.error("Моделният артефакт не е намерен на %s", MODEL_PATH)
        raise FileNotFoundError(f"ML моделът липсва: {MODEL_PATH}. Изпълнете ml_pipeline/pipeline.py.")

    try:
        model_data = joblib.load(MODEL_PATH)
        _MODEL_CACHE = {
            'model': model_data['model'],
            'scaler': model_data['scaler'],
            'label_encoders': model_data['label_encoders'],
            'numerical_features': model_data.get('numerical_features', ['height', 'weight', 'waist', 'chest', 'garment_width']),
            'categorical_features': model_data.get('categorical_features', ['gender', 'body_type', 'material', 'garment_type']),
            'classes': model_data.get('classes', list(model_data['model'].classes_))
        }
        logger.info("✅ SmartFit ML моделът е успешно зареден от: %s", MODEL_PATH)
        return _MODEL_CACHE
    except Exception as e:
        logger.error("Грешка при зареждане на ML модела: %s", str(e))
        raise


# Стойности по подразбиране за числовите признаци
DEFAULT_NUMERICAL = {
    'height': 170.0,
    'weight': 70.0,
    'waist': 78.0,
    'chest': 93.0,
    'garment_width': 50.0
}

# Синоними и съответствия за категорийни полета
CATEGORY_ALIASES = {
    'body_type': {
        'medium': 'average',
        'normal': 'average',
        'athletic': 'average',
        'plus-size': 'large',
        'skinny': 'slim'
    },
    'material': {
        'stretchy': 'elastic',
        'rigid': 'non-elastic',
        'stretch': 'elastic',
        'cotton': 'semi-elastic'
    },
    'garment_type': {
        'tshirt': 't-shirt',
        'tee': 't-shirt',
        'jeans': 'pants',
        'trousers': 'pants',
        'hoodie': 'sweater',
        'coat': 'jacket'
    }
}

EN_TO_BG = {
    "height": "височина",
    "weight": "тегло",
    "waist": "талия",
    "chest": "гръдна_обиколка",
    "garment_width": "ширина_дреха",
    "gender": "пол",
    "body_type": "телосложение",
    "material": "материя",
    "garment_type": "тип_дреха"
}


def translate_to_bg(data: dict) -> dict:
    return {EN_TO_BG.get(k, k): v for k, v in data.items()}


def predict_size(data: dict):
    """
    Основна функция за предсказване на размер дреха.
    Приема речник с мерки и характеристики и връща:
    (главен_размер, увереност, алтернативен_размер, алтернативна_увереност)
    """
    cached = _load_model()
    model = cached['model']
    scaler = cached['scaler']
    label_encoders = cached['label_encoders']
    numerical_features = cached['numerical_features']
    categorical_features = cached['categorical_features']

    try:
        # Нормализация на имената на ключовете
        field_mapping = {
            'clothing_width': 'garment_width',
            'clothing_type': 'garment_type',
            'bodyType': 'body_type'
        }

        normalized_data = {}
        for key, value in data.items():
            norm_key = field_mapping.get(key, key)
            normalized_data[norm_key] = value

        # 1. Подготовка на числовите признаци
        num_vals = []
        for feature in numerical_features:
            val = normalized_data.get(feature)
            if val is not None and str(val).strip() != '':
                try:
                    num_vals.append(float(val))
                except (ValueError, TypeError):
                    num_vals.append(DEFAULT_NUMERICAL.get(feature, 50.0))
            else:
                num_vals.append(DEFAULT_NUMERICAL.get(feature, 50.0))
                logger.debug("Missing numerical feature '%s', using default: %s", feature, num_vals[-1])

        num_df = pd.DataFrame([num_vals], columns=numerical_features)
        numerical_scaled = scaler.transform(num_df)

        # 2. Подготовка на категорийните признаци
        cat_vals = []
        for feature in categorical_features:
            val = str(normalized_data.get(feature, '')).lower().strip()
            if feature in CATEGORY_ALIASES and val in CATEGORY_ALIASES[feature]:
                val = CATEGORY_ALIASES[feature][val]

            le = label_encoders.get(feature)
            if le is not None:
                if val in le.classes_:
                    encoded = le.transform([val])[0]
                else:
                    fallback = le.classes_[0]
                    logger.debug("Unseen value '%s' for '%s', falling back to '%s'", val, feature, fallback)
                    encoded = le.transform([fallback])[0]
                cat_vals.append(encoded)
            else:
                cat_vals.append(0)

        # Комбиниране на признаците
        X = np.column_stack([numerical_scaled, np.array([cat_vals])])

        # Предсказване с калибрирани вероятности
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        confidence = float(probabilities.max())

        # Алтернативен размер при несигурност (< 85%)
        alternative_size = None
        alternative_confidence = None

        if confidence < 0.85:
            sorted_indices = np.argsort(probabilities)[::-1]
            if len(sorted_indices) > 1:
                second_idx = sorted_indices[1]
                alternative_size = str(model.classes_[second_idx])
                alternative_confidence = float(probabilities[second_idx])

        logger.info("Predicted: %s (%.1f%%) | Alternative: %s", prediction, confidence * 100, alternative_size)
        return str(prediction), confidence, alternative_size, alternative_confidence

    except Exception as e:
        logger.error("Error in predict_size: %s\n%s", str(e), traceback.format_exc())
        raise


def predict_size_with_confidence(measurements: dict):
    return predict_size(measurements)

