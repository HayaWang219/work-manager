import { NextRequest, NextResponse } from 'next/server';
import { addCampaignLink, deleteCampaignLink } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }
  const link = await addCampaignLink(Number(id), body.label ?? null, body.url.trim());
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const linkId = req.nextUrl.searchParams.get('linkId');
  if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });
  await deleteCampaignLink(Number(linkId));
  return new NextResponse(null, { status: 204 });
}
