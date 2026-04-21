'use client';
import { useState, useEffect } from 'react';
import type { ProjectItem } from '@/lib/types';

type ReminderItem = ProjectItem & { project_title: string };

function dueDateStyle(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return 'text-red-600';
  if (diff <= 3) return 'text-orange-500';
  return 'text-yellow-600';
}

function dueDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000);
  if (diff < 0) return `逾期 ${Math.abs(diff)}天`;
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  return `${diff}天後`;
}

export default function RemindersPanel() {
  const [items, setItems] = useState<ReminderItem[]>([]);

  useEffect(() => {
    fetch('/api/reminders?days=14')
      .then(r => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">即將到期</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <span className={`text-xs font-semibold flex-shrink-0 mt-0.5 ${dueDateStyle(item.due_date!)}`}>
              {dueDateLabel(item.due_date!)}
            </span>
            <div className="min-w-0">
              <div className="text-xs text-gray-700 truncate">{item.title}</div>
              <div className="text-xs text-gray-400 truncate">{item.project_title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
