import apiClient from './client';
import { User, Location } from '@/types/user';
import { Holiday } from '@/types/holiday';

export const adminApi = {
  // User Management
  getUsers: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    location_id?: string;
  }) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  deactivateUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  bulkUploadUsers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/users/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Location Management
  getLocations: async () => {
    const response = await apiClient.get('/admin/locations');
    return response.data;
  },

  createLocation: async (data: Partial<Location>): Promise<Location> => {
    const response = await apiClient.post('/admin/locations', data);
    return response.data;
  },

  // Holiday Management
  getHolidays: async (year?: number) => {
    const response = await apiClient.get('/admin/holidays', { params: { year } });
    return response.data;
  },

  createHoliday: async (data: Partial<Holiday>): Promise<Holiday> => {
    const response = await apiClient.post('/admin/holidays', data);
    return response.data;
  },

  updateHoliday: async (holidayId: string, data: Partial<Holiday>): Promise<Holiday> => {
    const response = await apiClient.put(`/admin/holidays/${holidayId}`, data);
    return response.data;
  },

  deleteHoliday: async (holidayId: string) => {
    const response = await apiClient.delete(`/admin/holidays/${holidayId}`);
    return response.data;
  },

  assignHolidaysToLocation: async (locationId: string, holidayIds: string[]) => {
    const response = await apiClient.post(`/admin/locations/${locationId}/holidays`, {
      holiday_ids: holidayIds,
    });
    return response.data;
  },

  // Leave Balance Allocation
  allocateLeaveBalance: async (data: {
    user_id: string;
    leave_type_id: string;
    year: number;
    total_allocated: number;
  }) => {
    const response = await apiClient.post('/admin/leave-balances/allocate', data);
    return response.data;
  },

  // Attendance Reports
  getAttendanceReports: async (params?: {
    month?: number;
    year?: number;
    location_id?: string;
  }) => {
    const response = await apiClient.get('/admin/attendance/reports', { params });
    return response.data;
  },

  bulkUploadAttendance: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/attendance/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAttendanceDefaulters: async (params?: {
    month?: number;
    year?: number;
    min_absent_days?: number;
  }) => {
    const response = await apiClient.get('/admin/attendance/defaulters', { params });
    return response.data;
  },
};
