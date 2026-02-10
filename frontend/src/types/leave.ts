export interface LeaveType {
  id: string;
  name: string;
  code: string;
  requires_approval: boolean;
  max_days_per_request?: number;
  description?: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  leave_type: LeaveType;
  year: number;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_by_id: string;
  approved_by_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApplyLeaveRequest {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  user_id?: string; // For managers applying on behalf
}
