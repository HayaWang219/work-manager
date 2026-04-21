'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReportDoc } from '@/lib/types';

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

export default function ReportsPage() {
  const [docs, setDocs] = useState<ReportDoc[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = docs.find(d => d.id === selectedId) ?? null;

  const fetchDocs = useCallback(async (q?: string) => {
    const url = q ? `/api/reports?search=${encodeURIComponent(q)}` : '/api/reports';
    const res = await fetch(url);
    const data: ReportDoc[] = await res.json();
    setDocs(data);
    return data;
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Select first doc on load
  useEffect(() => {
    if (docs.length > 0 && selectedId === null) {
      selectDoc(docs[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  function selectDoc(doc: ReportDoc) {
    setSelectedId(doc.id);
    setContent(doc.content);
    setTitle(doc.title ?? '');
    setDate(doc.date);
    setDirty(false);
  }

  // Auto-save after 1s of inactivity
  useEffect(() => {
    if (!dirty || !selectedId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/reports/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title, date }),
      });
      setDirty(false);
      setSaving(false);
      setDocs(prev => prev.map(d =>
        d.id === selectedId ? { ...d, content, title, date } : d
      ));
    }, 1000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [content, title, date, dirty, selectedId]);

  async function handleSearch(q: string) {
    setSearch(q);
    await fetchDocs(q);
  }

  async function createNew() {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, title: '', content: '' }),
    });
    const doc: ReportDoc = await res.json();
    setDocs(prev => [doc, ...prev]);
    selectDoc(doc);
  }

  async function deleteDoc(id: number) {
    if (!confirm('刪除這份週報？')) return;
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    if (selectedId === id) {
      if (newDocs.length > 0) selectDoc(newDocs[0]);
      else { setSelectedId(null); setContent(''); setTitle(''); }
    }
  }

  function copyToClipboard() {
    const header = title ? `${date}  ${title}\n${'─'.repeat(40)}\n` : `${date}\n${'─'.repeat(40)}\n`;
    navigator.clipboard.writeText(header + content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Preview: count search matches in selected doc
  const matchCount = search && content
    ? (content.match(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? []).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-gray-800">工作管理</h1>
          <nav className="flex items-center gap-1">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">今日待辦</a>
            <a href="/projects" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">專案追蹤</a>
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded">週報記錄</span>
          </nav>
        </div>
        <a href="/setup" className="text-xs text-gray-400 hover:text-gray-600">設定</a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: doc list */}
        <div className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="🔍 搜尋..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-gray-50"
            />
          </div>

          {/* New button */}
          <div className="px-3 py-2 border-b border-gray-100">
            <button
              onClick={createNew}
              className="w-full text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg py-1.5 transition-colors"
            >
              + 新增週報
            </button>
          </div>

          {/* Doc list */}
          <div className="flex-1 overflow-y-auto">
            {docs.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">沒有紀錄</p>
            )}
            {docs.map(doc => {
              const preview = doc.content.split('\n').find(l => l.trim()) ?? '';
              const isSelected = doc.id === selectedId;
              return (
                <button
                  key={doc.id}
                  onClick={() => selectDoc(doc)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 group transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {search ? highlight(doc.date, search) : doc.date}
                    {doc.title && (
                      <span className="ml-1 text-xs text-gray-500 font-normal">
                        {search ? highlight(doc.title, search) : doc.title}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {search ? highlight(preview.slice(0, 60), search) : preview.slice(0, 60)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="date"
                    value={date}
                    onChange={e => { setDate(e.target.value); setDirty(true); }}
                    className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setDirty(true); }}
                    placeholder="標題（選填）"
                    className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {saving && <span className="text-xs text-gray-400">儲存中...</span>}
                  {!saving && !dirty && <span className="text-xs text-gray-300">已儲存</span>}
                  {search && matchCount > 0 && (
                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                      {matchCount} 個符合
                    </span>
                  )}
                  <button
                    onClick={copyToClipboard}
                    className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {copied ? '✓ 已複製' : '複製到剪貼簿'}
                  </button>
                  <button
                    onClick={() => deleteDoc(selected.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5"
                  >
                    刪除
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-hidden relative">
                {search ? (
                  // Search mode: show highlighted read-only preview
                  <div className="h-full overflow-y-auto p-6">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {highlight(content, search)}
                    </pre>
                  </div>
                ) : (
                  // Edit mode: raw textarea
                  <textarea
                    value={content}
                    onChange={e => { setContent(e.target.value); setDirty(true); }}
                    placeholder="在這裡貼上或撰寫週報內容..."
                    className="w-full h-full resize-none outline-none p-6 text-sm text-gray-700 leading-relaxed font-sans bg-white"
                    spellCheck={false}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 mb-3">還沒有週報紀錄</p>
                <button
                  onClick={createNew}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + 新增第一份週報
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
