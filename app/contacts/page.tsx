'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Contact } from '@/lib/types';
import Modal from '@/components/Modal';

const ORG_TYPES = ['agency', 'brand', 'internal', 'legal'] as const;

const ORG_COLORS: Record<string, string> = {
  agency: 'bg-blue-900 text-blue-300',
  brand: 'bg-purple-900 text-purple-300',
  internal: 'bg-green-900 text-green-300',
  legal: 'bg-amber-900 text-amber-300',
};

type ContactFormValues = { name: string; org: string; org_type: string; role: string; email: string; notes: string };
const EMPTY: ContactFormValues = { name: '', org: '', org_type: 'agency', role: '', email: '', notes: '' };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormValues>({ ...EMPTY });
  const [editForm, setEditForm] = useState<ContactFormValues>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    const res = await fetch('/api/contacts');
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const filtered = contacts.filter(c => {
    const matchType = typeFilter === 'all' || c.org_type === typeFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.org?.toLowerCase().includes(search.toLowerCase())) || (c.role?.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowAdd(false);
    setForm({ ...EMPTY });
    fetchContacts();
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/contacts/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    setSaving(false);
    setEditing(null);
    fetchContacts();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this contact?')) return;
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    fetchContacts();
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setEditForm({ name: c.name, org: c.org ?? '', org_type: c.org_type, role: c.role ?? '', email: c.email ?? '', notes: c.notes ?? '' });
  }

  function ContactForm({ values, onChange }: { values: ContactFormValues; onChange: (k: string, v: string) => void }) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name *</label>
            <input required className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.name} onChange={e => onChange('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Organization</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.org} onChange={e => onChange('org', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <select className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.org_type} onChange={e => onChange('org_type', e.target.value)}>
              {ORG_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Role / Title</label>
            <input className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.role} onChange={e => onChange('role', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Email</label>
          <input type="email" className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm" value={values.email} onChange={e => onChange('email', e.target.value)} />
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Contacts</h1>
        <button onClick={() => setShowAdd(true)} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm transition-colors">+ Add Contact</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {['all', ...ORG_TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-md text-sm transition-colors ${typeFilter === t ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, org, role..."
          className="bg-gray-900 border border-gray-800 text-gray-100 rounded-md px-3 py-1.5 text-sm w-64 placeholder-gray-500" />
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 && <div className="text-gray-500 text-sm col-span-3">No contacts yet.</div>}
          {filtered.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORG_COLORS[c.org_type]}`}>{c.org_type}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-gray-500 hover:text-[#76b900] text-sm transition-colors">✎</button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 text-sm transition-colors">🗑</button>
                </div>
              </div>
              <div className="font-semibold text-gray-100">{c.name}</div>
              {(c.org || c.role) && (
                <div className="text-sm text-gray-400 mt-0.5">{[c.org, c.role].filter(Boolean).join(' · ')}</div>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-sm text-[#76b900] hover:underline mt-1 block">{c.email}</a>
              )}
              {c.notes && <div className="text-xs text-gray-500 mt-2 line-clamp-2">{c.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Contact" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <ContactForm values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} />
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button type="button" onClick={() => setShowAdd(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit — ${editing.name}`} onClose={() => setEditing(null)}>
          <ContactForm values={editForm} onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))} />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
            <button onClick={() => setEditing(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-md px-4 py-2 text-sm">Cancel</button>
            <button onClick={handleSaveEdit} disabled={saving} className="bg-[#76b900] hover:bg-[#8fd400] text-black font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
