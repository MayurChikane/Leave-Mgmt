export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'half_day' | 'on_leave';
  work_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
  total_work_hours: number;
  month: number;
  year: number;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}
