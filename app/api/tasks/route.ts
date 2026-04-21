import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getCategories } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

function parseBool(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  return v === '1' || v === 'true';
}

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'todo';
  const category = searchParams.get('category');
  const is_today = parseBool(searchParams.get('is_today'));
  const report_flag = parseBool(searchParams.get('report_flag'));

  const [tasks, categories] = await Promise.all([
    getTasks({
      status: status === 'all' ? undefined : status,
      category: category === 'inbox' ? null : category ?? undefined,
      is_today,
      report_flag,
    }),
    getCategories(),
  ]);

  return NextResponse.json({ tasks, categories });
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const task = await createTask({
    title: body.title.trim(),
    notes: body.notes,
    category: body.category,
    is_today: body.is_today ?? false,
    report_flag: body.report_flag ?? false,
    due_date: body.due_date,
    scheduled_date: body.scheduled_date,
  });
  return NextResponse.json(task, { status: 201 });
}
