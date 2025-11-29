import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isReservedSlug } from '@/lib/constants/routes';
import { z } from 'zod';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// Validation schema for creating an affiliate (public - no payout_percent)
const createAffiliateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
      message:
        'Slug must be lowercase alphanumeric with hyphens, starting and ending with alphanumeric',
    }),
});

// Default payout percentage for all affiliates
const DEFAULT_PAYOUT_PERCENT = 20;

/**
 * Generate a public code from the slug
 * Uppercase, alphanumeric only, max 12 chars
 */
function generatePublicCode(slug: string): string {
  const base = slug.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base.slice(0, 8)}${suffix}`.slice(0, 12);
}

/**
 * POST /api/affiliates
 * Create a new affiliate (public - anyone can create)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createAffiliateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, slug } = validationResult.data;
    const normalizedSlug = slug.toLowerCase();

    // Check if slug is reserved
    if (isReservedSlug(normalizedSlug)) {
      return NextResponse.json(
        { error: 'This slug is reserved and cannot be used' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingSlug } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('slug', normalizedSlug)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'This slug is already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An affiliate with this email already exists' },
        { status: 400 }
      );
    }

    // Generate public code
    const public_code = generatePublicCode(normalizedSlug);

    // Create affiliate
    const { data: affiliate, error } = await supabaseAdmin
      .from('affiliates')
      .insert({
        name,
        email,
        slug: normalizedSlug,
        public_code,
        payout_percent: DEFAULT_PAYOUT_PERCENT,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Affiliate creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create affiliate', details: error.message },
        { status: 500 }
      );
    }

    // Get the app URL for building links
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://santasnumber.com';

    return NextResponse.json({
      affiliate,
      links: {
        direct: `${appUrl}/${affiliate.slug}`,
        withCode: `${appUrl}/book?aff=${affiliate.public_code}`,
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/affiliates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/affiliates
 * List all affiliates (admin only)
 */
export async function GET(request: NextRequest) {
  // Verify admin API key
  const apiKey = request.headers.get('x-api-key');
  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabaseAdmin.from('affiliates').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: affiliates, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch affiliates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ affiliates });
  } catch (error) {
    console.error('Unexpected error in GET /api/affiliates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
