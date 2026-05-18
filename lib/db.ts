import 'server-only';
import { getSupabaseServerClient } from './supabase/server';
import type {
  Creator,
  Campaign,
  CampaignLink,
  Deliverable,
  Contact,
  Note,
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

// ── Creators ──────────────────────────────────────────────────────────────

export async function getCreators(filters?: { status?: string; tier?: string }): Promise<Creator[]> {
  const supabase = await client();
  let q = supabase.from('creators').select('*');
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters?.tier && filters.tier !== 'all') q = q.eq('tier', filters.tier);
  q = q.order('handle', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Creator[];
}

export async function getCreatorById(id: number): Promise<Creator | null> {
  const supabase = await client();
  const { data, error } = await supabase.from('creators').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data ?? null) as Creator | null;
}

export async function createCreator(data: Omit<Creator, 'id' | 'created_at' | 'updated_at'>): Promise<Creator> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('creators')
    .insert(data)
    .select('*')
    .single();
  if (error) throw error;
  return row as Creator;
}

export async function updateCreator(
  id: number,
  data: Partial<Omit<Creator, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Creator> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('creators')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return row as Creator;
}

export async function deleteCreator(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('creators').delete().eq('id', id);
  if (error) throw error;
}

// ── Campaigns ────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = await client();
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;

  if (!campaigns || campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id as number);
  const { data: links } = await supabase
    .from('campaign_links')
    .select('*')
    .in('campaign_id', ids);

  return campaigns.map((c) => ({
    ...(c as Campaign),
    links: ((links ?? []) as CampaignLink[]).filter((l) => l.campaign_id === c.id),
  }));
}

export async function getCampaignById(id: number): Promise<Campaign | null> {
  const supabase = await client();
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: links } = await supabase
    .from('campaign_links')
    .select('*')
    .eq('campaign_id', id);

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*, creators(id, handle, tier, primary_platform)')
    .eq('campaign_id', id);

  const shapedDeliverables = ((deliverables ?? []) as (Deliverable & { creators: Pick<Creator, 'id' | 'handle' | 'tier' | 'primary_platform'> | null })[]).map(
    ({ creators, ...d }) => ({ ...d, creator: creators ?? undefined }),
  );

  return {
    ...(data as Campaign),
    links: (links ?? []) as CampaignLink[],
    deliverables: shapedDeliverables,
  };
}

export async function createCampaign(
  data: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'links' | 'deliverables'>,
): Promise<Campaign> {
  const supabase = await client();
  const { data: last } = await supabase
    .from('campaigns')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;

  const { data: row, error } = await supabase
    .from('campaigns')
    .insert({ ...data, sort_order: nextOrder })
    .select('*')
    .single();
  if (error) throw error;
  return { ...(row as Campaign), links: [], deliverables: [] };
}

export async function updateCampaign(
  id: number,
  data: Partial<Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'links' | 'deliverables'>>,
): Promise<Campaign> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('campaigns')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return row as Campaign;
}

export async function deleteCampaign(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

export async function addCampaignLink(
  campaignId: number,
  label: string | null,
  url: string,
): Promise<CampaignLink> {
  const supabase = await client();
  const { data, error } = await supabase
    .from('campaign_links')
    .insert({ campaign_id: campaignId, label, url })
    .select('*')
    .single();
  if (error) throw error;
  return data as CampaignLink;
}

export async function deleteCampaignLink(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('campaign_links').delete().eq('id', id);
  if (error) throw error;
}

// ── Deliverables ─────────────────────────────────────────────────────────

export async function getDeliverables(filters?: {
  campaignId?: number;
  creatorId?: number;
  status?: string;
}): Promise<Deliverable[]> {
  const supabase = await client();
  let q = supabase
    .from('deliverables')
    .select('*, creators(id, handle, tier, primary_platform), campaigns(id, title)');
  if (filters?.campaignId) q = q.eq('campaign_id', filters.campaignId);
  if (filters?.creatorId) q = q.eq('creator_id', filters.creatorId);
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
  q = q.order('created_at', { ascending: true });
  const { data, error } = await q;
  if (error) throw error;

  return ((data ?? []) as (Deliverable & {
    creators: Pick<Creator, 'id' | 'handle' | 'tier' | 'primary_platform'> | null;
    campaigns: Pick<Campaign, 'id' | 'title'> | null;
  })[]).map(({ creators, campaigns, ...d }) => ({
    ...d,
    creator: creators ?? undefined,
    campaign: campaigns ?? undefined,
  }));
}

export async function createDeliverable(
  data: Omit<Deliverable, 'id' | 'created_at' | 'updated_at' | 'creator' | 'campaign'>,
): Promise<Deliverable> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('deliverables')
    .insert(data)
    .select('*')
    .single();
  if (error) throw error;
  return row as Deliverable;
}

export async function updateDeliverable(
  id: number,
  data: Partial<Omit<Deliverable, 'id' | 'created_at' | 'updated_at' | 'creator' | 'campaign'>>,
): Promise<Deliverable> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('deliverables')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return row as Deliverable;
}

export async function deleteDeliverable(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('deliverables').delete().eq('id', id);
  if (error) throw error;
}

// ── Contacts ─────────────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Contact[];
}

export async function createContact(
  data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>,
): Promise<Contact> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('contacts')
    .insert(data)
    .select('*')
    .single();
  if (error) throw error;
  return row as Contact;
}

export async function updateContact(
  id: number,
  data: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Contact> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('contacts')
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return row as Contact;
}

export async function deleteContact(id: number): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
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
