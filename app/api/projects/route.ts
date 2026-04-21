import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;
  return NextResponse.json(await getProjects(status));
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const project = await createProject({
    title: body.title.trim(),
    next_step: body.next_step,
    notes: body.notes,
  });
  return NextResponse.json(project, { status: 201 });
}
