import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from './supabase/server';

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * For API routes: returns the current user, or a NextResponse 401 if not
 * authenticated. Call like: `const u = await requireUserOr401(); if (u instanceof NextResponse) return u;`
 */
export async function requireUserOr401() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}
