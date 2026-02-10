from datetime import datetime, timedelta, date
from app import db
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.holiday import Holiday
from app.models.user import User

class LeaveService:
    
    @staticmethod
    def calculate_leave_days(start_date, end_date, user_id):
        """Calculate working days excluding weekends and holidays"""
        user = User.query.get(user_id)
        if not user:
            return 0
        
        # Get location holidays
        holidays = LeaveService._get_location_holidays(user.location_id, start_date, end_date)
        holiday_dates = [h.date for h in holidays]
        
        total_days = 0
        current_date = start_date
        
        while current_date <= end_date:
            # Skip weekends (Saturday=5, Sunday=6)
            if current_date.weekday() < 5:
                # Skip holidays
                if current_date not in holiday_dates:
                    total_days += 1
            current_date += timedelta(days=1)
        
        return total_days
    
    @staticmethod
    def _get_location_holidays(location_id, start_date, end_date):
        """Get holidays for a location within date range"""
        from app.models.user import Location
        
        location = Location.query.get(location_id)
        if not location:
            return []
        
        # Get holidays assigned to this location within the date range
        holidays = Holiday.query.join(Holiday.locations).filter(
            Location.id == location_id,
            Holiday.date >= start_date,
            Holiday.date <= end_date
        ).all()
        
        return holidays
    
    @staticmethod
    def validate_leave_balance(user_id, leave_type_id, days_requested, year=None):
        """Check if user has sufficient balance"""
        if year is None:
            year = datetime.now().year
        
        balance = LeaveBalance.query.filter_by(
            user_id=user_id,
            leave_type_id=leave_type_id,
            year=year
        ).first()
        
        if not balance:
            return False, "No leave balance found for this leave type"
        
        if balance.available < days_requested:
            return False, f"Insufficient balance. Available: {balance.available} days, Requested: {days_requested} days"
        
        return True, "Balance available"
    
    @staticmethod
    def apply_leave(user_id, leave_type_id, start_date, end_date, reason, applied_by_id=None):
        """Apply for leave"""
        # If applied_by_id is not provided, user is applying for themselves
        if applied_by_id is None:
            applied_by_id = user_id
        
        # Calculate leave days
        total_days = LeaveService.calculate_leave_days(start_date, end_date, user_id)
        
        if total_days == 0:
            return {'success': False, 'error': 'No working days in the selected date range'}
        
        # Validate balance
        year = start_date.year
        is_valid, message = LeaveService.validate_leave_balance(user_id, leave_type_id, total_days, year)
        
        if not is_valid:
            return {'success': False, 'error': message}
        
        # Create leave request
        leave_request = LeaveRequest(
            user_id=user_id,
            leave_type_id=leave_type_id,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            reason=reason,
            applied_by_id=applied_by_id,
            status='pending'
        )
        
        db.session.add(leave_request)
        
        # Update pending balance
        balance = LeaveBalance.query.filter_by(
            user_id=user_id,
            leave_type_id=leave_type_id,
            year=year
        ).first()
        
        balance.pending = float(balance.pending) + total_days
        
        db.session.commit()
        
        return {'success': True, 'leave_request': leave_request.to_dict()}
    
    @staticmethod
    def approve_leave(leave_request_id, approved_by_id):
        """Approve leave request"""
        leave_request = LeaveRequest.query.get(leave_request_id)
        
        if not leave_request:
            return {'success': False, 'error': 'Leave request not found'}
        
        if leave_request.status != 'pending':
            return {'success': False, 'error': f'Cannot approve leave with status: {leave_request.status}'}
        
        # Update leave request
        leave_request.status = 'approved'
        leave_request.approved_by_id = approved_by_id
        
        # Update balance: move from pending to used
        year = leave_request.start_date.year
        balance = LeaveBalance.query.filter_by(
            user_id=leave_request.user_id,
            leave_type_id=leave_request.leave_type_id,
            year=year
        ).first()
        
        if balance:
            balance.pending = float(balance.pending) - float(leave_request.total_days)
            balance.used = float(balance.used) + float(leave_request.total_days)
        
        db.session.commit()
        
        return {'success': True, 'leave_request': leave_request.to_dict()}
    
    @staticmethod
    def reject_leave(leave_request_id, approved_by_id, rejection_reason):
        """Reject leave request"""
        leave_request = LeaveRequest.query.get(leave_request_id)
        
        if not leave_request:
            return {'success': False, 'error': 'Leave request not found'}
        
        if leave_request.status != 'pending':
            return {'success': False, 'error': f'Cannot reject leave with status: {leave_request.status}'}
        
        # Update leave request
        leave_request.status = 'rejected'
        leave_request.approved_by_id = approved_by_id
        leave_request.rejection_reason = rejection_reason
        
        # Update balance: remove from pending
        year = leave_request.start_date.year
        balance = LeaveBalance.query.filter_by(
            user_id=leave_request.user_id,
            leave_type_id=leave_request.leave_type_id,
            year=year
        ).first()
        
        if balance:
            balance.pending = float(balance.pending) - float(leave_request.total_days)
        
        db.session.commit()
        
        return {'success': True, 'leave_request': leave_request.to_dict()}
    
    @staticmethod
    def cancel_leave(leave_request_id, user_id):
        """Cancel leave request (only if pending)"""
        leave_request = LeaveRequest.query.get(leave_request_id)
        
        if not leave_request:
            return {'success': False, 'error': 'Leave request not found'}
        
        if leave_request.user_id != user_id:
            return {'success': False, 'error': 'Unauthorized'}
        
        if leave_request.status != 'pending':
            return {'success': False, 'error': f'Cannot cancel leave with status: {leave_request.status}'}
        
        # Update leave request
        leave_request.status = 'cancelled'
        
        # Update balance: remove from pending
        year = leave_request.start_date.year
        balance = LeaveBalance.query.filter_by(
            user_id=leave_request.user_id,
            leave_type_id=leave_request.leave_type_id,
            year=year
        ).first()
        
        if balance:
            balance.pending = float(balance.pending) - float(leave_request.total_days)
        
        db.session.commit()
        
        return {'success': True, 'leave_request': leave_request.to_dict()}
