import { NextRequest, NextResponse } from 'next/server';
import { getNotes, createNote } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') ?? undefined;
  return NextResponse.json(getNotes(search));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }
  const note = createNote(body.content.trim(), body.pinned ?? 0);
  return NextResponse.json(note, { status: 201 });
}
