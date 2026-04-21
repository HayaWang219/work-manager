import { NextResponse } from 'next/server';
import { getSystemState, setSystemState, getRecurringTemplates, createTask } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

// Per-user Monday reset: triggered client-side when a user loads the app
// on a Monday. Uses a per-user key in system_state to avoid double-resetting.
export async function POST() {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const user = auth;
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const todayStr = today.toISOString().split('T')[0];

  if (dayOfWeek !== 1) {
    return NextResponse.json({ ran: false, reason: 'not Monday' });
  }

  const resetKey = `last_monday_reset:${user.id}`;
  const lastReset = await getSystemState(resetKey);
  if (lastReset === todayStr) {
    return NextResponse.json({ ran: false, reason: 'already reset today' });
  }

  const templates = await getRecurringTemplates(true);
  for (const t of templates) {
    await createTask({
      title: t.title,
      category: t.category ?? undefined,
      notes: t.notes ?? undefined,
      is_today: true,
    });
  }

  await setSystemState(resetKey, todayStr);
  return NextResponse.json({ ran: true, tasksCreated: templates.length });
}
