from flask import request, jsonify, current_app, g
from functools import wraps
from keycloak import KeycloakOpenID
from keycloak.exceptions import KeycloakConnectionError, KeycloakGetError

def get_keycloak_openid():
    return KeycloakOpenID(
        server_url=current_app.config['KEYCLOAK_SERVER_URL'],
        client_id=current_app.config['KEYCLOAK_CLIENT_ID'],
        realm_name=current_app.config['KEYCLOAK_REALM'],
        client_secret_key=current_app.config['KEYCLOAK_CLIENT_SECRET']
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            keycloak_openid = get_keycloak_openid()
            # method 1: introspect (online validation)
            # token_info = keycloak_openid.introspect(token)
            # if not token_info.get('active'):
            #    return jsonify({'message': 'Token is invalid or expired'}), 401
            
            # method 2: decode (offline validation using public key)
            # Fetch public key from Keycloak
            KEYCLOAK_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n" + keycloak_openid.public_key() + "\n-----END PUBLIC KEY-----"
            
            options = {"verify_signature": True, "verify_aud": False, "exp": True}
            token_info = keycloak_openid.decode_token(token, key=KEYCLOAK_PUBLIC_KEY, options=options)
            
            # Add user info to request context
            g.user = token_info
            
        except Exception as e:
            return jsonify({'message': f'Token is invalid: {str(e)}'}), 401
            
        return f(*args, **kwargs)
    
    return decorated
