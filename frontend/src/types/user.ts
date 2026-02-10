export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'employee' | 'manager' | 'admin';
  manager_id?: string;
  location_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  country: string;
  state?: string;
  city?: string;
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  refresh_token?: string;
}
