import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Affiliate } from '@/types/database';

/**
 * Looks up an affiliate by their public_code
 * Returns the affiliate ID if found and active, null otherwise
 */
export async function getAffiliateIdFromCode(
  code: string
): Promise<string | null> {
  if (!code) return null;

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('id, is_active')
    .eq('public_code', code)
    .single();

  if (!affiliate || !affiliate.is_active) return null;
  return affiliate.id;
}

/**
 * Looks up an affiliate by their slug
 * Returns the full affiliate record if found and active, null otherwise
 */
export async function getAffiliateBySlug(
  slug: string
): Promise<Affiliate | null> {
  if (!slug) return null;

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .eq('is_active', true)
    .single();

  return affiliate as Affiliate | null;
}

/**
 * Looks up an affiliate by their public_code
 * Returns the full affiliate record if found and active, null otherwise
 */
export async function getAffiliateByCode(
  code: string
): Promise<Affiliate | null> {
  if (!code) return null;

  const { data: affiliate } = await supabaseAdmin
    .from('affiliates')
    .select('*')
    .eq('public_code', code)
    .eq('is_active', true)
    .single();

  return affiliate as Affiliate | null;
}
