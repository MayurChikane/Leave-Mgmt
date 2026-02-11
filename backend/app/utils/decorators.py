from functools import wraps
from flask import request, jsonify
import jwt
import os

def require_auth(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
            request.user = payload
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated_function

def require_role(*allowed_roles):
    """Decorator to require specific role(s)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = getattr(g, 'user', None)
            
            if not user or not user.get('role'):
                return jsonify({'error': 'Forbidden', 'message': 'Authentication required'}), 401
            
            # Allow admin access to everything
            if user['role'] == 'admin':
                return f(*args, **kwargs)

            if user['role'] not in allowed_roles:
                return jsonify({'error': 'Forbidden', 'message': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

from flask import g

def get_current_user():
    """Get current user from request context"""
    return getattr(g, 'user', None)
