from flask import Blueprint, request, jsonify
from datetime import datetime
from app.utils.decorators import require_role
from app.auth import token_required
from app.models.user import User, Location
from app.models.leave import LeaveBalance, LeaveType, LeaveRequest
from app.models.holiday import Holiday
from app.models.attendance import AttendanceRecord
from app import db
import pandas as pd
import os
from werkzeug.utils import secure_filename

admin_bp = Blueprint('admin', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# User Management
@admin_bp.route('/users', methods=['GET'])
@token_required
@require_role('admin')
def get_users():
    """Get all users with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', '')
    role = request.args.get('role')
    location_id = request.args.get('location_id')
    
    query = User.query
    
    if search:
        query = query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%')
            )
        )
    
    if role:
        query = query.filter_by(role=role)
    
    if location_id:
        query = query.filter_by(location_id=location_id)
    
    query = query.order_by(User.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [user.to_dict() for user in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200

@admin_bp.route('/users', methods=['POST'])
@require_role('admin')
def create_user():
    """Create new user"""
    data = request.get_json()
    
    required_fields = ['email', 'first_name', 'last_name', 'role', 'location_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User with this email already exists'}), 400
    
    user = User(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role=data['role'],
        location_id=data['location_id'],
        manager_id=data.get('manager_id')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@require_role('admin')
def update_user(user_id):
    """Update user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'email' in data:
        user.email = data['email']
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'role' in data:
        user.role = data['role']
    if 'location_id' in data:
        user.location_id = data['location_id']
    if 'manager_id' in data:
        user.manager_id = data['manager_id']
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify(user.to_dict()), 200

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_role('admin')
def deactivate_user(user_id):
    """Deactivate user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'User deactivated successfully'}), 200

@admin_bp.route('/users/bulk-upload', methods=['POST'])
@require_role('admin')
def bulk_upload_users():
    """Bulk upload users from CSV/Excel"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only CSV and Excel files are allowed'}), 400
    
    try:
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Validate columns
        required_columns = ['email', 'first_name', 'last_name', 'role', 'location_id']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': f'Missing required columns. Required: {required_columns}'}), 400
        
        results = {'success': [], 'errors': []}
        
        for idx, row in df.iterrows():
            try:
                # Check if user exists
                if User.query.filter_by(email=row['email']).first():
                    results['errors'].append({
                        'row': idx + 2,
                        'email': row['email'],
                        'error': 'User already exists'
                    })
                    continue
                
                user = User(
                    email=row['email'],
                    first_name=row['first_name'],
                    last_name=row['last_name'],
                    role=row['role'],
                    location_id=row['location_id'],
                    manager_id=row.get('manager_id') if pd.notna(row.get('manager_id')) else None
                )
                
                db.session.add(user)
                results['success'].append(row['email'])
            
            except Exception as e:
                results['errors'].append({
                    'row': idx + 2,
                    'email': row.get('email', 'N/A'),
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bulk upload completed',
            'total_processed': len(df),
            'successful': len(results['success']),
            'failed': len(results['errors']),
            'results': results
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 400

# Location Management
@admin_bp.route('/locations', methods=['GET'])
@require_role('admin')
def get_locations():
    """Get all locations"""
    locations = Location.query.all()
    return jsonify({
        'locations': [loc.to_dict() for loc in locations]
    }), 200

@admin_bp.route('/locations', methods=['POST'])
@require_role('admin')
def create_location():
    """Create new location"""
    data = request.get_json()
    
    required_fields = ['name', 'country', 'timezone']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Location.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Location with this name already exists'}), 400
    
    location = Location(
        name=data['name'],
        country=data['country'],
        state=data.get('state'),
        city=data.get('city'),
        timezone=data['timezone']
    )
    
    db.session.add(location)
    db.session.commit()
    
    return jsonify(location.to_dict()), 201

# Holiday Management
@admin_bp.route('/holidays', methods=['GET'])
@require_role('admin')
def get_holidays():
    """Get all holidays"""
    year = request.args.get('year', type=int)
    
    query = Holiday.query
    
    if year:
        query = query.filter(db.extract('year', Holiday.date) == year)
    
    query = query.order_by(Holiday.date)
    
    holidays = query.all()
    
    return jsonify({
        'holidays': [h.to_dict(include_locations=True) for h in holidays]
    }), 200

@admin_bp.route('/holidays', methods=['POST'])
@require_role('admin')
def create_holiday():
    """Create new holiday"""
    data = request.get_json()
    
    required_fields = ['name', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        holiday_date = datetime.fromisoformat(data['date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    holiday = Holiday(
        name=data['name'],
        date=holiday_date,
        is_mandatory=data.get('is_mandatory', True),
        description=data.get('description')
    )
    
    db.session.add(holiday)
    db.session.commit()
    
    return jsonify(holiday.to_dict()), 201

@admin_bp.route('/holidays/<holiday_id>', methods=['PUT'])
@require_role('admin')
def update_holiday(holiday_id):
    """Update holiday"""
    holiday = Holiday.query.get(holiday_id)
    if not holiday:
        return jsonify({'error': 'Holiday not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        holiday.name = data['name']
    if 'date' in data:
        try:
            holiday.date = datetime.fromisoformat(data['date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    if 'is_mandatory' in data:
        holiday.is_mandatory = data['is_mandatory']
    if 'description' in data:
        holiday.description = data['description']
    
    db.session.commit()
    
    return jsonify(holiday.to_dict()), 200

@admin_bp.route('/holidays/<holiday_id>', methods=['DELETE'])
@require_role('admin')
def delete_holiday(holiday_id):
    """Delete holiday"""
    holiday = Holiday.query.get(holiday_id)
    if not holiday:
        return jsonify({'error': 'Holiday not found'}), 404
    
    db.session.delete(holiday)
    db.session.commit()
    
    return jsonify({'message': 'Holiday deleted successfully'}), 200

@admin_bp.route('/locations/<location_id>/holidays', methods=['POST'])
@require_role('admin')
def assign_holidays_to_location(location_id):
    """Assign holidays to location"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    data = request.get_json()
    
    if 'holiday_ids' not in data:
        return jsonify({'error': 'holiday_ids is required'}), 400
    
    # Clear existing holidays
    location.holidays = []
    
    # Add new holidays
    for holiday_id in data['holiday_ids']:
        holiday = Holiday.query.get(holiday_id)
        if holiday:
            location.holidays.append(holiday)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Holidays assigned successfully',
        'location': location.to_dict(),
        'holidays': [h.to_dict() for h in location.holidays]
    }), 200

# Leave Balance Management
@admin_bp.route('/leave-balances/allocate', methods=['POST'])
@require_role('admin')
def allocate_leave_balances():
    """Allocate leave balances for users"""
    data = request.get_json()
    
    required_fields = ['user_id', 'leave_type_id', 'year', 'total_allocated']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if balance already exists
    existing = LeaveBalance.query.filter_by(
        user_id=data['user_id'],
        leave_type_id=data['leave_type_id'],
        year=data['year']
    ).first()
    
    if existing:
        existing.total_allocated = data['total_allocated']
        balance = existing
    else:
        balance = LeaveBalance(
            user_id=data['user_id'],
            leave_type_id=data['leave_type_id'],
            year=data['year'],
            total_allocated=data['total_allocated']
        )
        db.session.add(balance)
    
    db.session.commit()
    
    return jsonify(balance.to_dict()), 200

# Attendance Management
@admin_bp.route('/attendance/reports', methods=['GET'])
@require_role('admin')
def get_attendance_reports():
    """Get organization-wide attendance reports"""
    month = request.args.get('month', datetime.now().month, type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    location_id = request.args.get('location_id')
    
    query = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        User.email,
        Location.name.label('location_name'),
        db.func.count(AttendanceRecord.id).label('total_days'),
        db.func.sum(db.case((AttendanceRecord.status == 'present', 1), else_=0)).label('present'),
        db.func.sum(db.case((AttendanceRecord.status == 'absent', 1), else_=0)).label('absent'),
        db.func.sum(db.case((AttendanceRecord.status == 'half_day', 1), else_=0)).label('half_day'),
        db.func.sum(db.case((AttendanceRecord.status == 'on_leave', 1), else_=0)).label('on_leave'),
        db.func.sum(AttendanceRecord.work_hours).label('total_work_hours')
    ).join(
        AttendanceRecord, User.id == AttendanceRecord.user_id
    ).join(
        Location, User.location_id == Location.id
    ).filter(
        db.extract('year', AttendanceRecord.date) == year,
        db.extract('month', AttendanceRecord.date) == month
    )
    
    if location_id:
        query = query.filter(User.location_id == location_id)
    
    query = query.group_by(User.id, Location.name).order_by(User.last_name, User.first_name)
    
    results = query.all()
    
    report = []
    for r in results:
        report.append({
            'employee': {
                'id': r.id,
                'name': f"{r.first_name} {r.last_name}",
                'email': r.email,
                'location': r.location_name
            },
            'total_days': r.total_days or 0,
            'present': r.present or 0,
            'absent': r.absent or 0,
            'half_day': r.half_day or 0,
            'on_leave': r.on_leave or 0,
            'total_work_hours': float(r.total_work_hours or 0)
        })
    
    return jsonify({
        'month': month,
        'year': year,
        'report': report
    }), 200

@admin_bp.route('/attendance/bulk-upload', methods=['POST'])
@require_role('admin')
def bulk_upload_attendance():
    """Bulk upload attendance records"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        required_columns = ['user_id', 'date', 'status']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': f'Missing required columns. Required: {required_columns}'}), 400
        
        results = {'success': [], 'errors': []}
        
        for idx, row in df.iterrows():
            try:
                attendance_date = pd.to_datetime(row['date']).date()
                
                existing = AttendanceRecord.query.filter_by(
                    user_id=row['user_id'],
                    date=attendance_date
                ).first()
                
                if existing:
                    existing.status = row['status']
                    existing.notes = row.get('notes')
                else:
                    record = AttendanceRecord(
                        user_id=row['user_id'],
                        date=attendance_date,
                        status=row['status'],
                        notes=row.get('notes')
                    )
                    db.session.add(record)
                
                results['success'].append(f"{row['user_id']} - {attendance_date}")
            
            except Exception as e:
                results['errors'].append({
                    'row': idx + 2,
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bulk upload completed',
            'successful': len(results['success']),
            'failed': len(results['errors']),
            'results': results
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process file: {str(e)}'}), 400

@admin_bp.route('/attendance/defaulters', methods=['GET'])
@require_role('admin')
def get_attendance_defaulters():
    """Get employees with attendance issues"""
    month = request.args.get('month', datetime.now().month, type=int)
    year = request.args.get('year', datetime.now().year, type=int)
    min_absent_days = request.args.get('min_absent_days', 3, type=int)
    
    # Get users with high absence
    query = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        User.email,
        db.func.sum(db.case((AttendanceRecord.status == 'absent', 1), else_=0)).label('absent_days')
    ).join(
        AttendanceRecord, User.id == AttendanceRecord.user_id
    ).filter(
        db.extract('year', AttendanceRecord.date) == year,
        db.extract('month', AttendanceRecord.date) == month
    ).group_by(User.id).having(
        db.func.sum(db.case((AttendanceRecord.status == 'absent', 1), else_=0)) >= min_absent_days
    ).order_by(db.desc('absent_days'))
    
    results = query.all()
    
    defaulters = []
    for r in results:
        defaulters.append({
            'employee': {
                'id': r.id,
                'name': f"{r.first_name} {r.last_name}",
                'email': r.email
            },
            'absent_days': r.absent_days
        })
    
    return jsonify({
        'month': month,
        'year': year,
        'defaulters': defaulters
    }), 200
