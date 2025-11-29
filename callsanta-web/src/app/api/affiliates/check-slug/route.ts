import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isReservedSlug } from '@/lib/constants/routes';

/**
 * GET /api/affiliates/check-slug?slug=my-slug
 * Check if a slug is available for affiliate registration
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { available: false, reason: 'Slug is required' },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().trim();

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (normalizedSlug.length < 3) {
      return NextResponse.json({
        available: false,
        reason: 'Slug must be at least 3 characters',
      });
    }

    if (normalizedSlug.length > 50) {
      return NextResponse.json({
        available: false,
        reason: 'Slug must be 50 characters or less',
      });
    }

    if (!slugRegex.test(normalizedSlug)) {
      return NextResponse.json({
        available: false,
        reason:
          'Slug must be lowercase letters, numbers, and hyphens only. Must start and end with a letter or number.',
      });
    }

    // Check if slug is reserved
    if (isReservedSlug(normalizedSlug)) {
      return NextResponse.json({
        available: false,
        reason: 'This slug is reserved',
      });
    }

    // Check if slug already exists in database
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('slug', normalizedSlug)
      .single();

    if (existingAffiliate) {
      return NextResponse.json({
        available: false,
        reason: 'This slug is already taken',
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { available: false, reason: 'Error checking availability' },
      { status: 500 }
    );
  }
}
