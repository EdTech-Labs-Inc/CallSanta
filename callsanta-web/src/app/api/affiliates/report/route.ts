import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * GET /api/affiliates/report
 * Get affiliate revenue report (admin only)
 *
 * Query params:
 * - start: Start date (ISO string)
 * - end: End date (ISO string)
 */
export async function GET(request: NextRequest) {
  // Verify admin API key
  const apiKey = request.headers.get('x-api-key');
  if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || null;
    const endDate = searchParams.get('end') || null;

    // Use the database function for aggregated report
    const { data: report, error } = await supabaseAdmin.rpc(
      'get_affiliate_report',
      {
        start_date: startDate,
        end_date: endDate,
      }
    );

    if (error) {
      console.error('Report query error:', error);

      // Fallback to manual query if the function doesn't exist yet
      if (error.code === '42883') {
        // Function does not exist - use fallback query
        return await getFallbackReport(startDate, endDate);
      }

      return NextResponse.json(
        { error: 'Failed to generate report', details: error.message },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = {
      total_affiliates: report?.length || 0,
      total_bookings: report?.reduce(
        (sum: number, r: { total_bookings: number }) => sum + (r.total_bookings || 0),
        0
      ) || 0,
      total_paid_bookings: report?.reduce(
        (sum: number, r: { paid_bookings: number }) => sum + (r.paid_bookings || 0),
        0
      ) || 0,
      total_revenue_cents: report?.reduce(
        (sum: number, r: { total_revenue_cents: number }) => sum + (r.total_revenue_cents || 0),
        0
      ) || 0,
      total_payout_due_cents: report?.reduce(
        (sum: number, r: { payout_due_cents: number }) => sum + (r.payout_due_cents || 0),
        0
      ) || 0,
    };

    return NextResponse.json({
      report,
      totals,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/affiliates/report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback report generation if the database function isn't available
 */
async function getFallbackReport(
  startDate: string | null,
  endDate: string | null
) {
  // Get all active affiliates
  const { data: affiliates, error: affError } = await supabaseAdmin
    .from('affiliates')
    .select('id, name, email, slug, payout_percent')
    .eq('is_active', true);

  if (affError) {
    return NextResponse.json(
      { error: 'Failed to fetch affiliates', details: affError.message },
      { status: 500 }
    );
  }

  // Build report for each affiliate
  const report = await Promise.all(
    (affiliates || []).map(async (affiliate) => {
      let query = supabaseAdmin
        .from('calls')
        .select('id, total_amount_cents, payment_status')
        .eq('affiliate_id', affiliate.id);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: calls } = await query;

      const totalBookings = calls?.length || 0;
      const paidCalls = calls?.filter((c) => c.payment_status === 'paid') || [];
      const paidBookings = paidCalls.length;
      const totalRevenueCents = paidCalls.reduce(
        (sum, c) => sum + (c.total_amount_cents || 0),
        0
      );
      const payoutDueCents = Math.round(
        totalRevenueCents * (affiliate.payout_percent / 100)
      );

      return {
        affiliate_id: affiliate.id,
        affiliate_name: affiliate.name,
        affiliate_email: affiliate.email,
        affiliate_slug: affiliate.slug,
        payout_percent: affiliate.payout_percent,
        total_bookings: totalBookings,
        paid_bookings: paidBookings,
        total_revenue_cents: totalRevenueCents,
        payout_due_cents: payoutDueCents,
      };
    })
  );

  // Sort by revenue descending
  report.sort((a, b) => b.total_revenue_cents - a.total_revenue_cents);

  const totals = {
    total_affiliates: report.length,
    total_bookings: report.reduce((sum, r) => sum + r.total_bookings, 0),
    total_paid_bookings: report.reduce((sum, r) => sum + r.paid_bookings, 0),
    total_revenue_cents: report.reduce((sum, r) => sum + r.total_revenue_cents, 0),
    total_payout_due_cents: report.reduce((sum, r) => sum + r.payout_due_cents, 0),
  };

  return NextResponse.json({
    report,
    totals,
    filters: {
      start_date: startDate,
      end_date: endDate,
    },
  });
}
