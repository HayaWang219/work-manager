import { NextRequest, NextResponse } from 'next/server';
import { updateContact, deleteContact } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const contact = await updateContact(Number(id), body);
  return NextResponse.json(contact);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await deleteContact(Number(id));
  return new NextResponse(null, { status: 204 });
}
