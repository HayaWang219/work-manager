import { NextRequest, NextResponse } from 'next/server';
import { createProjectItem } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const item = await createProjectItem({
    project_id: Number(id),
    title: body.title.trim(),
    progress: body.progress,
    next_step: body.next_step,
    due_date: body.due_date,
  });
  return NextResponse.json(item, { status: 201 });
}
