'use client';
import { useState } from 'react';
import type { Task } from '@/lib/types';
import TaskCard from './TaskCard';
import AddTaskInput from './AddTaskInput';

interface Props {
  title: string;
  tasks: Task[];
  onAdd: (title: string) => void;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete: (id: number) => void;
  defaultCollapsed?: boolean;
}

export default function TaskSection({ title, tasks, onAdd, onUpdate, onDelete, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const doneTasks = tasks.filter(t => t.status === 'done');
  const activeTasks = tasks.filter(t => t.status !== 'done');

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700"
        >
          <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
          {title}
        </button>
        <span className="text-xs text-gray-400">{activeTasks.length > 0 ? activeTasks.length : ''}</span>
      </div>

      {!collapsed && (
        <div className="pl-2">
          {activeTasks.map(t => (
            <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          {doneTasks.length > 0 && (
            <details className="mt-1">
              <summary className="text-xs text-gray-400 cursor-pointer select-none hover:text-gray-500">
                {doneTasks.length} 項已完成
              </summary>
              {doneTasks.map(t => (
                <TaskCard key={t.id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </details>
          )}
          <AddTaskInput onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}
