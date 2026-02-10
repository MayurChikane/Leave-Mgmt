import uuid
from datetime import datetime
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    keycloak_id = db.Column(db.String(255), unique=True, nullable=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum('employee', 'manager', 'admin', name='user_roles'), nullable=False, default='employee')
    manager_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    location_id = db.Column(db.String(36), db.ForeignKey('locations.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    manager = db.relationship('User', remote_side=[id], backref='team_members')
    location = db.relationship('Location', backref='employees')
    leave_balances = db.relationship('LeaveBalance', backref='user', lazy='dynamic')
    leave_requests = db.relationship('LeaveRequest', foreign_keys='LeaveRequest.user_id', backref='employee', lazy='dynamic')
    attendance_records = db.relationship('AttendanceRecord', backref='user', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'role': self.role,
            'manager_id': self.manager_id,
            'location_id': self.location_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Location(db.Model):
    __tablename__ = 'locations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True)
    country = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    timezone = db.Column(db.String(50), nullable=False, default='UTC')
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'country': self.country,
            'state': self.state,
            'city': self.city,
            'timezone': self.timezone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
