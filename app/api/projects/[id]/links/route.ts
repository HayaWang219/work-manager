import { NextRequest, NextResponse } from 'next/server';
import { addProjectLink } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }
  const link = await addProjectLink(Number(id), body.url.trim(), body.label?.trim());
  return NextResponse.json(link, { status: 201 });
}
