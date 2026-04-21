import { getDb } from '@/db';
import type { Task, RecurringTemplate, Note, CalendarEvent, Project, ProjectLink, ProjectItem, ProjectWithLinks, ReportDoc } from './types';

// ── Tasks ──────────────────────────────────────────────────────────────

export function getTasks(filters: {
  status?: string;
  category?: string | null;
  is_today?: number;
  report_flag?: number;
} = {}): Task[] {
  const db = getDb();
  let q = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];

  if (filters.status && filters.status !== 'all') {
    q += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.category === null) {
    q += ' AND category IS NULL';
  } else if (filters.category) {
    q += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.is_today !== undefined) {
    q += ' AND is_today = ?';
    params.push(filters.is_today);
  }
  if (filters.report_flag !== undefined) {
    q += ' AND report_flag = ?';
    params.push(filters.report_flag);
  }

  q += ' ORDER BY created_at ASC';
  return db.prepare(q).all(...params) as Task[];
}

export function getTaskById(id: number): Task | undefined {
  return getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export function createTask(data: {
  title: string;
  notes?: string;
  category?: string;
  is_today?: number;
  report_flag?: number;
  is_recurring?: number;
  due_date?: string;
  scheduled_date?: string;
}): Task {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO tasks (title, notes, category, is_today, report_flag, due_date, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.notes ?? null,
    data.category ?? null,
    data.is_today ?? 0,
    data.report_flag ?? 0,
    data.due_date ?? null,
    data.scheduled_date ?? null,
  );
  return getTaskById(result.lastInsertRowid as number)!;
}

export function updateTask(id: number, data: Partial<Omit<Task, 'id' | 'created_at'>>): Task | undefined {
  const db = getDb();
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getTaskById(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);

  if (data.status === 'done') {
    db.prepare(`UPDATE tasks SET ${setClause}, completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .run(...values, id);
  } else {
    db.prepare(`UPDATE tasks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...values, id);
  }

  return getTaskById(id);
}

export function deleteTask(id: number): void {
  getDb().prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function getCategories(): string[] {
  const rows = getDb().prepare(
    "SELECT DISTINCT category FROM tasks WHERE category IS NOT NULL AND status != 'archived' ORDER BY category"
  ).all() as { category: string }[];
  return rows.map(r => r.category);
}

// ── Notes ──────────────────────────────────────────────────────────────

export function getNotes(search?: string): Note[] {
  const db = getDb();
  if (search) {
    return db.prepare(
      "SELECT * FROM notes WHERE content LIKE ? ORDER BY pinned DESC, updated_at DESC"
    ).all(`%${search}%`) as Note[];
  }
  return db.prepare('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC').all() as Note[];
}

export function getNoteById(id: number): Note | undefined {
  return getDb().prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note | undefined;
}

export function createNote(content: string, pinned = 0): Note {
  const db = getDb();
  const result = db.prepare('INSERT INTO notes (content, pinned) VALUES (?, ?)').run(content, pinned);
  return getNoteById(result.lastInsertRowid as number)!;
}

export function updateNote(id: number, data: { content?: string; pinned?: number }): Note | undefined {
  const db = getDb();
  const fields = Object.keys(data);
  if (fields.length === 0) return getNoteById(id);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  db.prepare(`UPDATE notes SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return getNoteById(id);
}

export function deleteNote(id: number): void {
  getDb().prepare('DELETE FROM notes WHERE id = ?').run(id);
}

// ── Recurring Templates ────────────────────────────────────────────────

export function getRecurringTemplates(activeOnly = false): RecurringTemplate[] {
  const q = activeOnly
    ? 'SELECT * FROM recurring_templates WHERE is_active = 1 ORDER BY created_at ASC'
    : 'SELECT * FROM recurring_templates ORDER BY created_at ASC';
  return getDb().prepare(q).all() as RecurringTemplate[];
}

export function getRecurringById(id: number): RecurringTemplate | undefined {
  return getDb().prepare('SELECT * FROM recurring_templates WHERE id = ?').get(id) as RecurringTemplate | undefined;
}

export function createRecurring(data: { title: string; category?: string; notes?: string }): RecurringTemplate {
  const db = getDb();
  const result = db.prepare('INSERT INTO recurring_templates (title, category, notes) VALUES (?, ?, ?)')
    .run(data.title, data.category ?? null, data.notes ?? null);
  return getRecurringById(result.lastInsertRowid as number)!;
}

export function updateRecurring(id: number, data: Partial<RecurringTemplate>): RecurringTemplate | undefined {
  const db = getDb();
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getRecurringById(id);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  db.prepare(`UPDATE recurring_templates SET ${setClause} WHERE id = ?`).run(...values, id);
  return getRecurringById(id);
}

export function deleteRecurring(id: number): void {
  getDb().prepare('DELETE FROM recurring_templates WHERE id = ?').run(id);
}

// ── System State ───────────────────────────────────────────────────────

export function getSystemState(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM system_state WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSystemState(key: string, value: string): void {
  getDb().prepare(`
    INSERT INTO system_state (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value);
}

// ── Calendar Events ────────────────────────────────────────────────────

export function upsertCalendarEvents(events: Omit<CalendarEvent, 'fetched_at'>[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO calendar_events (id, title, start_time, end_time, all_day, calendar_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      all_day = excluded.all_day,
      fetched_at = datetime('now')
  `);
  const insertMany = db.transaction((evts: Omit<CalendarEvent, 'fetched_at'>[]) => {
    for (const e of evts) stmt.run(e.id, e.title, e.start_time, e.end_time ?? null, e.all_day, e.calendar_id ?? null);
  });
  insertMany(events);
}

export function getCalendarEvents(dateMin: string, dateMax: string): CalendarEvent[] {
  return getDb().prepare(
    'SELECT * FROM calendar_events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time ASC'
  ).all(dateMin, dateMax) as CalendarEvent[];
}

export function clearOldCalendarEvents(beforeDate: string): void {
  getDb().prepare('DELETE FROM calendar_events WHERE start_time < ?').run(beforeDate);
}

// ── Projects ───────────────────────────────────────────────────────────

function getLinksForProject(id: number): ProjectLink[] {
  return getDb().prepare('SELECT * FROM project_links WHERE project_id = ? ORDER BY created_at ASC').all(id) as ProjectLink[];
}

function getItemsForProject(id: number): ProjectItem[] {
  return getDb().prepare('SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order ASC, created_at ASC').all(id) as ProjectItem[];
}

export function getProjects(status?: string): ProjectWithLinks[] {
  const db = getDb();
  let q = 'SELECT * FROM projects';
  const params: unknown[] = [];
  if (status && status !== 'all') {
    q += ' WHERE status = ?';
    params.push(status);
  }
  q += ' ORDER BY sort_order ASC, created_at ASC';
  const rows = db.prepare(q).all(...params) as Project[];
  return rows.map(p => ({ ...p, links: getLinksForProject(p.id), items: getItemsForProject(p.id) }));
}

export function getProjectById(id: number): ProjectWithLinks | undefined {
  const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  if (!row) return undefined;
  return { ...row, links: getLinksForProject(id), items: getItemsForProject(id) };
}

// ── Project Items ──────────────────────────────────────────────────────

export function getProjectItemById(id: number): ProjectItem | undefined {
  return getDb().prepare('SELECT * FROM project_items WHERE id = ?').get(id) as ProjectItem | undefined;
}

export function createProjectItem(data: {
  project_id: number; title: string; progress?: string;
  next_step?: string; due_date?: string;
}): ProjectItem {
  const db = getDb();
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM project_items WHERE project_id = ?').get(data.project_id) as { m: number | null }).m ?? -1;
  const result = db.prepare(
    'INSERT INTO project_items (project_id, title, progress, next_step, due_date, sort_order) VALUES (?,?,?,?,?,?)'
  ).run(data.project_id, data.title, data.progress ?? null, data.next_step ?? null, data.due_date ?? null, maxOrder + 1);
  return getProjectItemById(result.lastInsertRowid as number)!;
}

export function updateProjectItem(id: number, data: Partial<Omit<ProjectItem, 'id' | 'project_id' | 'created_at'>>): ProjectItem | undefined {
  const db = getDb();
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'project_id' && k !== 'created_at');
  if (fields.length === 0) return getProjectItemById(id);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  db.prepare(`UPDATE project_items SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return getProjectItemById(id);
}

export function deleteProjectItem(id: number): void {
  getDb().prepare('DELETE FROM project_items WHERE id = ?').run(id);
}

export function getUpcomingDueDates(days = 7): (ProjectItem & { project_title: string })[] {
  const now = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  return getDb().prepare(`
    SELECT pi.*, p.title as project_title
    FROM project_items pi
    JOIN projects p ON p.id = pi.project_id
    WHERE pi.due_date IS NOT NULL
      AND pi.due_date >= ?
      AND pi.due_date <= ?
      AND pi.status = 'active'
    ORDER BY pi.due_date ASC
  `).all(now, future) as (ProjectItem & { project_title: string })[];
}

export function createProject(data: { title: string; next_step?: string; notes?: string }): ProjectWithLinks {
  const db = getDb();
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM projects').get() as { m: number | null }).m ?? -1;
  const result = db.prepare(
    'INSERT INTO projects (title, next_step, notes, sort_order) VALUES (?, ?, ?, ?)'
  ).run(data.title, data.next_step ?? null, data.notes ?? null, maxOrder + 1);
  return getProjectById(result.lastInsertRowid as number)!;
}

export function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'created_at'>>): ProjectWithLinks | undefined {
  const db = getDb();
  const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return getProjectById(id);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);

  if (data.status === 'completed') {
    db.prepare(`UPDATE projects SET ${setClause}, completed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  } else {
    db.prepare(`UPDATE projects SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  }
  return getProjectById(id);
}

export function deleteProject(id: number): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ── Report Docs ────────────────────────────────────────────────────────

export function getReportDocs(search?: string): ReportDoc[] {
  const db = getDb();
  if (search) {
    return db.prepare(
      "SELECT * FROM report_docs WHERE content LIKE ? OR title LIKE ? OR date LIKE ? ORDER BY date DESC"
    ).all(`%${search}%`, `%${search}%`, `%${search}%`) as ReportDoc[];
  }
  return db.prepare('SELECT * FROM report_docs ORDER BY date DESC').all() as ReportDoc[];
}

export function getReportDocById(id: number): ReportDoc | undefined {
  return getDb().prepare('SELECT * FROM report_docs WHERE id = ?').get(id) as ReportDoc | undefined;
}

export function createReportDoc(data: { date: string; title?: string; content?: string }): ReportDoc {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO report_docs (date, title, content) VALUES (?, ?, ?)'
  ).run(data.date, data.title ?? null, data.content ?? '');
  return getReportDocById(result.lastInsertRowid as number)!;
}

export function updateReportDoc(id: number, data: { title?: string; content?: string; date?: string }): ReportDoc | undefined {
  const db = getDb();
  const fields = Object.keys(data).filter(k => (data as Record<string, unknown>)[k] !== undefined);
  if (fields.length === 0) return getReportDocById(id);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  db.prepare(`UPDATE report_docs SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return getReportDocById(id);
}

export function deleteReportDoc(id: number): void {
  getDb().prepare('DELETE FROM report_docs WHERE id = ?').run(id);
}

export function addProjectLink(projectId: number, url: string, label?: string): ProjectLink {
  const db = getDb();
  const result = db.prepare('INSERT INTO project_links (project_id, url, label) VALUES (?, ?, ?)').run(projectId, url, label ?? null);
  return db.prepare('SELECT * FROM project_links WHERE id = ?').get(result.lastInsertRowid) as ProjectLink;
}

export function deleteProjectLink(linkId: number): void {
  getDb().prepare('DELETE FROM project_links WHERE id = ?').run(linkId);
}
