from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.utils.decorators import require_auth, get_current_user

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/token', methods=['POST'])
def exchange_token():
    """Exchange Keycloak authorization code for JWT token"""
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    code = data['code']
    redirect_uri = data.get('redirect_uri', 'http://localhost:3000/auth/callback')
    
    result = auth_service.exchange_code_for_token(code, redirect_uri)
    
    if result['success']:
        return jsonify({
            'token': result['token'],
            'user': result['user']
        }), 200
    else:
        return jsonify({'error': result['error']}), 400

@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """Refresh JWT token"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Refresh token is required'}), 400
    
    result = auth_service.refresh_token(data['refresh_token'])
    
    if result['success']:
        return jsonify({
            'token': result['token'],
            'user': result['user']
        }), 200
    else:
        return jsonify({'error': result['error']}), 400

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Refresh token is required'}), 400
    
    result = auth_service.logout(data['refresh_token'])
    
    if result['success']:
        return jsonify({'message': 'Logged out successfully'}), 200
    else:
        return jsonify({'error': result['error']}), 400

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user_info():
    """Get current user information"""
    user_data = get_current_user()
    
    if not user_data:
        return jsonify({'error': 'User not found'}), 404
    
    from app.models.user import User
    user = User.query.get(user_data['user_id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200
