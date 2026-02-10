import uuid
from datetime import datetime
from app import db

class LeaveType(db.Model):
    __tablename__ = 'leave_types'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    requires_approval = db.Column(db.Boolean, default=True, nullable=False)
    max_days_per_request = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'requires_approval': self.requires_approval,
            'max_days_per_request': self.max_days_per_request,
            'description': self.description
        }

class LeaveBalance(db.Model):
    __tablename__ = 'leave_balances'
    __table_args__ = (db.UniqueConstraint('user_id', 'leave_type_id', 'year', name='_user_leave_year_uc'),)
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    leave_type_id = db.Column(db.String(36), db.ForeignKey('leave_types.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_allocated = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    used = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    pending = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    leave_type = db.relationship('LeaveType', backref='balances')
    
    @property
    def available(self):
        return float(self.total_allocated) - float(self.used) - float(self.pending)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'leave_type_id': self.leave_type_id,
            'leave_type': self.leave_type.to_dict() if self.leave_type else None,
            'year': self.year,
            'total_allocated': float(self.total_allocated),
            'used': float(self.used),
            'pending': float(self.pending),
            'available': self.available,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    leave_type_id = db.Column(db.String(36), db.ForeignKey('leave_types.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Numeric(5, 2), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'cancelled', name='leave_status'), 
                       nullable=False, default='pending')
    applied_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    approved_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    leave_type = db.relationship('LeaveType', backref='requests')
    applied_by = db.relationship('User', foreign_keys=[applied_by_id], backref='applied_leaves')
    approved_by = db.relationship('User', foreign_keys=[approved_by_id], backref='approved_leaves')
    
    def to_dict(self, include_user=True):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'leave_type_id': self.leave_type_id,
            'leave_type': self.leave_type.to_dict() if self.leave_type else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'total_days': float(self.total_days),
            'reason': self.reason,
            'status': self.status,
            'applied_by_id': self.applied_by_id,
            'approved_by_id': self.approved_by_id,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_user:
            from app.models.user import User
            user = User.query.get(self.user_id)
            if user:
                data['employee'] = {
                    'id': user.id,
                    'name': f"{user.first_name} {user.last_name}",
                    'email': user.email
                }
        
        return data
