import { NextRequest, NextResponse } from 'next/server';
import { getTasks, createTask, getCategories } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'todo';
  const category = searchParams.get('category');
  const is_today = searchParams.has('is_today') ? Number(searchParams.get('is_today')) : undefined;
  const report_flag = searchParams.has('report_flag') ? Number(searchParams.get('report_flag')) : undefined;

  const tasks = getTasks({
    status: status === 'all' ? undefined : status,
    category: category === 'inbox' ? null : category ?? undefined,
    is_today,
    report_flag,
  });

  const categories = getCategories();
  return NextResponse.json({ tasks, categories });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const task = createTask({
    title: body.title.trim(),
    notes: body.notes,
    category: body.category,
    is_today: body.is_today ?? 0,
    report_flag: body.report_flag ?? 0,
    due_date: body.due_date,
    scheduled_date: body.scheduled_date,
  });
  return NextResponse.json(task, { status: 201 });
}
