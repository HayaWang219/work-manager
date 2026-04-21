import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const note = await updateNote(Number(id), body);
  if (!note) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await deleteNote(Number(id));
  return NextResponse.json({ success: true });
}
