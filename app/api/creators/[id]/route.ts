import { NextRequest, NextResponse } from 'next/server';
import { getCreatorById, updateCreator, deleteCreator } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const creator = await getCreatorById(Number(id));
  if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(creator);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const creator = await updateCreator(Number(id), body);
  return NextResponse.json(creator);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await deleteCreator(Number(id));
  return new NextResponse(null, { status: 204 });
}
