import secrets
import hmac
import logging
from functools import wraps
from flask import request, session, jsonify, current_app
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

SESSION_CSRF_KEY = '_csrf_token'

# Allowlist for Origin / Referer validation (Defense-in-Depth)
ALLOWED_ORIGINS = {
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://localhost:5001'
}

def generate_csrf_token() -> str:
    """
    Generates a cryptographically strong, unpredictable 256-bit token
    and stores it in the authenticated user's signed session.
    """
    token = secrets.token_hex(32)
    session[SESSION_CSRF_KEY] = token
    return token


def get_csrf_token() -> str:
    """
    Returns the current session's CSRF token, generating one if not present.
    """
    token = session.get(SESSION_CSRF_KEY)
    if not token:
        token = generate_csrf_token()
    return token


def clear_csrf_token() -> None:
    """
    Clears the CSRF token from the session upon logout.
    """
    session.pop(SESSION_CSRF_KEY, None)


def validate_csrf_token(client_token: str | None) -> bool:
    """
    Validates a client-supplied CSRF token against the session token
    using constant-time string comparison to prevent timing attacks.
    """
    if not client_token:
        return False
    session_token = session.get(SESSION_CSRF_KEY)
    if not session_token:
        return False
    return hmac.compare_digest(str(session_token), str(client_token))


def csrf_protect(f):
    """
    Session-bound CSRF protection decorator for state-changing endpoints
    (POST, PUT, DELETE, PATCH).

    Enforces:
    1. Defense-in-depth: Origin/Referer verification against allowed origins.
    2. Session-bound token verification: Rejects requests missing X-CSRFToken
       or presenting tokens that do not match the session.
    3. Never accepts X-Requested-With alone as sufficient protection.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
            # 1. Defense-in-depth: Origin verification (if present)
            origin = request.headers.get('Origin')
            if origin:
                normalized_origin = origin.rstrip('/')
                if normalized_origin not in ALLOWED_ORIGINS and not normalized_origin.startswith(('http://localhost:', 'http://127.0.0.1:')):
                    logger.warning("CSRF check blocked untrusted origin: %s", origin)
                    return jsonify({
                        'error': 'CSRF verification failed: untrusted origin',
                        'code': 'CSRF_UNTRUSTED_ORIGIN'
                    }), 403

            # Referer verification (if present)
            referer = request.headers.get('Referer')
            if referer:
                ref_host = urlparse(referer).netloc
                req_host = request.host
                if ref_host and req_host and ref_host.split(':')[0] != req_host.split(':')[0] and not any(o in referer for o in ALLOWED_ORIGINS):
                    logger.warning("CSRF check blocked untrusted referer: %s", referer)
                    return jsonify({
                        'error': 'CSRF verification failed: untrusted referer',
                        'code': 'CSRF_UNTRUSTED_REFERER'
                    }), 403

            # 2. Session-bound Token Extraction
            # Check X-CSRFToken or X-CSRF-Token headers
            client_token = (
                request.headers.get('X-CSRFToken') or
                request.headers.get('X-CSRF-Token')
            )

            # If not in headers, check JSON body or form data (fallback for specific form posts)
            if not client_token and request.is_json:
                data = request.get_json(silent=True)
                if isinstance(data, dict):
                    client_token = data.get('csrf_token') or data.get('_csrf_token')

            if not client_token:
                logger.warning("CSRF check failed: missing X-CSRFToken header on %s %s", request.method, request.path)
                return jsonify({
                    'error': 'CSRF verification failed: missing anti-CSRF token',
                    'code': 'CSRF_TOKEN_MISSING'
                }), 403

            # 3. Session Token Verification
            session_token = session.get(SESSION_CSRF_KEY)
            if not session_token:
                logger.warning("CSRF check failed: no session CSRF token on %s %s", request.method, request.path)
                return jsonify({
                    'error': 'CSRF verification failed: session token missing or expired',
                    'code': 'CSRF_SESSION_EXPIRED'
                }), 403

            if not hmac.compare_digest(str(session_token), str(client_token)):
                logger.warning("CSRF check failed: token mismatch on %s %s", request.method, request.path)
                return jsonify({
                    'error': 'CSRF verification failed: invalid anti-CSRF token',
                    'code': 'CSRF_TOKEN_INVALID'
                }), 403

        return f(*args, **kwargs)
    return decorated_function

