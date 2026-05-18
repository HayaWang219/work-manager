import { NextRequest, NextResponse } from 'next/server';
import { updateDeliverable, deleteDeliverable } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const deliverable = await updateDeliverable(Number(id), body);
  return NextResponse.json(deliverable);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await deleteDeliverable(Number(id));
  return new NextResponse(null, { status: 204 });
}
