"""
Services module for SmartFit backend.
Encapsulates business logic and external integrations (e.g. ML inference).
"""
from app.services.recommendation_service import predict_size, predict_size_with_confidence

__all__ = ['predict_size', 'predict_size_with_confidence']

