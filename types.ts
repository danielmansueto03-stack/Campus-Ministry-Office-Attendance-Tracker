export interface EventRecord {
  id: string;
  name: string;
  event_date: string;
  description: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  event_id: string;
  full_name: string;
  college: string;
  course: string;
  year_level: string | null;
  section: string | null;
  created_at: string;
}