import apiClient from './client';
import { LeaveBalance, LeaveRequest, ApplyLeaveRequest } from '@/types/leave';
import { Holiday } from '@/types/holiday';
import { AttendanceRecord, AttendanceSummary } from '@/types/attendance';

export const employeeApi = {
  // Leave Balance
  getLeaveBalance: async (year?: number) => {
    const response = await apiClient.get('/employee/balance', { params: { year } });
    return response.data;
  },

  // Leave Requests
  applyLeave: async (data: ApplyLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.post('/employee/leave', data);
    return response.data;
  },

  getLeaveHistory: async (params?: {
    status?: string;
    leave_type_id?: string;
    year?: number;
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/employee/leave', { params });
    return response.data;
  },

  getLeaveRequest: async (leaveId: string): Promise<LeaveRequest> => {
    const response = await apiClient.get(`/employee/leave/${leaveId}`);
    return response.data;
  },

  cancelLeave: async (leaveId: string): Promise<LeaveRequest> => {
    const response = await apiClient.delete(`/employee/leave/${leaveId}`);
    return response.data;
  },

  // Holidays
  getHolidays: async (year?: number) => {
    const response = await apiClient.get('/employee/holidays', { params: { year } });
    return response.data;
  },

  // Attendance
  checkIn: async (): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/employee/attendance/check-in');
    return response.data;
  },

  checkOut: async (): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/employee/attendance/check-out');
    return response.data;
  },

  getAttendanceHistory: async (params?: {
    start_date?: string;
    end_date?: string;
    month?: number;
    year?: number;
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/employee/attendance', { params });
    return response.data;
  },

  getAttendanceSummary: async (month?: number, year?: number): Promise<AttendanceSummary> => {
    const response = await apiClient.get('/employee/attendance/summary', { params: { month, year } });
    return response.data;
  },
};
