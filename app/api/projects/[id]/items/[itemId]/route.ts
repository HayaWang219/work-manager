import { NextRequest, NextResponse } from 'next/server';
import { updateProjectItem, deleteProjectItem } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { itemId } = await params;
  const body = await req.json();
  const item = await updateProjectItem(Number(itemId), body);
  if (!item) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { itemId } = await params;
  await deleteProjectItem(Number(itemId));
  return NextResponse.json({ success: true });
}
