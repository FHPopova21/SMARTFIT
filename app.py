import os
import sys
import logging
from app import create_app, db
from app.seed import seed_database

# Create application instance via Application Factory pattern
app = create_app()


@app.cli.command('init-db')
def init_db_command():
    """Explicit developer command to create database tables."""
    db.create_all()
    print("Database tables created successfully.")


@app.cli.command('seed-db')
def seed_db_command():
    """Explicit developer command to seed initial development data."""
    seed_database()
    print("Database seeded successfully.")


if __name__ == '__main__':
    # Explicit database initialization requires an explicit command-line flag
    if '--init-db' in sys.argv:
        with app.app_context():
            db.create_all()
            print("Database tables created via explicit --init-db flag.")
            if '--seed' in sys.argv:
                seed_database()
                print("Database seeded via explicit --seed flag.")
        sys.exit(0)

    # Safe local development server defaults:
    # 1. Bind strictly to loopback interface (127.0.0.1) by default to prevent exposing debugger
    # 2. Control debug mode via FLASK_DEBUG environment variable (defaults to False for safety)
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() in ('true', '1', 't')

    logging.getLogger(__name__).info(f"Starting SmartFit application on {host}:{port} (debug={debug})")
    app.run(debug=debug, host=host, port=port)
