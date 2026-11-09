from flask import Blueprint, jsonify, request
from app.models import db, RecommendationHistory, Clothing, Comment
from flask_login import login_required, current_user
from app.decorators import seller_required
from app.services.recommendation_service import predict_size
from app.logging_config import log_user_action, log_error, log_ai_recommendation, log_performance
import logging
import uuid
from datetime import datetime

clothing_bp = Blueprint('clothing_bp', __name__)
"""
Blueprint за всички маршрути, свързани с дрехи: каталог, препоръки, предсказване на размер и управление на обяви.
"""
logger = logging.getLogger('clothing_bp')

# ==========================================
# 1. ПУБЛИЧЕН КАТАЛОГ С ДРЕХИ (GET)
# ==========================================

@clothing_bp.route('/clothes', methods=['GET'])
def get_all_clothes():
    """
    Връща списък с всички дрехи в каталога.
    Поддържа филтриране по:
    - type: shirt, pants, dress, jacket, sweater, skirt
    - size: XS, S, M, L, XL
    - seller_id
    """
    try:
        clothing_type = request.args.get('type')
        size = request.args.get('size')
        seller_id = request.args.get('seller_id')

        query = Clothing.query
        if clothing_type and clothing_type != 'all':
            query = query.filter_by(type=clothing_type)
        if size and size != 'all':
            query = query.filter_by(size=size)
        if seller_id and seller_id.isdigit():
            query = query.filter_by(seller_id=int(seller_id))

        clothes = query.order_by(Clothing.created_at.desc()).all()
        return jsonify([c.to_dict() for c in clothes]), 200
    except Exception as e:
        log_error(e, "Error fetching clothes catalog")
        return jsonify({'error': str(e)}), 500

@clothing_bp.route('/clothes/<int:clothing_id>', methods=['GET'])
def get_single_clothing(clothing_id):
    """
    Връща детайли за конкретна дреха заедно с коментарите към нея.
    """
    try:
        clothing = db.session.get(Clothing, clothing_id)
        if not clothing:
            return jsonify({'error': 'Дрехата не е намерена'}), 404
        return jsonify(clothing.to_dict()), 200
    except Exception as e:
        log_error(e, f"Error fetching clothing ID {clothing_id}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# 2. УПРАВЛЕНИЕ НА ОБЯВИ ОТ ТЪРГОВЦИ (POST, PUT, DELETE)
# ==========================================

@clothing_bp.route('/seller/clothes', methods=['POST'])
@login_required
@seller_required
def create_clothing():
    """
    Добавяне на нова дреха от продавач.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Липсват данни'}), 400

        required_fields = ['name', 'type', 'material', 'size', 'width', 'length']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({'error': f'Задължителното поле {field} липсва'}), 400

        clothing = Clothing(
            name=data['name'],
            type=data['type'],
            material=data['material'],
            size=data['size'],
            width=float(data['width']),
            length=float(data['length']),
            sleeves=float(data.get('sleeves')) if data.get('sleeves') is not None else None,
            price=float(data.get('price')) if data.get('price') is not None else 0.0,
            description=data.get('description', ''),
            image_url=data.get('image_url', ''),
            seller_id=current_user.id
        )
        db.session.add(clothing)
        db.session.commit()

        log_user_action("create_clothing", current_user.id, f"ID: {clothing.id}, Name: {clothing.name}")
        logger.info(f"Seller {current_user.id} created clothing item: {clothing.name}")
        return jsonify({'message': 'Обявата е създадена успешно', 'clothing': clothing.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        log_error(e, "Error creating clothing listing")
        return jsonify({'error': str(e)}), 500

@clothing_bp.route('/seller/clothes/<int:clothing_id>', methods=['PUT'])
@login_required
@seller_required
def update_clothing(clothing_id):
    """
    Редакция на съществуваща обява от нейния продавач.
    """
    try:
        clothing = db.session.get(Clothing, clothing_id)
        if not clothing:
            return jsonify({'error': 'Обявата не е намерена'}), 404

        if clothing.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Нямате права за редакция на тази обява'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Липсват данни'}), 400

        if 'name' in data: clothing.name = data['name']
        if 'type' in data: clothing.type = data['type']
        if 'material' in data: clothing.material = data['material']
        if 'size' in data: clothing.size = data['size']
        if 'width' in data: clothing.width = float(data['width'])
        if 'length' in data: clothing.length = float(data['length'])
        if 'sleeves' in data: clothing.sleeves = float(data['sleeves']) if data['sleeves'] is not None else None
        if 'price' in data: clothing.price = float(data['price']) if data['price'] is not None else clothing.price
        if 'description' in data: clothing.description = data['description']
        if 'image_url' in data: clothing.image_url = data['image_url']

        db.session.commit()
        log_user_action("update_clothing", current_user.id, f"ID: {clothing.id}")
        return jsonify({'message': 'Обявата е обновена успешно', 'clothing': clothing.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error updating clothing ID {clothing_id}")
        return jsonify({'error': str(e)}), 500

@clothing_bp.route('/seller/clothes/<int:clothing_id>', methods=['DELETE'])
@login_required
@seller_required
def delete_seller_clothing(clothing_id):
    """
    Изтриване на обява от продавача.
    """
    try:
        clothing = db.session.get(Clothing, clothing_id)
        if not clothing:
            return jsonify({'error': 'Обявата не е намерена'}), 404

        if clothing.seller_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Нямате права за изтриване на тази обява'}), 403

        Comment.query.filter_by(clothing_id=clothing_id).delete()
        db.session.delete(clothing)
        db.session.commit()

        log_user_action("delete_clothing", current_user.id, f"ID: {clothing_id}")
        return jsonify({'message': 'Обявата е изтрита успешно'}), 200

    except Exception as e:
        db.session.rollback()
        log_error(e, f"Error deleting clothing ID {clothing_id}")
        return jsonify({'error': str(e)}), 500

# ==========================================
# 3. AI ПРЕПОРЪКИ И ПРЕДСКАЗВАНЕ НА РАЗМЕР
# ==========================================

@clothing_bp.route('/recommendations', methods=['POST'])
@login_required
def save_recommendation():
    try:
        data = request.get_json()
        logger.info(f"Received recommendation data for user: {current_user.id}")
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        if 'measurements' not in data:
            return jsonify({'error': 'Missing measurements data'}), 400

        measurements = data['measurements']
        recommended_size = data.get('recommendedSize')
        if not recommended_size:
            return jsonify({'error': 'Missing recommended size'}), 400

        item_identifier = data.get('itemIdentifier', str(uuid.uuid4()))
        recommendation = RecommendationHistory(
            user_id=current_user.id,
            clothing_type=data.get('clothingType', 'general'),
            recommended_size=recommended_size,
            height=str(measurements.get('height')),
            weight=str(measurements.get('weight')),
            chest=str(measurements.get('chest')),
            waist=str(measurements.get('waist')),
            body_type=measurements.get('body_type'),
            item_identifier=item_identifier
        )
        db.session.add(recommendation)
        db.session.commit()

        log_ai_recommendation(
            current_user.id, 
            item_identifier, 
            measurements, 
            recommended_size
        )
        log_user_action("save_recommendation", current_user.id, f"Size: {recommended_size}")
        return jsonify({
            'message': 'Recommendation saved successfully',
            'recommendation': recommendation.to_dict()
        }), 201
    except Exception as e:
        log_error(e, "Save recommendation error")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@clothing_bp.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return '', 200
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        result = predict_size(data)
        if result is None:
            return jsonify({'error': 'Prediction failed'}), 500

        main_size, confidence, alt_size, alt_confidence = result

        # Безопасно генериране на обяснение и алтернативни стойности (без NoneType грешки)
        response_payload = {
            "size": main_size,
            "confidence": round(float(confidence), 3),
            "alternative_size": alt_size,
            "alternative_confidence": round(float(alt_confidence), 3) if alt_confidence is not None else None
        }

        if alt_size and alt_confidence:
            size_order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL']
            main_idx = size_order.index(main_size.upper()) if main_size.upper() in size_order else -1
            alt_idx = size_order.index(alt_size.upper()) if alt_size.upper() in size_order else -1

            if alt_idx != -1 and main_idx != -1 and alt_idx < main_idx:
                fit_desc = "по-прилепнала / вталена кройка (Slim Fit)"
            else:
                fit_desc = "по-свободна кройка (Relaxed Fit)"

            response_payload["explanation"] = (
                f"На база вашите мерки препоръчваме размер {main_size} с {confidence:.1%} увереност. "
                f"Ако предпочитате {fit_desc}, размер {alt_size} също е подходящ ({alt_confidence:.1%} вероятност)."
            )
        else:
            response_payload["explanation"] = f"Препоръчваме размер {main_size} с висока увереност ({confidence:.1%})."

        return jsonify(response_payload), 200

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@clothing_bp.route('/predict-size', methods=['POST', 'OPTIONS'])
@clothing_bp.route('/predict_size', methods=['POST', 'OPTIONS'])
def predict_size_route():
    """Съвместимост с по-ранната сигнатура на API-то"""
    return predict()
