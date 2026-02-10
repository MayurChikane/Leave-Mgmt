# Import all models here for Flask-Migrate to detect them
from app.models.user import User, Location
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.models.holiday import Holiday, location_holidays
from app.models.attendance import AttendanceRecord

__all__ = [
    'User',
    'Location',
    'LeaveType',
    'LeaveBalance',
    'LeaveRequest',
    'Holiday',
    'location_holidays',
    'AttendanceRecord'
]
