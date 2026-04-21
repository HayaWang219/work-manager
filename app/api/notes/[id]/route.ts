import { NextRequest, NextResponse } from 'next/server';
import { getNoteById, updateNote, deleteNote } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const note = updateNote(Number(id), body);
  if (!note) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteNote(Number(id));
  return NextResponse.json({ success: true });
}
