import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_login import LoginManager
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

db = SQLAlchemy()
mail = Mail()
login_manager = LoginManager()
migrate = Migrate()

def create_app(test_config=None):
    """
    Фабрика за създаване и конфигуриране на Flask приложението (Application Factory Pattern).
    :param test_config: Речник с конфигурации при тестване (по избор)
    :return: Инициализирано Flask приложение
    """
    app = Flask(__name__, instance_relative_config=True)

    # Уверяваме се, че instance папката съществува
    os.makedirs(app.instance_path, exist_ok=True)

    # Настройване на основната конфигурация
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or (
        'sqlite:///' + os.path.join(app.instance_path, 'SmartFit.db')
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'smartfit-dev-secret-key-replace-in-production')

    # Конфигурация за Flask-Mail
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', '1', 'yes']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME'))

    # Зареждане на тестова конфигурация при подадена такава
    if test_config:
        app.config.update(test_config)

    # Инициализация на логването (ако не сме в чист тестов режим)
    from app.logging_config import setup_logging, log_error
    if not app.config.get('TESTING'):
        setup_logging(app)

    # Конфигуриране на CORS
    CORS(app, 
         resources={r"/api/*": {"origins": ["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080"]}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    # Инициализиране на разширенията
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    # API-First обработка на неоторизиран достъп (вместо HTML пренасочване)
    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'error': 'Необходим е вход в профила за това действие'}), 401

    # Глобални JSON обработчици на грешки
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Търсеният API маршрут или ресурс не съществува'}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Този HTTP метод не е разрешен за посочения ендпоинт'}), 405

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Възникна непредвидена вътрешна грешка на сървъра'}), 500

    # Дефиниране на user_loader за Flask-Login
    from app.models import User
    @login_manager.user_loader
    def load_user(user_id):
        try:
            return db.session.get(User, int(user_id))
        except Exception as e:
            log_error(e, f"Error loading user with ID: {user_id}")
            return None

    # Регистрация на Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.clothing_routes import clothing_bp
    from app.routes.comment_routes import comment_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(clothing_bp, url_prefix='/api')
    app.register_blueprint(comment_bp, url_prefix='/api')

    # Root информативен маршрут
    @app.route('/')
    def index():
        return jsonify({
            'name': 'SmartFit API',
            'version': '2.0',
            'status': 'online',
            'endpoints': {
                'register': '/api/register',
                'login': '/api/login',
                'logout': '/api/logout',
                'user': '/api/user',
                'clothes': '/api/clothes',
                'predict': '/api/predict'
            }
        })

    return app
