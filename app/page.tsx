'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Creator } from '@/lib/types';
import Modal from '@/components/Modal';

const PLATFORMS = ['YouTube', 'Twitch', 'TikTok', 'Instagram', 'Twitter'];
const NICHES = ['FPS', 'Tech Review', 'Hardware', 'AI', 'Productivity', 'General Gaming', 'Esports', 'Content Creation'];
const STATUSES = ['prospect', 'evaluating', 'active', 'inactive', 'blacklisted'] as const;
const TIERS = ['top', 'mid', 'micro', 'nano'] as const;

function formatNumber(n: number | null | undefined): string {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

const STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-gray-700 text-gray-300',
  evaluating: 'bg-amber-900 text-amber-300',
  active: 'bg-green-900 text-green-300',
  inactive: 'bg-slate-800 text-slate-400',
  blacklisted: 'bg-red-900 text-red-300',
};

const TIER_COLORS: Record<string, string> = {
  top: 'bg-purple-900 text-purple-300',
  mid: 'bg-blue-900 text-blue-300',
  micro: 'bg-teal-900 text-teal-300',
  nano: 'bg-slate-800 text-slate-400',
};

const PLATFORM_COLORS: Record<string, string> = {
  YouTube: 'bg-red-900 text-red-300',
  Twitch: 'bg-purple-900 text-purple-300',
  TikTok: 'bg-pink-900 text-pink-300',
  Instagram: 'bg-orange-900 text-orange-300',
  Twitter: 'bg-sky-900 text-sky-300',
};

type FormValues = {
  handle: string; real_name: string; email: string; platforms: string[]; primary_platform: string;
  tier: string; niche: string[]; status: string;
  subscribers: string; avg_views: string; engagement_rate: string; country: string; language: string;
  agency: string; agency_contact: string; rate_card: string; affinity_tags: string; profile_url: string; notes: string;
};

const EMPTY_FORM: FormValues = {
  handle: '', real_name: '', email: '', platforms: [], primary_platform: '',
  tier: 'mid', niche: [], status: 'prospect',
  subscribers: '', avg_views: '', engagement_rate: '', country: '', language: 'English',
  agency: '', agency_contact: '', rate_card: '', affinity_tags: '', profile_url: '', notes: '',
};

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchCreators = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (tierFilter !== 'all') params.set('tier', tierFilter);
    const res = await fetch('/api/creators?' + params.toString());
    if (res.ok) setCreators(await res.json());
    setLoading(false);
  }, [statusFilter, tierFilter]);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  const filtered = creators.filter(c =>
    !search || c.handle.toLowerCase().includes(search.toLowerCase()) ||
    (c.real_name?.toLowerCase().includes(search.toLowerCase())) ||
    (c.agency?.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      subscribers: form.subscribers ? Number(form.subscribers) : null,
      avg_views: form.avg_views ? Number(form.avg_views) : null,
      engagement_rate: form.engagement_rate ? Number(form.engagement_rate) : null,
      affinity_tags: form.affinity_tags ? form.affinity_tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      primary_platform: form.primary_platform || null,
    };
    await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowAdd(false);
    setForm({ ...EMPTY_FORM });
    fetchCreators();
  }

  async function handleSaveEdit() {
    if (!selectedCreator) return;
    setSaving(true);
    const payload = {
      ...editForm,
      subscribers: editForm.subscribers ? Number(editForm.subscribers) : null,
      avg_views: editForm.avg_views ? Number(editForm.avg_views) : null,
      engagement_rate: editForm.engagement_rate ? Number(editForm.engagement_rate) : null,
      affinity_tags: typeof editForm.affinity_tags === 'string'
        ? editForm.affinity_tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : editForm.affinity_tags,
    };
    const res = await fetch(`/api/creators/${selectedCreator.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      const updated = await res.json();
      setSelectedCreator(updated);
      fetchCreators();
    }
    setSaving(false);
  }

  async function handleDelete(creator: Creator) {
    if (!confirm(`Delete @${creator.handle}? This cannot be undone.`)) return;
    await fetch(`/api/creators/${creator.id}`, { method: 'DELETE' });
    setSelectedCreator(null);
    fetchCreators();
  }

  function openEdit(creator: Creator) {
    setSelectedCreator(creator);
    setEditForm({
      handle: creator.handle,
      real_name: creator.real_name ?? '',
      email: creator.email ?? '',
      platforms: creator.platforms ?? [],
      primary_platform: creator.primary_platform ?? '',
      tier: creator.tier,
      niche: creator.niche ?? [],
      status: creator.status,
      subscribers: creator.subscribers?.toString() ?? '',
      avg_views: creator.avg_views?.toString() ?? '',
      engagement_rate: creator.engagement_rate?.toString() ?? '',
      country: creator.country ?? '',
      language: creator.language ?? 'English',
      agency: creator.agency ?? '',
      agency_contact: creator.agency_contact ?? '',
      rate_card: creator.rate_card ?? '',
      affinity_tags: (creator.affinity_tags ?? []).join(', '),
      profile_url: creator.profile_url ?? '',
      notes: creator.notes ?? '',
    });
  }

  function FormFields({ values, onChange }: { values: FormValues; onChange: (k: string, v: unknown) => void }) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Handle *</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.handle} onChange={e => onChange('handle', e.target.value)} required placeholder="@username" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Real Name</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.real_name} onChange={e => onChange('real_name', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input type="email" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.email} onChange={e => onChange('email', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.status} onChange={e => onChange('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <label key={p} className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={values.platforms.includes(p)} onChange={e => {
                  const updated = e.target.checked ? [...values.platforms, p] : values.platforms.filter(x => x !== p);
                  onChange('platforms', updated);
                }} className="rounded" />
                {p}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Primary Platform</label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.primary_platform} onChange={e => onChange('primary_platform', e.target.value)}>
              <option value="">—</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tier</label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.tier} onChange={e => onChange('tier', e.target.value)}>
              {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Niche</label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(n => (
              <label key={n} className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={values.niche.includes(n)} onChange={e => {
                  const updated = e.target.checked ? [...values.niche, n] : values.niche.filter(x => x !== n);
                  onChange('niche', updated);
                }} className="rounded" />
                {n}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subscribers</label>
            <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.subscribers} onChange={e => onChange('subscribers', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Avg Views</label>
            <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.avg_views} onChange={e => onChange('avg_views', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Eng. Rate %</label>
            <input type="number" step="0.01" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.engagement_rate} onChange={e => onChange('engagement_rate', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Country</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.country} onChange={e => onChange('country', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Language</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.language} onChange={e => onChange('language', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Agency</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.agency} onChange={e => onChange('agency', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Agency Contact</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.agency_contact} onChange={e => onChange('agency_contact', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Rate Card</label>
          <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.rate_card} onChange={e => onChange('rate_card', e.target.value)} placeholder="e.g. $5k per dedicated video" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Affinity Tags (comma-separated)</label>
          <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.affinity_tags as string} onChange={e => onChange('affinity_tags', e.target.value)} placeholder="geforce, rtx, dlss" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Profile URL</label>
          <input type="url" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.profile_url} onChange={e => onChange('profile_url', e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Notes</label>
          <textarea rows={3} className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm resize-none" value={values.notes} onChange={e => onChange('notes', e.target.value)} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Creators</h1>
        <button onClick={() => setShowAdd(true)} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm transition-colors">
          + Add Creator
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === s ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="all">All Tiers</option>
          {TIERS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search handles, names, agencies..."
          className="bg-gray-900 border border-gray-800 text-gray-100 rounded-md px-3 py-1.5 text-sm w-64 placeholder-gray-500" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Handle</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Platforms</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Subscribers</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Views</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Affinity Tags</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No creators yet. Add your first one!</td></tr>
              )}
              {filtered.map(creator => (
                <tr key={creator.id} onClick={() => openEdit(creator)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#76b900]">@{creator.handle}</div>
                    {creator.real_name && <div className="text-xs text-gray-500">{creator.real_name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(creator.platforms ?? []).slice(0, 3).map(p => (
                        <span key={p} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[p] ?? 'bg-gray-700 text-gray-300'}`}>{p.slice(0, 2)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[creator.tier] ?? ''}`}>{creator.tier}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[creator.status] ?? ''}`}>{creator.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{formatNumber(creator.subscribers)}</td>
                  <td className="px-4 py-3 text-gray-300">{formatNumber(creator.avg_views)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{creator.agency ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(creator.affinity_tags ?? []).slice(0, 3).map(tag => (
                        <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-800 text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleDelete(creator)} className="text-gray-600 hover:text-red-400 transition-colors text-lg">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Creator" onClose={() => setShowAdd(false)} wide>
          <form onSubmit={handleAdd}>
            <FormFields values={form} onChange={(k, v) => setForm(prev => ({ ...prev, [k]: v }))} />
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Creator'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Side Panel */}
      {selectedCreator && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-gray-900 border-l border-gray-800 shadow-2xl z-40 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-100">@{selectedCreator.handle}</h2>
            <button onClick={() => setSelectedCreator(null)} className="text-gray-400 hover:text-gray-100 text-xl">×</button>
          </div>
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <FormFields values={editForm} onChange={(k, v) => setEditForm(prev => ({ ...prev, [k]: v }))} />
          </div>
          <div className="px-5 py-4 border-t border-gray-800 flex justify-between">
            <button onClick={() => handleDelete(selectedCreator)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
            <div className="flex gap-3">
              <button onClick={() => setSelectedCreator(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
