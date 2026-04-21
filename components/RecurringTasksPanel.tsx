'use client';
import { useState, useEffect } from 'react';
import type { RecurringTemplate } from '@/lib/types';

export default function RecurringTasksPanel() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [open, setOpen] = useState(false);

  async function fetchTemplates() {
    const res = await fetch('/api/recurring');
    setTemplates(await res.json());
  }

  useEffect(() => { fetchTemplates(); }, []);

  async function addTemplate() {
    if (!newTitle.trim()) return;
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle('');
    fetchTemplates();
  }

  async function toggleActive(t: RecurringTemplate) {
    await fetch(`/api/recurring/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    fetchTemplates();
  }

  async function deleteTemplate(id: number) {
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    fetchTemplates();
  }

  const activeTemplates = templates.filter(t => t.is_active);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">每週固定任務</h3>
        <button onClick={() => setOpen(!open)} className="text-xs text-gray-400 hover:text-gray-600">
          {open ? '收起' : '管理'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-2">每週一自動重置</p>

      <div className="space-y-1">
        {activeTemplates.length === 0 && !open && (
          <p className="text-xs text-gray-400">還沒有固定任務</p>
        )}
        {activeTemplates.map(t => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs text-gray-700 flex-1">{t.title}</span>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="space-y-1.5 mb-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.is_active}
                  onChange={() => toggleActive(t)}
                  className="rounded"
                />
                <span className={`text-xs flex-1 ${t.is_active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {t.title}
                </span>
                <button onClick={() => deleteTemplate(t.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTemplate(); }}
              placeholder="新增固定任務..."
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
            />
            <button
              onClick={addTemplate}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
            >
              新增
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
