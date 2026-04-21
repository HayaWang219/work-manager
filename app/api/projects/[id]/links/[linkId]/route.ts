import { NextRequest, NextResponse } from 'next/server';
import { deleteProjectLink } from '@/lib/db';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  deleteProjectLink(Number(linkId));
  return NextResponse.json({ success: true });
}
