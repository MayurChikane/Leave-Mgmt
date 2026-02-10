import uuid
from datetime import datetime, timedelta
from app import db

class AttendanceRecord(db.Model):
    __tablename__ = 'attendance_records'
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    check_in_time = db.Column(db.DateTime, nullable=True)
    check_out_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.Enum('present', 'absent', 'half_day', 'on_leave', name='attendance_status'), 
                       nullable=False, default='absent')
    work_hours = db.Column(db.Numeric(5, 2), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def calculate_work_hours(self):
        """Calculate work hours from check-in and check-out times"""
        if self.check_in_time and self.check_out_time:
            delta = self.check_out_time - self.check_in_time
            hours = delta.total_seconds() / 3600
            self.work_hours = round(hours, 2)
            
            # Update status based on work hours
            if hours >= 8:
                self.status = 'present'
            elif hours >= 4:
                self.status = 'half_day'
            else:
                self.status = 'absent'
        return self.work_hours
    
    def to_dict(self, include_user=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'status': self.status,
            'work_hours': float(self.work_hours) if self.work_hours else None,
            'notes': self.notes,
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
