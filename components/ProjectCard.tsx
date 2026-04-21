'use client';
import { useState } from 'react';
import type { ProjectWithLinks } from '@/lib/types';

interface Props {
  project: ProjectWithLinks;
  onUpdate: (id: number, data: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: '進行中', color: 'bg-blue-100 text-blue-700' },
  on_hold:   { label: '暫停', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
};

export default function ProjectCard({ project, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'next_step' | 'notes' | null>(null);
  const [draft, setDraft] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function startEdit(field: 'title' | 'next_step' | 'notes') {
    setEditingField(field);
    setDraft(project[field] ?? '');
  }

  function commitEdit() {
    if (editingField) {
      onUpdate(project.id, { [editingField]: draft });
    }
    setEditingField(null);
  }

  async function addLink() {
    if (!newLinkUrl.trim()) return;
    await fetch(`/api/projects/${project.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newLinkUrl.trim(), label: newLinkLabel.trim() || undefined }),
    });
    setNewLinkUrl('');
    setNewLinkLabel('');
    setAddingLink(false);
    onUpdate(project.id, {}); // trigger refresh
  }

  async function removeLink(linkId: number) {
    await fetch(`/api/projects/${project.id}/links/${linkId}`, { method: 'DELETE' });
    onUpdate(project.id, {});
  }

  const statusInfo = STATUS_LABELS[project.status];
  const isCompleted = project.status === 'completed';

  return (
    <div className={`bg-white rounded-lg border ${isCompleted ? 'border-gray-100 opacity-70' : 'border-gray-200'} overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        {/* Completion checkbox */}
        <button
          onClick={() => onUpdate(project.id, { status: isCompleted ? 'active' : 'completed' })}
          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
            isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
          }`}
        >
          {isCompleted && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingField === 'title' ? (
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingField(null); }}
              className="w-full text-sm font-semibold outline-none border-b border-blue-400 bg-transparent"
            />
          ) : (
            <span
              onDoubleClick={() => startEdit('title')}
              className={`text-sm font-semibold cursor-pointer select-none ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}
            >
              {project.title}
            </span>
          )}
        </div>

        {/* Status badge */}
        <button
          onClick={() => {
            const cycle: Record<string, string> = { active: 'on_hold', on_hold: 'active', completed: 'active' };
            onUpdate(project.id, { status: cycle[project.status] });
          }}
          className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
        >
          {statusInfo.label}
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-xs"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Next Step — always visible if not empty */}
      {(project.next_step || !isCompleted) && (
        <div className="px-3 pb-2 pl-10">
          {editingField === 'next_step' ? (
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Escape') setEditingField(null); }}
              rows={3}
              className="w-full text-xs outline-none border border-blue-300 rounded p-1.5 bg-white resize-none"
            />
          ) : (
            <div
              onClick={() => !isCompleted && startEdit('next_step')}
              className={`text-xs whitespace-pre-wrap ${project.next_step ? 'text-gray-700' : 'text-gray-300 italic'} ${!isCompleted ? 'cursor-pointer hover:text-gray-500' : ''}`}
            >
              {project.next_step
                ? <><span className="text-blue-500 font-medium mr-1">→</span>{project.next_step}</>
                : '+ Next Step...'}
            </div>
          )}
        </div>
      )}

      {/* Expanded section: Notes + Links */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2 pl-10 space-y-3 bg-gray-50">
          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            {editingField === 'notes' ? (
              <textarea
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Escape') setEditingField(null); }}
                rows={5}
                className="w-full text-xs outline-none border border-blue-300 rounded p-1.5 bg-white resize-y"
              />
            ) : (
              <div
                onClick={() => !isCompleted && startEdit('notes')}
                className={`text-xs whitespace-pre-wrap ${project.notes ? 'text-gray-700' : 'text-gray-300 italic'} ${!isCompleted ? 'cursor-pointer hover:text-gray-500' : ''} min-h-[2rem]`}
              >
                {project.notes || '+ 點擊新增備註...'}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">連結</p>
              <button onClick={() => setAddingLink(!addingLink)} className="text-xs text-blue-500 hover:text-blue-700">
                + 新增
              </button>
            </div>

            <div className="space-y-1">
              {project.links.map(link => (
                <div key={link.id} className="flex items-center gap-2 group">
                  <span className="text-gray-400 text-xs">🔗</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate flex-1"
                  >
                    {link.label || link.url}
                  </a>
                  <button
                    onClick={() => removeLink(link.id)}
                    className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {addingLink && (
              <div className="mt-2 space-y-1.5 p-2 bg-white rounded border border-gray-200">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder="標籤（選填）"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                />
                <input
                  autoFocus
                  type="text"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAddingLink(false); }}
                  placeholder="https://..."
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 font-mono"
                />
                <div className="flex gap-1">
                  <button onClick={addLink} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">加入</button>
                  <button onClick={() => setAddingLink(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">取消</button>
                </div>
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="pt-1 border-t border-gray-200">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">確定要刪除嗎？</span>
                <button onClick={() => onDelete(project.id)} className="text-xs text-red-600 font-medium hover:underline">確定</button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-300 hover:text-red-400">
                刪除專案
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
