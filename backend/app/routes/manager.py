from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app.utils.decorators import require_role, get_current_user
from app.auth import token_required
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.attendance import AttendanceRecord
from app.models.user import User
from app.services.leave_service import LeaveService
from app import db
from sqlalchemy import or_

manager_bp = Blueprint('manager', __name__)

@manager_bp.route('/team', methods=['GET'])
@token_required
@require_role('manager', 'admin')
def get_team():
    """Get team members"""
    user = get_current_user()
    
    team_members = User.query.filter_by(
        manager_id=user['user_id'],
        is_active=True
    ).all()
    
    return jsonify({
        'team_members': [member.to_dict() for member in team_members]
    }), 200

@manager_bp.route('/leave/pending', methods=['GET'])
@require_role('manager', 'admin')
def get_pending_leaves():
    """Get pending leave requests from team"""
    user = get_current_user()
    
    # Get team member IDs
    team_member_ids = [m.id for m in User.query.filter_by(manager_id=user['user_id']).all()]
    
    if not team_member_ids:
        return jsonify({'requests': []}), 200
    
    pending_requests = LeaveRequest.query.filter(
        LeaveRequest.user_id.in_(team_member_ids),
        LeaveRequest.status == 'pending'
    ).order_by(LeaveRequest.created_at.asc()).all()
    
    return jsonify({
        'requests': [lr.to_dict(include_user=True) for lr in pending_requests]
    }), 200

@manager_bp.route('/leave/history', methods=['GET'])
@require_role('manager', 'admin')
def get_team_leave_history():
    """Get all team leave history"""
    user = get_current_user()
    
    # Get team member IDs
    team_member_ids = [m.id for m in User.query.filter_by(manager_id=user['user_id']).all()]
    
    if not team_member_ids:
        return jsonify({'requests': []}), 200
    
    # Query parameters
    status = request.args.get('status')
    user_id = request.args.get('user_id')
    year = request.args.get('year', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = LeaveRequest.query.filter(LeaveRequest.user_id.in_(team_member_ids))
    
    if status:
        query = query.filter_by(status=status)
    if user_id and user_id in team_member_ids:
        query = query.filter_by(user_id=user_id)
    if year:
        query = query.filter(db.extract('year', LeaveRequest.start_date) == year)
    
    query = query.order_by(LeaveRequest.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'requests': [lr.to_dict(include_user=True) for lr in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@manager_bp.route('/leave/<leave_id>/approve', methods=['PUT'])
@require_role('manager', 'admin')
def approve_leave(leave_id):
    """Approve leave request"""
    user = get_current_user()
    
    # Verify leave request belongs to team member
    leave_request = LeaveRequest.query.get(leave_id)
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    employee = User.query.get(leave_request.user_id)
    if not employee or employee.manager_id != user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    result = LeaveService.approve_leave(leave_id, user['user_id'])
    
    if result['success']:
        return jsonify(result['leave_request']), 200
    else:
        return jsonify({'error': result['error']}), 400

@manager_bp.route('/leave/<leave_id>/reject', methods=['PUT'])
@require_role('manager', 'admin')
def reject_leave(leave_id):
    """Reject leave request"""
    user = get_current_user()
    data = request.get_json()
    
    if not data or 'rejection_reason' not in data:
        return jsonify({'error': 'Rejection reason is required'}), 400
    
    # Verify leave request belongs to team member
    leave_request = LeaveRequest.query.get(leave_id)
    if not leave_request:
        return jsonify({'error': 'Leave request not found'}), 404
    
    employee = User.query.get(leave_request.user_id)
    if not employee or employee.manager_id != user['user_id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    result = LeaveService.reject_leave(leave_id, user['user_id'], data['rejection_reason'])
    
    if result['success']:
        return jsonify(result['leave_request']), 200
    else:
        return jsonify({'error': result['error']}), 400

@manager_bp.route('/leave/apply', methods=['POST'])
@require_role('manager', 'admin')
def apply_leave_on_behalf():
    """Apply leave on behalf of employee"""
    manager = get_current_user()
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'leave_type_id', 'start_date', 'end_date', 'reason']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify employee is in manager's team
    employee = User.query.get(data['user_id'])
    if not employee or employee.manager_id != manager['user_id']:
        return jsonify({'error': 'Employee not in your team'}), 403
    
    try:
        start_date = datetime.fromisoformat(data['start_date']).date()
        end_date = datetime.fromisoformat(data['end_date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
    
    if start_date > end_date:
        return jsonify({'error': 'Start date must be before or equal to end date'}), 400
    
    result = LeaveService.apply_leave(
        user_id=data['user_id'],
        leave_type_id=data['leave_type_id'],
        start_date=start_date,
        end_date=end_date,
        reason=data['reason'],
        applied_by_id=manager['user_id']
    )
    
    if result['success']:
        return jsonify(result['leave_request']), 201
    else:
        return jsonify({'error': result['error']}), 400

@manager_bp.route('/team/<user_id>/balance', methods=['GET'])
@require_role('manager', 'admin')
def get_employee_balance(user_id):
    """Get employee's leave balance"""
    manager = get_current_user()
    
    # Verify employee is in manager's team
    employee = User.query.get(user_id)
    if not employee or employee.manager_id != manager['user_id']:
        return jsonify({'error': 'Employee not in your team'}), 403
    
    year = request.args.get('year', datetime.now().year, type=int)
    
    balances = LeaveBalance.query.filter_by(
        user_id=user_id,
        year=year
    ).all()
    
    return jsonify({
        'employee': employee.to_dict(),
        'year': year,
        'balances': [b.to_dict() for b in balances]
    }), 200

# Attendance endpoints for managers
@manager_bp.route('/team/attendance', methods=['GET'])
@require_role('manager', 'admin')
def get_team_attendance():
    """Get team attendance records"""
    manager = get_current_user()
    
    # Get team member IDs
    team_member_ids = [m.id for m in User.query.filter_by(manager_id=manager['user_id']).all()]
    
    if not team_member_ids:
        return jsonify({'records': []}), 200
    
    # Query parameters
    date_param = request.args.get('date')
    month = request.args.get('month', type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    user_id = request.args.get('user_id')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    query = AttendanceRecord.query.filter(AttendanceRecord.user_id.in_(team_member_ids))
    
    if date_param:
        try:
            target_date = datetime.fromisoformat(date_param).date()
            query = query.filter_by(date=target_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    elif month:
        query = query.filter(
            db.extract('year', AttendanceRecord.date) == year,
            db.extract('month', AttendanceRecord.date) == month
        )
    else:
        query = query.filter(db.extract('year', AttendanceRecord.date) == year)
    
    if user_id and user_id in team_member_ids:
        query = query.filter_by(user_id=user_id)
    
    query = query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.user_id)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'records': [ar.to_dict(include_user=True) for ar in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@manager_bp.route('/team/attendance/summary', methods=['GET'])
@require_role('manager', 'admin')
def get_team_attendance_summary():
    """Get team attendance summary"""
    manager = get_current_user()
    month = request.args.get('month', datetime.now().month, type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    
    # Get team members
    team_members = User.query.filter_by(manager_id=manager['user_id']).all()
    
    summary = []
    for member in team_members:
        records = AttendanceRecord.query.filter(
            AttendanceRecord.user_id == member.id,
            db.extract('year', AttendanceRecord.date) == year,
            db.extract('month', AttendanceRecord.date) == month
        ).all()
        
        summary.append({
            'employee': {
                'id': member.id,
                'name': f"{member.first_name} {member.last_name}",
                'email': member.email
            },
            'total_days': len(records),
            'present': sum(1 for r in records if r.status == 'present'),
            'absent': sum(1 for r in records if r.status == 'absent'),
            'half_day': sum(1 for r in records if r.status == 'half_day'),
            'on_leave': sum(1 for r in records if r.status == 'on_leave'),
            'total_work_hours': sum(float(r.work_hours or 0) for r in records)
        })
    
    return jsonify({
        'month': month,
        'year': year,
        'team_summary': summary
    }), 200

@manager_bp.route('/attendance/mark', methods=['POST'])
@require_role('manager', 'admin')
def mark_attendance():
    """Mark attendance for team member"""
    manager = get_current_user()
    data = request.get_json()
    
    required_fields = ['user_id', 'date', 'status']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Verify employee is in manager's team
    employee = User.query.get(data['user_id'])
    if not employee or employee.manager_id != manager['user_id']:
        return jsonify({'error': 'Employee not in your team'}), 403
    
    try:
        attendance_date = datetime.fromisoformat(data['date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Check if record exists
    existing = AttendanceRecord.query.filter_by(
        user_id=data['user_id'],
        date=attendance_date
    ).first()
    
    if existing:
        existing.status = data['status']
        existing.notes = data.get('notes')
    else:
        existing = AttendanceRecord(
            user_id=data['user_id'],
            date=attendance_date,
            status=data['status'],
            notes=data.get('notes')
        )
        db.session.add(existing)
    
    db.session.commit()
    
    return jsonify(existing.to_dict(include_user=True)), 200
