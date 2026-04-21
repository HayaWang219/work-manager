import { NextRequest, NextResponse } from 'next/server';
import { getReportDocs, createReportDoc } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const search = req.nextUrl.searchParams.get('search') ?? undefined;
  return NextResponse.json(await getReportDocs(search));
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.date) return NextResponse.json({ error: 'date required' }, { status: 400 });
  const doc = await createReportDoc({ date: body.date, title: body.title, content: body.content });
  return NextResponse.json(doc, { status: 201 });
}
