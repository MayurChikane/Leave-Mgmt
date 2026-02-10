import re
from datetime import datetime, date

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_date_range(start_date, end_date):
    """Validate that start_date is before or equal to end_date"""
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date).date()
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date).date()
    
    return start_date <= end_date

def validate_future_date(check_date):
    """Validate that date is not in the past"""
    if isinstance(check_date, str):
        check_date = datetime.fromisoformat(check_date).date()
    
    return check_date >= date.today()

def validate_role(role):
    """Validate user role"""
    valid_roles = ['employee', 'manager', 'admin']
    return role in valid_roles

def validate_leave_status(status):
    """Validate leave request status"""
    valid_statuses = ['pending', 'approved', 'rejected', 'cancelled']
    return status in valid_statuses

def validate_attendance_status(status):
    """Validate attendance status"""
    valid_statuses = ['present', 'absent', 'half_day', 'on_leave']
    return status in valid_statuses
