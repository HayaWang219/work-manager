'use client';
import { useState, useRef, useEffect } from 'react';
import type { ProjectWithLinks, ProjectItem } from '@/lib/types';

interface Props {
  project: ProjectWithLinks;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}

const STATUS_CONFIG = {
  active:    { label: '進行中', dot: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  on_hold:   { label: '暫停中', dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  completed: { label: '已完成', dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
} as const;

function InlineEdit({
  value, placeholder, multiline, className, onSave,
}: {
  value: string; placeholder: string; multiline?: boolean;
  className?: string; onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      },
      className: `w-full outline-none bg-white border border-blue-400 rounded px-2 py-1 text-sm resize-none ${className ?? ''}`,
    };
    return multiline
      ? <textarea {...shared} rows={Math.max(2, draft.split('\n').length + 1)} />
      : <input {...shared as React.InputHTMLAttributes<HTMLInputElement>} />;
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text min-h-[1.5rem] text-sm whitespace-pre-wrap break-words ${
        value ? 'text-gray-700' : 'text-gray-300 italic'
      } hover:bg-blue-50 rounded px-1 -mx-1 transition-colors ${className ?? ''}`}
    >
      {value || placeholder}
    </div>
  );
}

function dueDateStyle(dateStr?: string): string {
  if (!dateStr) return 'text-gray-300 italic';
  const today = new Date().toISOString().split('T')[0];
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return 'text-red-600 font-semibold';
  if (diff <= 3) return 'text-orange-500 font-semibold';
  if (diff <= 7) return 'text-yellow-600';
  return 'text-gray-500';
}

function dueDateLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const today = new Date().toISOString().split('T')[0];
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return `逾期 ${Math.abs(diff)}天`;
  if (diff === 0) return '今天到期';
  if (diff === 1) return '明天到期';
  return dateStr;
}

export default function ProjectRow({ project, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [addingLink, setAddingLink] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [items, setItems] = useState<ProjectItem[]>(project.items ?? []);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const newItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setItems(project.items ?? []); }, [project.items]);
  useEffect(() => { if (addingItem) newItemRef.current?.focus(); }, [addingItem]);

  const cfg = STATUS_CONFIG[project.status];
  const isCompleted = project.status === 'completed';

  function cycleStatus() {
    const cycle: Record<string, string> = { active: 'on_hold', on_hold: 'active', completed: 'active' };
    onUpdate(project.id, { status: cycle[project.status] });
  }

  async function addLink() {
    if (!newUrl.trim()) return;
    await fetch(`/api/projects/${project.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl.trim(), label: newLabel.trim() || undefined }),
    });
    setNewUrl(''); setNewLabel(''); setAddingLink(false);
    onUpdate(project.id, {});
  }

  async function removeLink(linkId: number) {
    await fetch(`/api/projects/${project.id}/links/${linkId}`, { method: 'DELETE' });
    onUpdate(project.id, {});
  }

  async function addItem() {
    if (!newItemTitle.trim()) return;
    const res = await fetch(`/api/projects/${project.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newItemTitle.trim() }),
    });
    const item = await res.json();
    setItems(prev => [...prev, item]);
    setNewItemTitle('');
    setAddingItem(false);
  }

  async function updateItem(itemId: number, data: Partial<ProjectItem>) {
    const res = await fetch(`/api/projects/${project.id}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setItems(prev => prev.map(it => it.id === itemId ? updated : it));
  }

  async function deleteItem(itemId: number) {
    await fetch(`/api/projects/${project.id}/items/${itemId}`, { method: 'DELETE' });
    setItems(prev => prev.filter(it => it.id !== itemId));
  }

  const activeItems = items.filter(it => it.status === 'active');
  const doneItems = items.filter(it => it.status === 'done');

  return (
    <div className={`border-b border-gray-100 ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Main row */}
      <div className="flex items-start gap-0 hover:bg-gray-50 group">

        {/* Done checkbox */}
        <div className="flex-shrink-0 w-10 flex justify-center pt-3">
          <button
            onClick={() => onUpdate(project.id, { status: isCompleted ? 'active' : 'completed' })}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {isCompleted && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Project name — fixed width */}
        <div className="w-44 flex-shrink-0 py-2.5 pr-3">
          <InlineEdit
            value={project.title}
            placeholder="專案名稱"
            onSave={v => onUpdate(project.id, { title: v })}
            className={isCompleted ? 'line-through text-gray-400' : 'font-medium'}
          />
          {items.length > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">
              {doneItems.length}/{items.length} 完成
            </div>
          )}
        </div>

        {/* Status badge — click to cycle */}
        <div className="w-20 flex-shrink-0 py-2.5 pr-3">
          <button
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.text} ${cfg.bg} ${cfg.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </button>
        </div>

        {/* Next Step — takes remaining space */}
        <div className="flex-1 py-2.5 pr-3 min-w-0">
          <InlineEdit
            value={project.next_step ?? ''}
            placeholder="點此寫 Next Step..."
            multiline
            onSave={v => onUpdate(project.id, { next_step: v })}
          />
        </div>

        {/* Links preview */}
        <div className="w-36 flex-shrink-0 py-2.5 pr-2">
          {project.links.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {project.links.slice(0, 2).map(l => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate block">
                  🔗 {l.label || new URL(l.url).hostname.replace('www.','')}
                </a>
              ))}
              {project.links.length > 2 && (
                <span className="text-xs text-gray-400">+{project.links.length - 2} 個連結</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-300 italic">無連結</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 py-2.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setExpanded(!expanded); if (!expanded) setShowDetails(false); }}
            title="展開項目"
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${expanded ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => { if (confirm(`刪除「${project.title}」？`)) onDelete(project.id); }}
            className="text-xs px-1.5 py-0.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="ml-10 mr-2 mb-3 space-y-2">

          {/* Sub-items table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            {/* Table header */}
            <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_8rem_2rem] gap-0 bg-gray-50 border-b border-gray-200 px-2 py-1.5">
              <div />
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">項目</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">目前進度</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Next Step</div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">到期日</div>
              <div />
            </div>

            {/* Active items */}
            {activeItems.map(item => (
              <div key={item.id} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_8rem_2rem] gap-0 items-start border-b border-gray-100 px-2 py-1.5 hover:bg-gray-50 group/item">
                <div className="flex justify-center pt-0.5">
                  <button
                    onClick={() => updateItem(item.id, { status: 'done' })}
                    className="w-3.5 h-3.5 rounded border border-gray-300 hover:border-green-400 flex-shrink-0 mt-0.5"
                  />
                </div>
                <div className="px-1">
                  <InlineEdit value={item.title} placeholder="項目名稱"
                    onSave={v => updateItem(item.id, { title: v })} />
                </div>
                <div className="px-1">
                  <InlineEdit value={item.progress ?? ''} placeholder="—"
                    onSave={v => updateItem(item.id, { progress: v })} />
                </div>
                <div className="px-1">
                  <InlineEdit value={item.next_step ?? ''} placeholder="—"
                    onSave={v => updateItem(item.id, { next_step: v })} />
                </div>
                <div className="px-1">
                  <InlineEdit
                    value={item.due_date ?? ''}
                    placeholder="YYYY-MM-DD"
                    onSave={v => updateItem(item.id, { due_date: v || undefined })}
                    className={dueDateStyle(item.due_date)}
                  />
                  {item.due_date && (
                    <div className={`text-xs ${dueDateStyle(item.due_date)}`}>{dueDateLabel(item.due_date)}</div>
                  )}
                </div>
                <div className="flex justify-center pt-0.5 opacity-0 group-hover/item:opacity-100">
                  <button onClick={() => deleteItem(item.id)}
                    className="text-xs text-gray-300 hover:text-red-400 px-1">✕</button>
                </div>
              </div>
            ))}

            {/* Done items (collapsed count + toggle) */}
            {doneItems.length > 0 && (
              <DoneItemsSection items={doneItems} onRestore={id => updateItem(id, { status: 'active' })} onDelete={deleteItem} />
            )}

            {/* Add item row */}
            <div className="px-2 py-1.5">
              {addingItem ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 flex-shrink-0" />
                  <input
                    ref={newItemRef}
                    type="text"
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addItem();
                      if (e.key === 'Escape') { setAddingItem(false); setNewItemTitle(''); }
                    }}
                    onBlur={() => { if (!newItemTitle.trim()) { setAddingItem(false); } else { addItem(); } }}
                    placeholder="新增項目..."
                    className="flex-1 text-sm border border-blue-400 rounded px-2 py-1 outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingItem(true)}
                  className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 py-0.5"
                >
                  + 新增項目
                </button>
              )}
            </div>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            {showDetails ? '▲' : '▶'} 詳細資料（備註、連結）
          </button>

          {/* Details: Notes + Links */}
          {showDetails && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">備註 Notes</p>
                <InlineEdit
                  value={project.notes ?? ''}
                  placeholder="點此寫備註..."
                  multiline
                  onSave={v => onUpdate(project.id, { notes: v })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">相關連結</p>
                  <button onClick={() => setAddingLink(!addingLink)} className="text-xs text-blue-500 hover:text-blue-700">+ 新增</button>
                </div>
                <div className="space-y-1">
                  {project.links.map(link => (
                    <div key={link.id} className="flex items-center gap-2 group/link">
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex-1 truncate">
                        🔗 {link.label || link.url}
                      </a>
                      <button onClick={() => removeLink(link.id)}
                        className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover/link:opacity-100">✕</button>
                    </div>
                  ))}
                  {project.links.length === 0 && !addingLink && (
                    <p className="text-xs text-gray-300 italic">還沒有連結</p>
                  )}
                </div>
                {addingLink && (
                  <div className="mt-2 space-y-1.5 p-2 bg-white rounded border border-gray-200">
                    <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                      placeholder="標籤（選填）"
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400" />
                    <input autoFocus type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAddingLink(false); }}
                      placeholder="https://..."
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 font-mono" />
                    <div className="flex gap-1">
                      <button onClick={addLink} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">加入</button>
                      <button onClick={() => setAddingLink(false)} className="text-xs text-gray-400 px-2 py-1">取消</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DoneItemsSection({ items, onRestore, onDelete }: {
  items: ProjectItem[];
  onRestore: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-dashed border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 flex items-center gap-1"
      >
        {open ? '▼' : '▶'} 已完成 ({items.length})
      </button>
      {open && items.map(item => (
        <div key={item.id} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_8rem_2rem] gap-0 items-start px-2 py-1 hover:bg-gray-50 opacity-50 group/item">
          <div className="flex justify-center pt-0.5">
            <button
              onClick={() => onRestore(item.id)}
              className="w-3.5 h-3.5 rounded border bg-green-400 border-green-400 flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
          <div className="px-1 col-span-3 text-sm line-through text-gray-400">{item.title}</div>
          <div className="px-1 text-xs text-gray-300">{item.due_date ?? ''}</div>
          <div className="flex justify-center pt-0.5 opacity-0 group-hover/item:opacity-100">
            <button onClick={() => onDelete(item.id)} className="text-xs text-gray-300 hover:text-red-400 px-1">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
