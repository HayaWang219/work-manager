import { NextRequest, NextResponse } from 'next/server';
import { addProjectLink } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }
  const link = addProjectLink(Number(id), body.url.trim(), body.label?.trim());
  return NextResponse.json(link, { status: 201 });
}
