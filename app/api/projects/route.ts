import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  return NextResponse.json(getProjects(status));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const project = createProject({
    title: body.title.trim(),
    next_step: body.next_step,
    notes: body.notes,
  });
  return NextResponse.json(project, { status: 201 });
}
