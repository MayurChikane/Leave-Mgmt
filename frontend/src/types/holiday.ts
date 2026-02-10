export interface Holiday {
  id: string;
  name: string;
  date: string;
  is_mandatory: boolean;
  description?: string;
  created_at: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  name: string;
  country: string;
  state?: string;
  city?: string;
  timezone: string;
}
