/**
 * Public Plans API
 *
 * Returns the list of active subscription plans.
 * Used by the buy page and the React Native landing page.
 *
 * This is a lightweight, public GET endpoint — no authentication required.
 * The same data is available via the Supabase client directly
 * (RLS policy: "Anyone can read subscription plans" where is_active = true).
 */

import { NextResponse } from 'next/server';
import { getActivePlans } from '@/lib/subscription-plans';

// Cache for 60 seconds to reduce DB calls, revalidate on the fly
export const revalidate = 60;

export async function GET() {
  try {
    const activePlans = await getActivePlans();

    const plans = activePlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      duration: plan.duration_days.toString(),
      durationDays: plan.duration_days,
      amount: plan.price,
      amountFormatted: `${plan.price} DA`,
      label: `${plan.name} - ${plan.price} DA`,
      isFeatured: plan.is_featured,
      description: plan.description,
    }));

    return NextResponse.json(
      { plans, currency: 'dzd' },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  } catch (error) {
    console.error('[Public Plans API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
