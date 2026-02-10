from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app.utils.decorators import require_role, get_current_user
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.holiday import Holiday
from app.models.attendance import AttendanceRecord
from app.models.user import User, Location
from app.services.leave_service import LeaveService
from app import db

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/balance', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_leave_balance():
    """Get leave balance for current user"""
    user = get_current_user()
    year = request.args.get('year', datetime.now().year, type=int)
    
    balances = LeaveBalance.query.filter_by(
        user_id=user['user_id'],
        year=year
    ).all()
    
    return jsonify({
        'year': year,
        'balances': [b.to_dict() for b in balances]
    }), 200

@employee_bp.route('/leave', methods=['POST'])
@require_role('employee', 'manager', 'admin')
def apply_leave():
    """Apply for leave"""
    user = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['leave_type_id', 'start_date', 'end_date', 'reason']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
    
    if start_date > end_date:
        return jsonify({'error': 'Start date must be before or equal to end date'}), 400
    
    result = LeaveService.apply_leave(
        user_id=user['user_id'],
        leave_type_id=data['leave_type_id'],
        start_date=start_date,
        end_date=end_date,
        reason=data['reason']
    )
    
    if result['success']:
        return jsonify(result['leave_request']), 201
    else:
        return jsonify({'error': result['error']}), 400

@employee_bp.route('/leave', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_leave_history():
    """Get leave history for current user"""
    user = get_current_user()
    
    # Query parameters for filtering
    status = request.args.get('status')
    leave_type_id = request.args.get('leave_type_id')
    year = request.args.get('year', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = LeaveRequest.query.filter_by(user_id=user['user_id'])
    
    if status:
        query = query.filter_by(status=status)
    if leave_type_id:
        query = query.filter_by(leave_type_id=leave_type_id)
    if year:
        query = query.filter(db.extract('year', LeaveRequest.start_date) == year)
    
    query = query.order_by(LeaveRequest.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'requests': [lr.to_dict(include_user=False) for lr in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@employee_bp.route('/leave/<leave_id>', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_leave_request(leave_id):
    """Get specific leave request"""
    user = get_current_user()
    
    leave_request = LeaveRequest.query.filter_by(
        id=leave_id,
        user_id=user['user_id']
    ).first()
    
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    return jsonify(leave_request.to_dict()), 200

@employee_bp.route('/leave/<leave_id>', methods=['DELETE'])
@require_role('employee', 'manager', 'admin')
def cancel_leave(leave_id):
    """Cancel leave request"""
    user = get_current_user()
    
    result = LeaveService.cancel_leave(leave_id, user['user_id'])
    
    if result['success']:
        return jsonify(result['leave_request']), 200
    else:
        return jsonify({'error': result['error']}), 400

@employee_bp.route('/holidays', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_holidays():
    """Get holidays for user's location"""
    user = get_current_user()
    year = request.args.get('year', datetime.now().year, type=int)
    
    # Get user's location
    user_obj = User.query.get(user['user_id'])
    if not user_obj:
        return jsonify({'error': 'User not found'}), 404
    
    # Get holidays for location
    holidays = Holiday.query.join(Holiday.locations).filter(
        Location.id == user_obj.location_id,
        db.extract('year', Holiday.date) == year
    ).order_by(Holiday.date).all()
    
    return jsonify({
        'year': year,
        'location': user_obj.location.to_dict() if user_obj.location else None,
        'holidays': [h.to_dict() for h in holidays]
    }), 200

# Attendance endpoints
@employee_bp.route('/attendance/check-in', methods=['POST'])
@require_role('employee', 'manager', 'admin')
def check_in():
    """Check-in for the day"""
    user = get_current_user()
    today = date.today()
    
    # Check if already checked in
    existing = AttendanceRecord.query.filter_by(
        user_id=user['user_id'],
        date=today
    ).first()
    
    if existing and existing.check_in_time:
        return jsonify({'error': 'Already checked in today'}), 400
    
    if existing:
        existing.check_in_time = datetime.now()
        existing.status = 'present'
    else:
        existing = AttendanceRecord(
            user_id=user['user_id'],
            date=today,
            check_in_time=datetime.now(),
            status='present'
        )
        db.session.add(existing)
    
    db.session.commit()
    
    return jsonify(existing.to_dict()), 200

@employee_bp.route('/attendance/check-out', methods=['POST'])
@require_role('employee', 'manager', 'admin')
def check_out():
    """Check-out for the day"""
    user = get_current_user()
    today = date.today()
    
    attendance = AttendanceRecord.query.filter_by(
        user_id=user['user_id'],
        date=today
    ).first()
    
    if not attendance or not attendance.check_in_time:
        return jsonify({'error': 'Must check-in first'}), 400
    
    if attendance.check_out_time:
        return jsonify({'error': 'Already checked out today'}), 400
    
    attendance.check_out_time = datetime.now()
    attendance.calculate_work_hours()
    
    db.session.commit()
    
    return jsonify(attendance.to_dict()), 200

@employee_bp.route('/attendance', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_attendance_history():
    """Get attendance history"""
    user = get_current_user()
    
    # Query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    month = request.args.get('month', type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 31, type=int)
    
    query = AttendanceRecord.query.filter_by(user_id=user['user_id'])
    
    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date).date()
            end = datetime.fromisoformat(end_date).date()
            query = query.filter(AttendanceRecord.date.between(start, end))
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    elif month:
        query = query.filter(
            db.extract('year', AttendanceRecord.date) == year,
            db.extract('month', AttendanceRecord.date) == month
        )
    else:
        query = query.filter(db.extract('year', AttendanceRecord.date) == year)
    
    query = query.order_by(AttendanceRecord.date.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'records': [ar.to_dict() for ar in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@employee_bp.route('/attendance/summary', methods=['GET'])
@require_role('employee', 'manager', 'admin')
def get_attendance_summary():
    """Get attendance summary"""
    user = get_current_user()
    month = request.args.get('month', datetime.now().month, type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    
    records = AttendanceRecord.query.filter(
        AttendanceRecord.user_id == user['user_id'],
        db.extract('year', AttendanceRecord.date) == year,
        db.extract('month', AttendanceRecord.date) == month
    ).all()
    
    summary = {
        'total_days': len(records),
        'present': sum(1 for r in records if r.status == 'present'),
        'absent': sum(1 for r in records if r.status == 'absent'),
        'half_day': sum(1 for r in records if r.status == 'half_day'),
        'on_leave': sum(1 for r in records if r.status == 'on_leave'),
        'total_work_hours': sum(float(r.work_hours or 0) for r in records),
        'month': month,
        'year': year
    }
    
    return jsonify(summary), 200
