import { NextResponse } from 'next/server';
import { getSystemState, setSystemState, getRecurringTemplates, createTask } from '@/lib/db';

export async function POST() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const todayStr = today.toISOString().split('T')[0];

  if (dayOfWeek !== 1) {
    return NextResponse.json({ ran: false, reason: 'not Monday' });
  }

  const lastReset = getSystemState('last_monday_reset');
  if (lastReset === todayStr) {
    return NextResponse.json({ ran: false, reason: 'already reset today' });
  }

  const templates = getRecurringTemplates(true);
  for (const t of templates) {
    createTask({
      title: t.title,
      category: t.category ?? undefined,
      notes: t.notes ?? undefined,
      is_today: 1,
    });
  }

  setSystemState('last_monday_reset', todayStr);
  return NextResponse.json({ ran: true, tasksCreated: templates.length });
}
