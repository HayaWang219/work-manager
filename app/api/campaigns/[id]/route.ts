import { NextRequest, NextResponse } from 'next/server';
import { getCampaignById, updateCampaign, deleteCampaign } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const campaign = await getCampaignById(Number(id));
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json();
  const campaign = await updateCampaign(Number(id), body);
  return NextResponse.json(campaign);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await deleteCampaign(Number(id));
  return new NextResponse(null, { status: 204 });
}
