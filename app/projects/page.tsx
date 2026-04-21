'use client';
import { useState, useEffect, useCallback } from 'react';
import type { ProjectWithLinks } from '@/lib/types';
import ProjectRow from '@/components/ProjectRow';

type FilterStatus = 'active' | 'all' | 'completed';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithLinks[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchProjects = useCallback(async () => {
    const url = filter === 'all' ? '/api/projects?status=all' : `/api/projects?status=${filter}`;
    const res = await fetch(url);
    setProjects(await res.json());
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function addProject() {
    if (!newTitle.trim()) return;
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle('');
    setAdding(false);
    fetchProjects();
  }

  async function updateProject(id: number, data: Record<string, unknown>) {
    if (Object.keys(data).length > 0) {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    fetchProjects();
  }

  async function deleteProject(id: number) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  }

  const active = projects.filter(p => p.status === 'active');
  const onHold = projects.filter(p => p.status === 'on_hold');
  const completed = projects.filter(p => p.status === 'completed');

  const groups =
    filter === 'completed'
      ? [{ label: '', items: completed }]
      : filter === 'all'
      ? [
          { label: '進行中', items: active },
          { label: '暫停中', items: onHold },
          { label: '已完成', items: completed },
        ]
      : [
          { label: '進行中', items: active },
          { label: '暫停中', items: onHold },
        ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-gray-800">工作管理</h1>
          <nav className="flex items-center gap-1">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">
              今日待辦
            </a>
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded">
              專案追蹤
            </span>
            <a href="/reports" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">
              週報記錄
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {([
              ['active', '進行中'],
              ['completed', '已完成'],
              ['all', '全部'],
            ] as [FilterStatus, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === val
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAdding(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            + 新增專案
          </button>
        </div>
      </header>

      <div className="max-w-full">
        {/* Column headers */}
        <div className="flex items-center gap-0 px-0 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <div className="w-10 flex-shrink-0" />
          <div className="w-44 flex-shrink-0 py-2 pr-3">專案</div>
          <div className="w-20 flex-shrink-0 py-2 pr-3">狀態</div>
          <div className="flex-1 py-2 pr-3">Next Step（點擊直接編輯）</div>
          <div className="w-36 flex-shrink-0 py-2 pr-3">連結</div>
          <div className="w-14 flex-shrink-0" />
        </div>

        {/* Add new row */}
        {adding && (
          <div className="flex items-center gap-0 border-b border-blue-200 bg-blue-50">
            <div className="w-10 flex-shrink-0 flex justify-center">
              <div className="w-4 h-4 rounded border border-gray-300" />
            </div>
            <div className="w-44 flex-shrink-0 py-2 pr-3">
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addProject();
                  if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                }}
                placeholder="輸入專案名稱，按 Enter 新增..."
                className="w-full text-sm outline-none bg-transparent border-b border-blue-400"
              />
            </div>
            <div className="flex-1 py-2 flex items-center gap-2">
              <button onClick={addProject} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                新增
              </button>
              <button onClick={() => { setAdding(false); setNewTitle(''); }}
                className="text-xs text-gray-400 hover:text-gray-600">
                取消
              </button>
            </div>
          </div>
        )}

        {/* Project groups */}
        {groups.map(group => (
          group.items.length === 0 ? null : (
            <div key={group.label}>
              {group.label && (
                <div className="px-10 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group.label} ({group.items.length})
                  </span>
                </div>
              )}
              {group.items.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onUpdate={updateProject}
                  onDelete={deleteProject}
                />
              ))}
            </div>
          )
        ))}

        {projects.length === 0 && (
          <div className="text-center py-24 text-gray-300">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">
              {filter === 'completed' ? '還沒有已完成的專案' : '點「+ 新增專案」開始'}
            </p>
          </div>
        )}

        {/* Bottom add row */}
        {!adding && projects.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-b border-gray-100 text-left pl-10 transition-colors"
          >
            + 新增專案
          </button>
        )}
      </div>
    </div>
  );
}
