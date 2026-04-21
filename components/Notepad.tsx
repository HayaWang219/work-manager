'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/lib/types';

export default function Notepad() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async (q?: string) => {
    const url = q ? `/api/notes?q=${encodeURIComponent(q)}` : '/api/notes';
    const res = await fetch(url);
    setNotes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    const t = setTimeout(() => fetchNotes(search || undefined), 200);
    return () => clearTimeout(t);
  }, [search, fetchNotes]);

  async function addNote() {
    if (!newNote.trim()) return;
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNote.trim() }),
    });
    setNewNote('');
    fetchNotes(search || undefined);
  }

  async function togglePin(note: Note) {
    await fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: note.pinned === 1 ? 0 : 1 }),
    });
    fetchNotes(search || undefined);
  }

  async function deleteNote(id: number) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    fetchNotes(search || undefined);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return '剛剛';
    if (diff < 60) return `${diff} 分鐘前`;
    if (diff < 1440) return `${Math.floor(diff / 60)} 小時前`;
    return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">快速筆記</h3>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜尋筆記..."
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 mb-2 outline-none focus:border-blue-400"
      />

      <textarea
        value={newNote}
        onChange={e => setNewNote(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); }}
        placeholder="快速記下任何東西... (⌘+Enter 儲存)"
        rows={3}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 mb-1 outline-none focus:border-blue-400 resize-none"
      />
      <button
        onClick={addNote}
        className="w-full text-xs text-blue-600 hover:text-blue-800 text-left py-0.5 mb-2"
      >
        + 新增筆記
      </button>

      {loading ? (
        <p className="text-xs text-gray-400">載入中...</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className="group flex gap-2 p-1.5 rounded hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{note.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(note.updated_at)}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => togglePin(note)} className={`text-xs ${note.pinned ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}>📌</button>
                <button onClick={() => deleteNote(note.id)} className="text-xs text-gray-300 hover:text-red-400">✕</button>
              </div>
            </div>
          ))}
          {notes.length === 0 && <p className="text-xs text-gray-400">沒有筆記</p>}
        </div>
      )}
    </div>
  );
}
