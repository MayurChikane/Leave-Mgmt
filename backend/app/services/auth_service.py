import os
import jwt
import requests
from datetime import datetime, timedelta
from keycloak import KeycloakOpenID
from app.models.user import User
from app import db

class AuthService:
    def __init__(self):
        self.keycloak_server_url = os.getenv('KEYCLOAK_SERVER_URL')
        self.realm = os.getenv('KEYCLOAK_REALM')
        self.client_id = os.getenv('KEYCLOAK_CLIENT_ID')
        self.client_secret = os.getenv('KEYCLOAK_CLIENT_SECRET')
        
        # Initialize Keycloak OpenID client
        self.keycloak_openid = KeycloakOpenID(
            server_url=self.keycloak_server_url,
            client_id=self.client_id,
            realm_name=self.realm,
            client_secret_key=self.client_secret
        )
    
    def exchange_code_for_token(self, code, redirect_uri):
        """Exchange authorization code for tokens"""
        try:
            # Get tokens from Keycloak
            token_response = self.keycloak_openid.token(
                grant_type='authorization_code',
                code=code,
                redirect_uri=redirect_uri
            )
            
            # Decode ID token to get user info
            user_info = self.keycloak_openid.decode_token(
                token_response['id_token'],
                validate=True
            )
            
            # Get or create user in our database
            user = self._get_or_create_user(user_info)
            
            # Generate internal JWT
            internal_jwt = self._generate_jwt(user)
            
            return {
                'success': True,
                'token': internal_jwt,
                'user': user.to_dict()
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_or_create_user(self, user_info):
        """Get existing user or create new one from Keycloak user info"""
        keycloak_id = user_info.get('sub')
        email = user_info.get('email')
        
        # Try to find user by keycloak_id first
        user = User.query.filter_by(keycloak_id=keycloak_id).first()
        
        if not user:
            # Try to find by email
            user = User.query.filter_by(email=email).first()
            
            if user:
                # Update keycloak_id for existing user
                user.keycloak_id = keycloak_id
            else:
                # Create new user
                # Extract role from Keycloak token (assuming roles are in realm_access.roles)
                roles = user_info.get('realm_access', {}).get('roles', [])
                role = 'employee'  # default
                
                if 'admin' in roles:
                    role = 'admin'
                elif 'manager' in roles:
                    role = 'manager'
                
                # For new users, we need a default location
                # In production, this should be handled during user provisioning
                from app.models.user import Location
                default_location = Location.query.first()
                
                if not default_location:
                    # Create a default location if none exists
                    default_location = Location(
                        name='Default Location',
                        country='India',
                        timezone='Asia/Kolkata'
                    )
                    db.session.add(default_location)
                    db.session.flush()
                
                user = User(
                    keycloak_id=keycloak_id,
                    email=email,
                    first_name=user_info.get('given_name', ''),
                    last_name=user_info.get('family_name', ''),
                    role=role,
                    location_id=default_location.id
                )
                db.session.add(user)
            
            db.session.commit()
        
        return user
    
    def _generate_jwt(self, user):
        """Generate internal JWT token"""
        payload = {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'location_id': user.location_id,
            'exp': datetime.utcnow() + timedelta(hours=int(os.getenv('JWT_EXPIRATION_HOURS', 8)))
        }
        
        return jwt.encode(payload, os.getenv('JWT_SECRET'), algorithm='HS256')
    
    def refresh_token(self, refresh_token):
        """Refresh access token using refresh token"""
        try:
            token_response = self.keycloak_openid.refresh_token(refresh_token)
            
            # Decode new ID token
            user_info = self.keycloak_openid.decode_token(
                token_response['id_token'],
                validate=True
            )
            
            # Get user
            user = User.query.filter_by(keycloak_id=user_info.get('sub')).first()
            
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Generate new internal JWT
            internal_jwt = self._generate_jwt(user)
            
            return {
                'success': True,
                'token': internal_jwt,
                'user': user.to_dict()
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def logout(self, refresh_token):
        """Logout user from Keycloak"""
        try:
            self.keycloak_openid.logout(refresh_token)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def validate_token(self, token):
        """Validate JWT token"""
        try:
            payload = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
            return {'valid': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError:
            return {'valid': False, 'error': 'Invalid token'}
