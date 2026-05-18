'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Campaign, Deliverable, Creator } from '@/lib/types';
import Modal from '@/components/Modal';

const CAMPAIGN_TYPES = ['launch', 'event', 'sustained', 'collab'];
const STATUSES = ['planning', 'active', 'completed', 'cancelled'] as const;
const DELIVERABLE_TYPES = ['dedicated_video', 'integration', 'short', 'stream', 'post'];
const PLATFORMS = ['YouTube', 'Twitch', 'TikTok', 'Instagram', 'Twitter'];

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-900 text-blue-300',
  active: 'bg-green-900 text-green-300',
  completed: 'bg-gray-700 text-gray-400',
  cancelled: 'bg-red-900 text-red-300',
};

const TYPE_COLORS: Record<string, string> = {
  launch: 'bg-indigo-900 text-indigo-300',
  event: 'bg-violet-900 text-violet-300',
  sustained: 'bg-teal-900 text-teal-300',
  collab: 'bg-orange-900 text-orange-300',
};

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-gray-700 text-gray-300',
  contacted: 'bg-blue-900 text-blue-300',
  onboarding: 'bg-indigo-900 text-indigo-300',
  brief_sent: 'bg-violet-900 text-violet-300',
  draft_review: 'bg-amber-900 text-amber-300',
  approved: 'bg-lime-900 text-lime-300',
  published: 'bg-green-900 text-green-300',
  data_in: 'bg-teal-900 text-teal-300',
};

const EMPTY_CAMPAIGN = { title: '', product: '', campaign_type: 'launch', status: 'planning' as const, brief_url: '', budget: '', start_date: '', end_date: '', notes: '' };
const EMPTY_DELIVERABLE = { creator_id: '', deliverable_type: 'dedicated_video', platform: '', due_date: '', payment_amount: '', notes: '' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_CAMPAIGN });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState({ ...EMPTY_CAMPAIGN });
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [showAddLink, setShowAddLink] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({ ...EMPTY_DELIVERABLE });
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch('/api/campaigns');
    if (res.ok) setCampaigns(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  useEffect(() => { fetch('/api/creators').then(r => r.json()).then(setCreators).catch(() => {}); }, []);

  const filtered = campaigns.filter(c => statusFilter === 'all' || c.status === statusFilter);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, budget: form.budget ? Number(form.budget) : null, start_date: form.start_date || null, end_date: form.end_date || null, sort_order: 0, created_by: null };
    await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    setShowAdd(false);
    setForm({ ...EMPTY_CAMPAIGN });
    fetchCampaigns();
  }

  async function loadCampaignDetail(id: number) {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedCampaign(data);
      setEditCampaign({
        title: data.title, product: data.product ?? '', campaign_type: data.campaign_type,
        status: data.status, brief_url: data.brief_url ?? '', budget: data.budget?.toString() ?? '',
        start_date: data.start_date ?? '', end_date: data.end_date ?? '', notes: data.notes ?? '',
      });
    }
  }

  async function handleSaveCampaign() {
    if (!selectedCampaign) return;
    setSaving(true);
    const payload = { ...editCampaign, budget: editCampaign.budget ? Number(editCampaign.budget) : null, start_date: editCampaign.start_date || null, end_date: editCampaign.end_date || null };
    await fetch(`/api/campaigns/${selectedCampaign.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    loadCampaignDetail(selectedCampaign.id);
    fetchCampaigns();
  }

  async function handleDeleteCampaign(id: number) {
    if (!confirm('Delete this campaign? All linked deliverables will be removed.')) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    setSelectedCampaign(null);
    fetchCampaigns();
  }

  async function handleAddLink() {
    if (!selectedCampaign || !newLink.url) return;
    await fetch(`/api/campaigns/${selectedCampaign.id}/links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newLink) });
    setNewLink({ label: '', url: '' });
    setShowAddLink(false);
    loadCampaignDetail(selectedCampaign.id);
  }

  async function handleDeleteLink(linkId: number) {
    if (!selectedCampaign) return;
    await fetch(`/api/campaigns/${selectedCampaign.id}/links?linkId=${linkId}`, { method: 'DELETE' });
    loadCampaignDetail(selectedCampaign.id);
  }

  async function handleAddDeliverable() {
    if (!selectedCampaign || !newDeliverable.creator_id) return;
    const payload = {
      campaign_id: selectedCampaign.id,
      creator_id: Number(newDeliverable.creator_id),
      deliverable_type: newDeliverable.deliverable_type,
      platform: newDeliverable.platform || null,
      due_date: newDeliverable.due_date || null,
      payment_amount: newDeliverable.payment_amount ? Number(newDeliverable.payment_amount) : null,
      notes: newDeliverable.notes || null,
      status: 'prospect',
    };
    await fetch('/api/deliverables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setNewDeliverable({ ...EMPTY_DELIVERABLE });
    setShowAddDeliverable(false);
    loadCampaignDetail(selectedCampaign.id);
  }

  async function handleDeleteDeliverable(delivId: number) {
    await fetch(`/api/deliverables/${delivId}`, { method: 'DELETE' });
    if (selectedCampaign) loadCampaignDetail(selectedCampaign.id);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Campaigns</h1>
        <button onClick={() => setShowAdd(true)} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm transition-colors">
          + New Campaign
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit mb-6">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${statusFilter === s ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.length === 0 && <div className="text-gray-500 text-sm col-span-2">No campaigns yet.</div>}
          {filtered.map(campaign => (
            <div key={campaign.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[campaign.status]}`}>{campaign.status}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[campaign.campaign_type] ?? 'bg-gray-700 text-gray-300'}`}>{campaign.campaign_type}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadCampaignDetail(campaign.id)} className="text-gray-400 hover:text-[#76b900] text-xs transition-colors">Details</button>
                  <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-gray-600 hover:text-red-400 transition-colors">🗑</button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-100 text-base mb-1">{campaign.title}</h3>
              {campaign.product && <div className="text-xs text-gray-400 mb-2">Product: {campaign.product}</div>}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                {campaign.start_date && <span>{campaign.start_date}{campaign.end_date ? ` → ${campaign.end_date}` : ''}</span>}
                {campaign.budget && <span className="text-gray-400">${campaign.budget.toLocaleString()}</span>}
              </div>
              {campaign.brief_url && (
                <a href={campaign.brief_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#76b900] hover:underline" onClick={e => e.stopPropagation()}>Brief ↗</a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Campaign Modal */}
      {showAdd && (
        <Modal title="New Campaign" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input required className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Product</label>
                <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.product} onChange={e => setForm(p => ({ ...p, product: e.target.value }))} placeholder="e.g. RTX 5090" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.campaign_type} onChange={e => setForm(p => ({ ...p, campaign_type: e.target.value }))}>
                  {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Budget ($)</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Brief URL</label>
              <input type="url" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={form.brief_url} onChange={e => setForm(p => ({ ...p, brief_url: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea rows={2} className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm resize-none" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <Modal title={selectedCampaign.title} onClose={() => setSelectedCampaign(null)} wide>
          <div className="space-y-6">
            {/* Edit fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.title} onChange={e => setEditCampaign(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Product</label>
                <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.product} onChange={e => setEditCampaign(p => ({ ...p, product: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.status} onChange={e => setEditCampaign(p => ({ ...p, status: e.target.value as typeof editCampaign.status }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Budget ($)</label>
                <input type="number" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.budget} onChange={e => setEditCampaign(p => ({ ...p, budget: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.start_date} onChange={e => setEditCampaign(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <input type="date" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.end_date} onChange={e => setEditCampaign(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Brief URL</label>
              <input type="url" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={editCampaign.brief_url} onChange={e => setEditCampaign(p => ({ ...p, brief_url: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea rows={2} className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm resize-none" value={editCampaign.notes} onChange={e => setEditCampaign(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveCampaign} disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Links</span>
                <button onClick={() => setShowAddLink(!showAddLink)} className="text-xs text-[#76b900] hover:underline">+ Add Link</button>
              </div>
              {showAddLink && (
                <div className="flex gap-2 mb-2">
                  <input className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-1.5 text-sm" placeholder="Label" value={newLink.label} onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))} />
                  <input className="flex-[2] bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-1.5 text-sm" placeholder="URL" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} />
                  <button onClick={handleAddLink} className="bg-[#76b900] text-black rounded-md px-3 py-1.5 text-sm font-semibold">Add</button>
                </div>
              )}
              <div className="space-y-1">
                {(selectedCampaign.links ?? []).map(link => (
                  <div key={link.id} className="flex items-center justify-between bg-gray-800 rounded-md px-3 py-1.5">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#76b900] hover:underline truncate">{link.label || link.url}</a>
                    <button onClick={() => handleDeleteLink(link.id)} className="text-gray-600 hover:text-red-400 ml-2 text-sm">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deliverables</span>
                <button onClick={() => setShowAddDeliverable(!showAddDeliverable)} className="text-xs text-[#76b900] hover:underline">+ Add Deliverable</button>
              </div>
              {showAddDeliverable && (
                <div className="bg-gray-800 rounded-lg p-3 mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Creator *</label>
                      <select className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-2 py-1.5 text-sm" value={newDeliverable.creator_id} onChange={e => setNewDeliverable(p => ({ ...p, creator_id: e.target.value }))}>
                        <option value="">Select creator...</option>
                        {creators.map(c => <option key={c.id} value={c.id}>@{c.handle}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Type</label>
                      <select className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-2 py-1.5 text-sm" value={newDeliverable.deliverable_type} onChange={e => setNewDeliverable(p => ({ ...p, deliverable_type: e.target.value }))}>
                        {DELIVERABLE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                      <select className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-2 py-1.5 text-sm" value={newDeliverable.platform} onChange={e => setNewDeliverable(p => ({ ...p, platform: e.target.value }))}>
                        <option value="">Any</option>
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                      <input type="date" className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-2 py-1.5 text-sm" value={newDeliverable.due_date} onChange={e => setNewDeliverable(p => ({ ...p, due_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Payment ($)</label>
                      <input type="number" className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-2 py-1.5 text-sm" value={newDeliverable.payment_amount} onChange={e => setNewDeliverable(p => ({ ...p, payment_amount: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAddDeliverable(false)} className="text-xs text-gray-400 hover:text-gray-200">Cancel</button>
                    <button onClick={handleAddDeliverable} className="bg-[#76b900] text-black rounded-md px-3 py-1 text-xs font-semibold">Add</button>
                  </div>
                </div>
              )}
              <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-3 py-2 text-left text-gray-500">Creator</th>
                      <th className="px-3 py-2 text-left text-gray-500">Type</th>
                      <th className="px-3 py-2 text-left text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left text-gray-500">Due</th>
                      <th className="px-3 py-2 text-left text-gray-500">Payment</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCampaign.deliverables ?? []).length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-600">No deliverables yet</td></tr>
                    )}
                    {(selectedCampaign.deliverables ?? []).map((d: Deliverable) => (
                      <tr key={d.id} className="border-b border-gray-800">
                        <td className="px-3 py-2 text-[#76b900]">@{d.creator?.handle ?? d.creator_id}</td>
                        <td className="px-3 py-2 text-gray-400">{d.deliverable_type.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2"><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${DELIVERABLE_STATUS_COLORS[d.status]}`}>{d.status.replace(/_/g, ' ')}</span></td>
                        <td className="px-3 py-2 text-gray-400">{d.due_date ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{d.payment_amount ? `$${d.payment_amount.toLocaleString()}` : '—'}</td>
                        <td className="px-3 py-2"><button onClick={() => handleDeleteDeliverable(d.id)} className="text-gray-600 hover:text-red-400">×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
