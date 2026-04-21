'use client';
import { useState, useRef, useEffect } from 'react';
import type { Task } from '@/lib/types';
import { categoryColor } from '@/app/page';

interface Props {
  task: Task;
  categories?: string[];
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
}

export default function TaskCard({ task, categories = [], onUpdate, onDelete }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(false);
  const [editNotes, setEditNotes] = useState(task.notes ?? '');
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? '');
  const [editScheduled, setEditScheduled] = useState(task.scheduled_date ?? '');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
  useEffect(() => {
    setEditTitle(task.title);
    setEditNotes(task.notes ?? '');
    setEditDueDate(task.due_date ?? '');
    setEditScheduled(task.scheduled_date ?? '');
  }, [task]);

  function submitTitle() {
    setEditingTitle(false);
    if (editTitle.trim() && editTitle.trim() !== task.title)
      onUpdate(task.id, { title: editTitle.trim() });
    else setEditTitle(task.title);
  }

  function dueDateColor(d?: string) {
    if (!d) return 'text-gray-400';
    const today = new Date().toISOString().split('T')[0];
    const diff = Math.ceil((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
    if (diff < 0) return 'text-red-500';
    if (diff <= 3) return 'text-orange-500';
    return 'text-gray-400';
  }

  return (
    <div className={`group rounded hover:bg-gray-50 ${task.status === 'done' ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2 py-1.5 px-1">
        {/* Done checkbox */}
        <button
          onClick={() => onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
          className={`flex-shrink-0 w-4 h-4 rounded border ${
            task.status === 'done' ? 'bg-blue-500 border-blue-500' : 'border-gray-300 hover:border-blue-400'
          } flex items-center justify-center`}
        >
          {task.status === 'done' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              ref={titleRef}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={submitTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') submitTitle();
                if (e.key === 'Escape') { setEditTitle(task.title); setEditingTitle(false); }
              }}
              className="w-full text-sm outline-none bg-white border-b border-blue-400 py-0.5"
            />
          ) : (
            <span
              onClick={() => { setEditingTitle(true); setEditTitle(task.title); }}
              className={`text-sm cursor-text select-none block truncate ${
                task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'
              }`}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Category tag */}
        {task.category && (
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${categoryColor(task.category)}`}>
            {task.category}
          </span>
        )}

        {/* Due date badge */}
        {task.due_date && !expanded && (
          <span className={`text-xs flex-shrink-0 ${dueDateColor(task.due_date)}`}>{task.due_date}</span>
        )}

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onUpdate(task.id, { report_flag: !task.report_flag })}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              task.report_flag
                ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-gray-400 border-gray-200 hover:text-amber-500 hover:border-amber-200'
            }`}
          >週報</button>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
              expanded
                ? 'text-blue-600 bg-blue-50 border-blue-200'
                : 'text-gray-400 border-gray-200 hover:text-gray-600'
            }`}
          >詳細</button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >刪除</button>
        </div>

        {task.report_flag && (
          <span className="text-xs text-amber-500 font-medium flex-shrink-0">週報</span>
        )}
      </div>

      {/* Detail panel */}
      {expanded && (
        <div className="ml-6 mr-2 mb-2 space-y-2 p-2.5 bg-gray-50 rounded border border-gray-100">
          {/* Category */}
          <div className="relative">
            <label className="text-xs text-gray-400 block mb-0.5">分類標籤</label>
            <button
              onClick={() => setShowCatPicker(!showCatPicker)}
              className={`text-xs px-2 py-1 rounded border ${
                task.category ? `${categoryColor(task.category)} border-transparent` : 'text-gray-400 border-gray-200'
              }`}
            >
              {task.category || '無標籤'}
            </button>
            {showCatPicker && (
              <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[140px]">
                <button
                  onClick={() => { onUpdate(task.id, { category: undefined }); setShowCatPicker(false); }}
                  className="block w-full text-left text-xs text-gray-400 px-2 py-1 hover:bg-gray-50 rounded"
                >無標籤</button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { onUpdate(task.id, { category: cat }); setShowCatPicker(false); }}
                    className={`block w-full text-left text-xs px-2 py-1 rounded mt-0.5 ${categoryColor(cat)}`}
                  >{cat}</button>
                ))}
                <input
                  type="text"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCatInput.trim()) {
                      onUpdate(task.id, { category: newCatInput.trim() });
                      setNewCatInput('');
                      setShowCatPicker(false);
                    }
                  }}
                  placeholder="+ 新增標籤"
                  className="mt-1 w-full text-xs border border-dashed border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
                />
              </div>
            )}
          </div>

          {/* Scheduled date */}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">排定日期</label>
            <input
              type="date"
              value={editScheduled}
              onChange={e => setEditScheduled(e.target.value)}
              onBlur={() => {
                if (editScheduled !== (task.scheduled_date ?? ''))
                  onUpdate(task.id, { scheduled_date: editScheduled || undefined });
              }}
              className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">備註</label>
            <textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              onBlur={() => {
                if (editNotes.trim() !== (task.notes ?? ''))
                  onUpdate(task.id, { notes: editNotes.trim() || undefined });
              }}
              rows={2}
              placeholder="點此新增備註..."
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 resize-none bg-white"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs text-gray-400 block mb-0.5">到期日</label>
            <input
              type="date"
              value={editDueDate}
              onChange={e => setEditDueDate(e.target.value)}
              onBlur={() => {
                if (editDueDate !== (task.due_date ?? ''))
                  onUpdate(task.id, { due_date: editDueDate || undefined });
              }}
              className={`text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white ${dueDateColor(editDueDate)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
