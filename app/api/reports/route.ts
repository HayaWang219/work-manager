import { NextRequest, NextResponse } from 'next/server';
import { getReportDocs, createReportDoc } from '@/lib/db';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') ?? undefined;
  return NextResponse.json(getReportDocs(search));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  const doc = createReportDoc({ date: body.date, title: body.title, content: body.content });
  return NextResponse.json(doc, { status: 201 });
}
