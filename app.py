import logging
from app import create_app, db
from app.seed import seed_database

# Създаване на приложението чрез Application Factory
app = create_app()

# Инициализиране на базата данни и seed данни
with app.app_context():
    db.create_all()
    try:
        seed_database()
    except Exception as e:
        logging.getLogger(__name__).error(f"Error seeding database: {e}")

if __name__ == '__main__':
    logging.getLogger(__name__).info("Starting SmartFit application on port 5001")
    app.run(debug=True, host='0.0.0.0', port=5001)
