import { NextRequest, NextResponse } from 'next/server';
import { getRecurringTemplates, createRecurring } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET() {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getRecurringTemplates());
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const template = await createRecurring({
    title: body.title.trim(),
    category: body.category,
    notes: body.notes,
  });
  return NextResponse.json(template, { status: 201 });
}
