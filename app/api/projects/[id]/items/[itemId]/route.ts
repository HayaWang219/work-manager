import { NextRequest, NextResponse } from 'next/server';
import { updateProjectItem, deleteProjectItem } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const body = await req.json();
  const item = updateProjectItem(Number(itemId), body);
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  deleteProjectItem(Number(itemId));
  return NextResponse.json({ success: true });
}
