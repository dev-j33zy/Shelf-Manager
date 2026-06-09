export type Quality = 'New' | 'Good' | 'Fair' | 'Poor' | 'Broken';

export interface Equipment {
  id: string;
  control_number: string;
  name: string;
  quantity: number;
  quality: Quality;
  department: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  equipment_id: string;
  text: string;
  author: string;
  created_at: string;
}

export interface StatusLog {
  id: string;
  equipment_id: string;
  quantity: number;
  quality: Quality;
  notes: string;
  recorded_by: string;
  recorded_at: string;
}

export interface AuditSession {
  id: string;
  title: string;
  audited_by: string;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
}

export interface AuditRecord {
  id: string;
  audit_session_id: string;
  equipment_id: string;
  control_number: string;
  quantity: number;
  quality: Quality;
  notes: string;
  recorded_by: string;
  scanned_at: string;
}
