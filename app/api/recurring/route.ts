import { NextRequest, NextResponse } from 'next/server';
import { getRecurringTemplates, createRecurring } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getRecurringTemplates());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const template = createRecurring({
    title: body.title.trim(),
    category: body.category,
    notes: body.notes,
  });
  return NextResponse.json(template, { status: 201 });
}
