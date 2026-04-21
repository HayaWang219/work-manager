import { NextRequest, NextResponse } from 'next/server';
import { getNotes, createNote } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') ?? undefined;
  return NextResponse.json(await getNotes(search));
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }
  const note = await createNote(body.content.trim(), body.pinned ?? false);
  return NextResponse.json(note, { status: 201 });
}
