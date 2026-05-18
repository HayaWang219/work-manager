import { NextRequest, NextResponse } from 'next/server';
import { getContacts, createContact } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getContacts());
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }
  const contact = await createContact({
    name: body.name.trim(),
    org: body.org ?? null,
    org_type: body.org_type ?? 'agency',
    role: body.role ?? null,
    email: body.email ?? null,
    notes: body.notes ?? null,
  });
  return NextResponse.json(contact, { status: 201 });
}
