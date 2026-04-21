import { NextRequest, NextResponse } from 'next/server';
import { updateRecurring, deleteRecurring } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const template = updateRecurring(Number(id), body);
  if (!template) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(template);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteRecurring(Number(id));
  return NextResponse.json({ success: true });
}
