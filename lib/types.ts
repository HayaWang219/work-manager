export interface Task {
  id: number;
  title: string;
  notes?: string;
  status: 'todo' | 'done' | 'archived';
  category?: string;
  is_today: number;
  report_flag: number;
  is_recurring: number;
  recurring_id?: number;
  notion_page_id?: string;
  notion_synced_at?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  due_date?: string;
  scheduled_date?: string;
}

export interface RecurringTemplate {
  id: number;
  title: string;
  category?: string;
  notes?: string;
  is_active: number;
  created_at: string;
}

export interface Note {
  id: number;
  content: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  status: 'active' | 'completed' | 'on_hold';
  next_step?: string;
  notes?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ProjectLink {
  id: number;
  project_id: number;
  label?: string;
  url: string;
  created_at: string;
}

export interface ProjectItem {
  id: number;
  project_id: number;
  title: string;
  progress?: string;
  next_step?: string;
  due_date?: string;
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
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  all_day: number;
  calendar_id?: string;
  fetched_at: string;
}
