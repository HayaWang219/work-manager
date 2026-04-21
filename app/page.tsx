'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from '@/components/TaskCard';
import Notepad from '@/components/Notepad';
import CalendarStrip from '@/components/CalendarStrip';
import WeeklyReportPanel from '@/components/WeeklyReportPanel';
import RecurringTasksPanel from '@/components/RecurringTasksPanel';
import NotionSyncButton from '@/components/NotionSyncButton';
import RemindersPanel from '@/components/RemindersPanel';

type DayTab = 'today' | 'tomorrow' | 'week' | 'inbox';

function getDateStrings() {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const day = today.getDay();
  const diffToSun = day === 0 ? 0 : 7 - day;
  const sunday = new Date(today.getTime() + diffToSun * 86400000);
  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

const WEEKDAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

function formatWeekday(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${WEEKDAY_NAMES[d.getDay()]} ${dateStr.slice(5)}`;
}

// Deterministic category color based on name hash
const TAG_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-yellow-100 text-yellow-700',
  'bg-cyan-100 text-cyan-700',
];

export function categoryColor(cat: string): string {
  let hash = 0;
  for (const c of cat) hash = (hash * 31 + c.charCodeAt(0)) & 0xff;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [reportRefresh, setReportRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<DayTab>('today');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const { today, tomorrow, weekEnd } = getDateStrings();

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks?status=all');
    const data = await res.json();
    setTasks(data.tasks);
    setCategories(data.categories);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetch('/api/cron/monday-reset', { method: 'POST' }).then(() => fetchTasks());
  }, [fetchTasks]);

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    const scheduledDate = activeTab === 'today' ? today
      : activeTab === 'tomorrow' ? tomorrow
      : undefined;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category: newCategory || undefined,
        scheduled_date: scheduledDate,
      }),
    });
    setNewTitle('');
    fetchTasks();
  }

  async function updateTask(id: number, data: Partial<Task>) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchTasks();
    if ('report_flag' in data) setReportRefresh(n => n + 1);
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  }

  const activeTasks = tasks.filter(t => t.status !== 'archived');

  const todayTasks    = activeTasks.filter(t => t.scheduled_date === today);
  const tomorrowTasks = activeTasks.filter(t => t.scheduled_date === tomorrow);
  const inboxTasks    = activeTasks.filter(t => !t.scheduled_date);
  const weekTasks     = activeTasks.filter(t =>
    t.scheduled_date && t.scheduled_date > tomorrow && t.scheduled_date <= weekEnd
  );

  // Group week tasks by date
  const weekGroups = weekTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const d = t.scheduled_date!;
    acc[d] = acc[d] ? [...acc[d], t] : [t];
    return acc;
  }, {});
  const weekDates = Object.keys(weekGroups).sort();

  const tabTasks: Task[] = activeTab === 'today' ? todayTasks
    : activeTab === 'tomorrow' ? tomorrowTasks
    : activeTab === 'inbox' ? inboxTasks
    : weekTasks;

  const TAB_CONFIG: { id: DayTab; label: string; count: number }[] = [
    { id: 'today',    label: '今天',  count: todayTasks.filter(t => t.status !== 'done').length },
    { id: 'tomorrow', label: '明天',  count: tomorrowTasks.filter(t => t.status !== 'done').length },
    { id: 'week',     label: '本週',  count: weekTasks.filter(t => t.status !== 'done').length },
    { id: 'inbox',    label: 'Inbox', count: inboxTasks.filter(t => t.status !== 'done').length },
  ];

  const showAddInput = activeTab !== 'week';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-gray-800">工作管理</h1>
          <nav className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded">今日待辦</span>
            <a href="/projects" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">專案追蹤</a>
            <a href="/reports" className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100">週報記錄</a>
          </nav>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NotionSyncButton onSynced={fetchTasks} />
          <a href="/setup" className="text-xs text-gray-400 hover:text-gray-600">設定</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        {/* Left panel */}
        <div className="flex-1 min-w-0">
          {/* Day tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200 pb-0">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Week view: grouped by day */}
          {activeTab === 'week' ? (
            <div className="space-y-4">
              {weekDates.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">本週沒有排定的任務</p>
              )}
              {weekDates.map(date => (
                <div key={date}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    {formatWeekday(date)}
                  </p>
                  {weekGroups[date].map(t => (
                    <TaskCard key={t.id} task={t} categories={categories} onUpdate={updateTask} onDelete={deleteTask} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* Day / Inbox flat list */
            <div>
              {/* Active tasks */}
              {tabTasks.filter(t => t.status !== 'done').map(t => (
                <TaskCard key={t.id} task={t} categories={categories} onUpdate={updateTask} onDelete={deleteTask} />
              ))}

              {/* Done tasks collapsed */}
              {tabTasks.filter(t => t.status === 'done').length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-500 py-1">
                    {tabTasks.filter(t => t.status === 'done').length} 項已完成
                  </summary>
                  {tabTasks.filter(t => t.status === 'done').map(t => (
                    <TaskCard key={t.id} task={t} categories={categories} onUpdate={updateTask} onDelete={deleteTask} />
                  ))}
                </details>
              )}

              {tabTasks.length === 0 && (
                <p className="text-sm text-gray-400 py-3">沒有任務</p>
              )}

              {/* Add task input */}
              {showAddInput && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                      placeholder="+ 新增任務..."
                      className="flex-1 bg-transparent text-sm text-gray-500 placeholder-gray-400 outline-none py-1 px-1 hover:text-gray-700 focus:text-gray-800"
                    />
                    {/* Category tag selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCatPicker(!showCatPicker)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          newCategory
                            ? `${categoryColor(newCategory)} border-transparent`
                            : 'text-gray-400 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {newCategory || '# 標籤'}
                      </button>
                      {showCatPicker && (
                        <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[140px]">
                          <button
                            onClick={() => { setNewCategory(''); setShowCatPicker(false); }}
                            className="block w-full text-left text-xs text-gray-400 px-2 py-1 hover:bg-gray-50 rounded"
                          >
                            無標籤
                          </button>
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => { setNewCategory(cat); setShowCatPicker(false); }}
                              className={`block w-full text-left text-xs px-2 py-1 rounded mt-0.5 ${categoryColor(cat)}`}
                            >
                              {cat}
                            </button>
                          ))}
                          <NewCategoryInput onAdd={cat => { setNewCategory(cat); setShowCatPicker(false); }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <RemindersPanel />
          <Notepad />
          <CalendarStrip />
          <WeeklyReportPanel refreshKey={reportRefresh} />
          <RecurringTasksPanel />
        </div>
      </div>
    </div>
  );
}

function NewCategoryInput({ onAdd }: { onAdd: (cat: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <input
      type="text"
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); }
      }}
      placeholder="+ 新增標籤"
      className="mt-1 w-full text-xs border border-dashed border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-400"
    />
  );
}
