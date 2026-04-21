'use client';
import { useState, useEffect } from 'react';
import type { Task } from '@/lib/types';

interface Props {
  refreshKey: number;
}

export default function WeeklyReportPanel({ refreshKey }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch('/api/weekly-report')
      .then(r => r.json())
      .then(setTasks);
  }, [refreshKey]);

  function getNextMonday() {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' });
  }

  function copyToClipboard() {
    const text = tasks.map(t => `• ${t.title}`).join('\n');
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">週報項目</h3>
        {tasks.length > 0 && (
          <button
            onClick={copyToClipboard}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            複製
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-gray-400">還沒有週報項目（點任務上的 ★ 來標記）</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-1.5">{getNextMonday()} 需要回報：</p>
          <div className="space-y-1">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-1.5">
                <span className="text-amber-400 text-xs">★</span>
                <span className="text-xs text-gray-700">{t.title}</span>
                {t.category && (
                  <span className="text-xs text-gray-400 bg-gray-100 rounded px-1">{t.category}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
