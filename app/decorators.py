from functools import wraps
from flask import jsonify, request, g
from flask_login import current_user
from app.models import db, Store, StoreMembership

ROLE_HIERARCHY = {
    'staff': 1,
    'admin': 2,
    'owner': 3
}

def seller_required(f):
    """
    Декоратор, който позволява достъп само на потребители с роля 'seller'.
    :param f: Функцията, която се декорира
    :return: Декорирана функция
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'seller':
            return jsonify({'error': 'Seller access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """
    Декоратор, който позволява достъп само на потребители с роля 'admin'.
    :param f: Функцията, която се декорира
    :return: Декорирана функция
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

from app.csrf import csrf_protect

def store_required(min_role='staff'):
    """
    Multi-tenant authorization decorator.
    Verifies that the authenticated user has verified membership in the target store
    with at least `min_role` ('staff' < 'admin' < 'owner').

    Injects into Flask `g`:
    - g.current_store: The resolved Store model instance.
    - g.current_membership: The active StoreMembership instance (or None for platform admins).
    - g.current_role: The effective role string ('staff', 'admin', 'owner').

    Returns:
    - 401 if unauthenticated.
    - 404 if store does not exist OR user has no membership (prevents store ID enumeration).
    - 403 if user is a member but role level is below `min_role`.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({'error': 'Authentication required'}), 401

            # Extract store_id from URL parameter
            store_id = kwargs.get('store_id')
            if store_id is None:
                store_id = request.view_args.get('store_id') if request.view_args else None

            if store_id is None:
                return jsonify({'error': 'Store ID is required in URL parameter'}), 400

            try:
                store_id_int = int(store_id)
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid store ID format'}), 400

            store = db.session.get(Store, store_id_int)
            if not store:
                return jsonify({'error': 'Store not found'}), 404

            # Platform Administrator Override
            if getattr(current_user, 'role', None) == 'admin':
                g.current_store = store
                g.current_membership = None
                g.current_role = 'owner'
                return f(*args, **kwargs)

            # Check store-specific membership
            membership = StoreMembership.query.filter_by(
                user_id=current_user.id,
                store_id=store_id_int
            ).first()

            # If not found, check organization-wide membership (store_id IS NULL)
            if not membership:
                membership = StoreMembership.query.filter_by(
                    user_id=current_user.id,
                    organization_id=store.organization_id,
                    store_id=None
                ).first()

            # Return 404 if user has no membership in this store/org (prevents IDOR & enumeration)
            if not membership:
                return jsonify({'error': 'Store not found'}), 404

            user_level = ROLE_HIERARCHY.get(membership.role, 0)
            required_level = ROLE_HIERARCHY.get(min_role, 1)

            if user_level < required_level:
                return jsonify({'error': f'Requires {min_role} privileges or higher'}), 403

            g.current_store = store
            g.current_membership = membership
            g.current_role = membership.role
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def get_user_stores(user_id: int):
    """
    Helper function to query all stores accessible by a user along with their effective role.
    Handles both direct store-specific memberships and org-wide memberships.
    """
    # 1. Store-specific memberships
    store_memberships = StoreMembership.query.filter(
        StoreMembership.user_id == user_id,
        StoreMembership.store_id.isnot(None)
    ).all()

    # 2. Org-wide memberships
    org_memberships = StoreMembership.query.filter(
        StoreMembership.user_id == user_id,
        StoreMembership.store_id.is_(None)
    ).all()

    stores_by_id = {}

    # Process org-wide first
    for om in org_memberships:
        org_stores = Store.query.filter_by(organization_id=om.organization_id).all()
        for s in org_stores:
            stores_by_id[s.id] = {
                'store': s,
                'role': om.role,
                'is_org_wide': True
            }

    # Store-specific memberships can override with higher role if applicable
    for sm in store_memberships:
        existing = stores_by_id.get(sm.store_id)
        if not existing or ROLE_HIERARCHY.get(sm.role, 0) > ROLE_HIERARCHY.get(existing['role'], 0):
            store = db.session.get(Store, sm.store_id)
            if store:
                stores_by_id[sm.store_id] = {
                    'store': store,
                    'role': sm.role,
                    'is_org_wide': False
                }

    return list(stores_by_id.values())
