import apiClient from './client';
import { User } from '@/types/user';
import { LeaveRequest, ApplyLeaveRequest } from '@/types/leave';
import { AttendanceRecord, AttendanceSummary } from '@/types/attendance';

export const managerApi = {
  // Team Management
  getTeam: async () => {
    const response = await apiClient.get('/manager/team');
    return response.data;
  },

  // Leave Management
  getPendingLeaves: async () => {
    const response = await apiClient.get('/manager/leave/pending');
    return response.data;
  },

  getTeamLeaveHistory: async (params?: {
    status?: string;
    user_id?: string;
    year?: number;
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/manager/leave/history', { params });
    return response.data;
  },

  approveLeave: async (leaveId: string): Promise<LeaveRequest> => {
    const response = await apiClient.put(`/manager/leave/${leaveId}/approve`);
    return response.data;
  },

  rejectLeave: async (leaveId: string, rejectionReason: string): Promise<LeaveRequest> => {
    const response = await apiClient.put(`/manager/leave/${leaveId}/reject`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  },

  applyLeaveOnBehalf: async (data: ApplyLeaveRequest): Promise<LeaveRequest> => {
    const response = await apiClient.post('/manager/leave/apply', data);
    return response.data;
  },

  getEmployeeBalance: async (userId: string, year?: number) => {
    const response = await apiClient.get(`/manager/team/${userId}/balance`, { params: { year } });
    return response.data;
  },

  // Attendance Management
  getTeamAttendance: async (params?: {
    date?: string;
    month?: number;
    year?: number;
    user_id?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/manager/team/attendance', { params });
    return response.data;
  },

  getTeamAttendanceSummary: async (month?: number, year?: number) => {
    const response = await apiClient.get('/manager/team/attendance/summary', { params: { month, year } });
    return response.data;
  },

  markAttendance: async (data: {
    user_id: string;
    date: string;
    status: string;
    notes?: string;
  }): Promise<AttendanceRecord> => {
    const response = await apiClient.post('/manager/attendance/mark', data);
    return response.data;
  },
};
