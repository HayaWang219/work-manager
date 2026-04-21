import 'server-only';
import { getSupabaseServerClient } from './supabase/server';
import type {
  Task,
  RecurringTemplate,
  Note,
  Project,
  ProjectLink,
  ProjectItem,
  ProjectWithLinks,
  ReportDoc,
} from './types';

async function client() {
  return getSupabaseServerClient();
}

async function currentUserId(): Promise<string> {
  const supabase = await client();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

// ── Tasks ──────────────────────────────────────────────────────────────

export async function getTasks(filters: {
  status?: string;
  category?: string | null;
  is_today?: boolean;
  report_flag?: boolean;
} = {}): Promise<Task[]> {
  const supabase = await client();
  let q = supabase.from('tasks').select('*');
  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.category === null) q = q.is('category', null);
  else if (filters.category) q = q.eq('category', filters.category);
  if (filters.is_today !== undefined) q = q.eq('is_today', filters.is_today);
  if (filters.report_flag !== undefined) q = q.eq('report_flag', filters.report_flag);
  q = q.order('created_at', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  const supabase = await client();
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Task | undefined;
}

export async function createTask(data: {
  title: string;
  notes?: string;
  category?: string;
  is_today?: boolean;
  report_flag?: boolean;
  is_recurring?: boolean;
  recurring_id?: number;
  due_date?: string;
  scheduled_date?: string;
}): Promise<Task> {
  const supabase = await client();
  const user_id = await currentUserId();
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({
      user_id,
      title: data.title,
      notes: data.notes ?? null,
      category: data.category ?? null,
      is_today: data.is_today ?? false,
      report_flag: data.report_flag ?? false,
      is_recurring: data.is_recurring ?? false,
      recurring_id: data.recurring_id ?? null,
      due_date: data.due_date ?? null,
      scheduled_date: data.scheduled_date ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return row as Task;
}

export async function updateTask(
  id: number,
  data: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>,
): Promise<Task | undefined> {
  const supabase = await client();
  const patch: Record<string, unknown> = { ...data };
  if (data.status === 'done' && patch.completed_at === undefined) {
    patch.completed_at = new Date().toISOString();
  }
  const { data: row, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as Task | undefined;
}

export async function deleteTask(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function getCategories(): Promise<string[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from('tasks')
    .select('category')
    .not('category', 'is', null)
    .neq('status', 'archived');
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) if (r.category) set.add(r.category as string);
  return [...set].sort();
}

// ── Notes ──────────────────────────────────────────────────────────────

export async function getNotes(search?: string): Promise<Note[]> {
  const supabase = await client();
  let q = supabase.from('notes').select('*');
  if (search) q = q.ilike('content', `%${search}%`);
  q = q.order('pinned', { ascending: false }).order('updated_at', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function getNoteById(id: number): Promise<Note | undefined> {
  const supabase = await client();
  const { data, error } = await supabase.from('notes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as Note | undefined;
}

export async function createNote(content: string, pinned = false): Promise<Note> {
  const supabase = await client();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id, content, pinned })
    .select('*')
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(
  id: number,
  data: { content?: string; pinned?: boolean },
): Promise<Note | undefined> {
  const supabase = await client();
  if (data.content === undefined && data.pinned === undefined) return getNoteById(id);
  const { data: row, error } = await supabase
    .from('notes')
    .update(data)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as Note | undefined;
}

export async function deleteNote(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ── Recurring Templates ────────────────────────────────────────────────

export async function getRecurringTemplates(activeOnly = false): Promise<RecurringTemplate[]> {
  const supabase = await client();
  let q = supabase.from('recurring_templates').select('*');
  if (activeOnly) q = q.eq('is_active', true);
  q = q.order('created_at', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RecurringTemplate[];
}

export async function getRecurringById(id: number): Promise<RecurringTemplate | undefined> {
  const supabase = await client();
  const { data, error } = await supabase.from('recurring_templates').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as RecurringTemplate | undefined;
}

export async function createRecurring(data: {
  title: string;
  category?: string;
  notes?: string;
}): Promise<RecurringTemplate> {
  const supabase = await client();
  const user_id = await currentUserId();
  const { data: row, error } = await supabase
    .from('recurring_templates')
    .insert({
      user_id,
      title: data.title,
      category: data.category ?? null,
      notes: data.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return row as RecurringTemplate;
}

export async function updateRecurring(
  id: number,
  data: Partial<Omit<RecurringTemplate, 'id' | 'user_id' | 'created_at'>>,
): Promise<RecurringTemplate | undefined> {
  const supabase = await client();
  const patch = { ...data };
  if (Object.keys(patch).length === 0) return getRecurringById(id);
  const { data: row, error } = await supabase
    .from('recurring_templates')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as RecurringTemplate | undefined;
}

export async function deleteRecurring(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('recurring_templates').delete().eq('id', id);
  if (error) throw error;
}

// ── System State (shared KV) ───────────────────────────────────────────

export async function getSystemState(key: string): Promise<string | null> {
  const supabase = await client();
  const { data, error } = await supabase.from('system_state').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setSystemState(key: string, value: string): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('system_state').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

// ── Projects (shared) ──────────────────────────────────────────────────

type ProjectRowWithEmbeds = Project & {
  project_links: ProjectLink[];
  project_items: ProjectItem[];
};

function shapeProject(row: ProjectRowWithEmbeds): ProjectWithLinks {
  const { project_links, project_items, ...rest } = row;
  return {
    ...(rest as Project),
    links: [...project_links].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    items: [...project_items].sort(
      (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
    ),
  };
}

export async function getProjects(status?: string): Promise<ProjectWithLinks[]> {
  const supabase = await client();
  let q = supabase.from('projects').select('*, project_links(*), project_items(*)');
  if (status && status !== 'all') q = q.eq('status', status);
  q = q.order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as ProjectRowWithEmbeds[]).map(shapeProject);
}

export async function getProjectById(id: number): Promise<ProjectWithLinks | undefined> {
  const supabase = await client();
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_links(*), project_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? shapeProject(data as ProjectRowWithEmbeds) : undefined;
}

export async function createProject(data: {
  title: string;
  next_step?: string;
  notes?: string;
}): Promise<ProjectWithLinks> {
  const supabase = await client();
  const { data: last } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { data: row, error } = await supabase
    .from('projects')
    .insert({
      title: data.title,
      next_step: data.next_step ?? null,
      notes: data.notes ?? null,
      sort_order: nextOrder,
    })
    .select('id')
    .single();
  if (error) throw error;
  return (await getProjectById(row.id as number))!;
}

export async function updateProject(
  id: number,
  data: Partial<Omit<Project, 'id' | 'created_at'>>,
): Promise<ProjectWithLinks | undefined> {
  const supabase = await client();
  const patch: Record<string, unknown> = { ...data };
  if (data.status === 'completed' && patch.completed_at === undefined) {
    patch.completed_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return getProjectById(id);
  const { error } = await supabase.from('projects').update(patch).eq('id', id);
  if (error) throw error;
  return getProjectById(id);
}

export async function deleteProject(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ── Project Items ──────────────────────────────────────────────────────

export async function getProjectItemById(id: number): Promise<ProjectItem | undefined> {
  const supabase = await client();
  const { data, error } = await supabase.from('project_items').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as ProjectItem | undefined;
}

export async function createProjectItem(data: {
  project_id: number;
  title: string;
  progress?: string;
  next_step?: string;
  due_date?: string;
}): Promise<ProjectItem> {
  const supabase = await client();
  const { data: last } = await supabase
    .from('project_items')
    .select('sort_order')
    .eq('project_id', data.project_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { data: row, error } = await supabase
    .from('project_items')
    .insert({
      project_id: data.project_id,
      title: data.title,
      progress: data.progress ?? null,
      next_step: data.next_step ?? null,
      due_date: data.due_date ?? null,
      sort_order: nextOrder,
    })
    .select('*')
    .single();
  if (error) throw error;
  return row as ProjectItem;
}

export async function updateProjectItem(
  id: number,
  data: Partial<Omit<ProjectItem, 'id' | 'project_id' | 'created_at'>>,
): Promise<ProjectItem | undefined> {
  const supabase = await client();
  if (Object.keys(data).length === 0) return getProjectItemById(id);
  const { data: row, error } = await supabase
    .from('project_items')
    .update(data)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as ProjectItem | undefined;
}

export async function deleteProjectItem(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('project_items').delete().eq('id', id);
  if (error) throw error;
}

export async function getUpcomingDueDates(
  days = 7,
): Promise<(ProjectItem & { project_title: string })[]> {
  const supabase = await client();
  const now = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('project_items')
    .select('*, projects!inner(title)')
    .not('due_date', 'is', null)
    .gte('due_date', now)
    .lte('due_date', future)
    .eq('status', 'active')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as (ProjectItem & { projects: { title: string } })[]).map(
    ({ projects, ...item }) => ({ ...item, project_title: projects.title }),
  );
}

// ── Project Links ──────────────────────────────────────────────────────

export async function addProjectLink(
  projectId: number,
  url: string,
  label?: string,
): Promise<ProjectLink> {
  const supabase = await client();
  const { data, error } = await supabase
    .from('project_links')
    .insert({ project_id: projectId, url, label: label ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as ProjectLink;
}

export async function deleteProjectLink(linkId: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('project_links').delete().eq('id', linkId);
  if (error) throw error;
}

// ── Report Docs (shared) ───────────────────────────────────────────────

export async function getReportDocs(search?: string): Promise<ReportDoc[]> {
  const supabase = await client();
  let q = supabase.from('report_docs').select('*');
  if (search) {
    const like = `%${search}%`;
    q = q.or(`content.ilike.${like},title.ilike.${like},date::text.ilike.${like}`);
  }
  q = q.order('date', { ascending: false });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReportDoc[];
}

export async function getReportDocById(id: number): Promise<ReportDoc | undefined> {
  const supabase = await client();
  const { data, error } = await supabase.from('report_docs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? undefined) as ReportDoc | undefined;
}

export async function createReportDoc(data: {
  date: string;
  title?: string;
  content?: string;
}): Promise<ReportDoc> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('report_docs')
    .insert({
      date: data.date,
      title: data.title ?? null,
      content: data.content ?? '',
    })
    .select('*')
    .single();
  if (error) throw error;
  return row as ReportDoc;
}

export async function updateReportDoc(
  id: number,
  data: { title?: string; content?: string; date?: string },
): Promise<ReportDoc | undefined> {
  const supabase = await client();
  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(data) as (keyof typeof data)[]) {
    if (data[k] !== undefined) patch[k] = data[k];
  }
  if (Object.keys(patch).length === 0) return getReportDocById(id);
  const { data: row, error } = await supabase
    .from('report_docs')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (row ?? undefined) as ReportDoc | undefined;
}

export async function deleteReportDoc(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('report_docs').delete().eq('id', id);
  if (error) throw error;
}
