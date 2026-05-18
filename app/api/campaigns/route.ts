import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, createCampaign } from '@/lib/db';
import { requireUserOr401 } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getCampaigns());
}

export async function POST(req: NextRequest) {
  const auth = await requireUserOr401();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }
  const campaign = await createCampaign({
    title: body.title.trim(),
    product: body.product ?? null,
    campaign_type: body.campaign_type ?? 'launch',
    status: body.status ?? 'planning',
    brief_url: body.brief_url ?? null,
    budget: body.budget ?? null,
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    notes: body.notes ?? null,
    sort_order: body.sort_order ?? 0,
    created_by: body.created_by ?? null,
  });
  return NextResponse.json(campaign, { status: 201 });
}
