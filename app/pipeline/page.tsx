'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Deliverable, Campaign, DeliverableStatus } from '@/lib/types';
import Modal from '@/components/Modal';

const STAGES: { key: DeliverableStatus; label: string; headerColor: string }[] = [
  { key: 'prospect',     label: 'Prospect',     headerColor: 'border-t-gray-500' },
  { key: 'contacted',    label: 'Contacted',    headerColor: 'border-t-blue-500' },
  { key: 'onboarding',   label: 'Onboarding',   headerColor: 'border-t-indigo-500' },
  { key: 'brief_sent',   label: 'Brief Sent',   headerColor: 'border-t-violet-500' },
  { key: 'draft_review', label: 'Draft Review', headerColor: 'border-t-amber-500' },
  { key: 'approved',     label: 'Approved',     headerColor: 'border-t-lime-500' },
  { key: 'published',    label: 'Published',    headerColor: 'border-t-green-500' },
  { key: 'data_in',      label: 'Data In',      headerColor: 'border-t-teal-500' },
];

const ALL_STATUSES: DeliverableStatus[] = ['prospect', 'contacted', 'onboarding', 'brief_sent', 'draft_review', 'approved', 'published', 'data_in'];

export default function PipelinePage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const [editForm, setEditForm] = useState<Partial<Deliverable>>({});
  const [saving, setSaving] = useState(false);

  const fetchDeliverables = useCallback(async () => {
    const params = new URLSearchParams();
    if (campaignFilter !== 'all') params.set('campaignId', campaignFilter);
    const res = await fetch('/api/deliverables?' + params.toString());
    if (res.ok) setDeliverables(await res.json());
    setLoading(false);
  }, [campaignFilter]);

  useEffect(() => { fetchDeliverables(); }, [fetchDeliverables]);
  useEffect(() => { fetch('/api/campaigns').then(r => r.json()).then(setCampaigns).catch(() => {}); }, []);

  const filtered = deliverables.filter(d =>
    !search || d.creator?.handle?.toLowerCase().includes(search.toLowerCase())
  );

  function getDueDateStyle(due: string | null): string {
    if (!due) return 'text-gray-500';
    const today = new Date();
    const d = new Date(due);
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-red-400';
    if (diff <= 3) return 'text-amber-400';
    return 'text-gray-500';
  }

  function openCard(d: Deliverable) {
    setSelected(d);
    setEditForm({ ...d });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const { creator, campaign, id, created_at, updated_at, ...payload } = editForm as Deliverable;
    await fetch(`/api/deliverables/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setSelected(null);
    fetchDeliverables();
  }

  async function handleDelete() {
    if (!selected || !confirm('Delete this deliverable?')) return;
    await fetch(`/api/deliverables/${selected.id}`, { method: 'DELETE' });
    setSelected(null);
    fetchDeliverables();
  }

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-100">Pipeline</h1>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-gray-300 rounded-md px-3 py-1.5 text-sm">
          <option value="all">All Campaigns</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..."
          className="bg-gray-900 border border-gray-800 text-gray-100 rounded-md px-3 py-1.5 text-sm w-52 placeholder-gray-500" />
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {STAGES.map(stage => {
            const cards = filtered.filter(d => d.status === stage.key);
            return (
              <div key={stage.key} className={`min-w-[200px] flex-shrink-0 bg-gray-900 border border-gray-800 rounded-lg border-t-2 ${stage.headerColor}`}>
                <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">{stage.label}</span>
                  <span className="text-xs bg-gray-800 text-gray-400 rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {cards.map(d => (
                    <div key={d.id} onClick={() => openCard(d)}
                      className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors">
                      <div className="font-medium text-[#76b900] text-sm">@{d.creator?.handle ?? '?'}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{d.campaign?.title ?? '—'}</div>
                      <div className="text-xs text-gray-500 mt-1">{d.deliverable_type.replace(/_/g, ' ')}</div>
                      {d.due_date && (
                        <div className={`text-xs mt-1 font-medium ${getDueDateStyle(d.due_date)}`}>Due {d.due_date}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <Modal title={`@${selected.creator?.handle ?? 'Deliverable'}`} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 bg-gray-800 rounded-lg p-3">
              <div><span className="text-gray-500 text-xs">Creator</span><div className="text-[#76b900] font-medium">@{selected.creator?.handle}</div></div>
              <div><span className="text-gray-500 text-xs">Campaign</span><div className="text-gray-200">{selected.campaign?.title}</div></div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm"
                value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as DeliverableStatus }))}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deliverable Type</label>
                <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.deliverable_type ?? ''} onChange={e => setEditForm(p => ({ ...p, deliverable_type: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.platform ?? ''} onChange={e => setEditForm(p => ({ ...p, platform: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.due_date ?? ''} onChange={e => setEditForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Publish Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.publish_date ?? ''} onChange={e => setEditForm(p => ({ ...p, publish_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Content URL</label>
              <input type="url" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.content_url ?? ''} onChange={e => setEditForm(p => ({ ...p, content_url: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Views</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.views ?? ''} onChange={e => setEditForm(p => ({ ...p, views: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Likes</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.likes ?? ''} onChange={e => setEditForm(p => ({ ...p, likes: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Comments</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.comments ?? ''} onChange={e => setEditForm(p => ({ ...p, comments: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Payment ($)</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.payment_amount ?? ''} onChange={e => setEditForm(p => ({ ...p, payment_amount: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Payment Status</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editForm.payment_status ?? 'pending'} onChange={e => setEditForm(p => ({ ...p, payment_status: e.target.value as 'pending' | 'invoiced' | 'paid' }))}>
                  <option value="pending">Pending</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea rows={3} className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm resize-none" value={editForm.notes ?? ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
