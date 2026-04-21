import { NextRequest, NextResponse } from 'next/server';
import { deleteProjectLink } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { linkId } = await params;
  await deleteProjectLink(Number(linkId));
  return NextResponse.json({ success: true });
}
