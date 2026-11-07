"""
Legacy ML bridge for backwards compatibility.
Delegates to app.services.recommendation_service.
"""

from app.services.recommendation_service import (
    predict_size,
    predict_size_with_confidence,
    translate_to_bg,
    CATEGORY_ALIASES,
    DEFAULT_NUMERICAL,
    MODEL_PATH
)

__all__ = [
    'predict_size',
    'predict_size_with_confidence',
    'translate_to_bg',
    'CATEGORY_ALIASES',
    'DEFAULT_NUMERICAL',
    'MODEL_PATH'
]
