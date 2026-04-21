// Type definitions for the Supabase (multi-user) version of the app.
// Once lib/db.ts is ported to use Supabase, the SQLite types in lib/types.ts
// can be deleted and this file renamed to lib/types.ts.
//
// Differences from SQLite types:
//   - boolean columns are real booleans (not 0/1)
//   - user_id: string (uuid) added to private tables
//   - created_by?: string added to shared tables (projects, report_docs)
//   - timestamp columns are ISO strings produced by Supabase / Postgres timestamptz

export interface Profile {
  id: string;
  display_name: string | null;
  role: 'admin';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  title: string;
  notes: string | null;
  status: 'todo' | 'done' | 'archived';
  category: string | null;
  is_today: boolean;
  report_flag: boolean;
  is_recurring: boolean;
  recurring_id: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  due_date: string | null;
  scheduled_date: string | null;
}

export interface RecurringTemplate {
  id: number;
  user_id: string;
  title: string;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemState {
  key: string;
  value: string;
  updated_at: string;
}

// ---------- Shared tables ----------

export interface Project {
  id: number;
  title: string;
  status: 'active' | 'completed' | 'on_hold';
  next_step: string | null;
  notes: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ProjectLink {
  id: number;
  project_id: number;
  label: string | null;
  url: string;
  created_at: string;
}

export interface ProjectItem {
  id: number;
  project_id: number;
  title: string;
  progress: string | null;
  next_step: string | null;
  due_date: string | null;
  status: 'active' | 'done';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithLinks extends Project {
  links: ProjectLink[];
  items: ProjectItem[];
}

export interface ReportDoc {
  id: number;
  date: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
