import uuid
from datetime import datetime
from app import db

# Association table for many-to-many relationship
location_holidays = db.Table('location_holidays',
    db.Column('id', db.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
    db.Column('location_id', db.String(36), db.ForeignKey('locations.id'), nullable=False),
    db.Column('holiday_id', db.String(36), db.ForeignKey('holidays.id'), nullable=False),
    db.UniqueConstraint('location_id', 'holiday_id', name='_location_holiday_uc')
)

class Holiday(db.Model):
    __tablename__ = 'holidays'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False)
    is_mandatory = db.Column(db.Boolean, default=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    locations = db.relationship('Location', secondary=location_holidays, backref='holidays')
    
    def to_dict(self, include_locations=False):
        data = {
            'id': self.id,
            'name': self.name,
            'date': self.date.isoformat() if self.date else None,
            'is_mandatory': self.is_mandatory,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_locations:
            data['locations'] = [loc.to_dict() for loc in self.locations]
        
        return data
