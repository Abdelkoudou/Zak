/**
 * Create Chargily Checkout API
 * 
 * Creates a new Chargily checkout session and stores the payment record.
 * Returns the checkout URL for redirecting the user to payment.
 * 
 * SECURITY:
 * - Rate limited per email and IP
 * - Input validation and sanitization
 * - Validates subscription duration against active plans in DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChargilyClient } from '@/lib/chargily';
import { getActivePlanByDuration, getActivePlans } from '@/lib/subscription-plans';
import {
  isRateLimited,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  getSecurityHeaders,
  RATE_LIMITS,
} from '@/lib/security/payment-security';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================================
// Types
// ============================================================================

interface CreateCheckoutRequest {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  duration: string; // duration_days as string (e.g. "60", "365")
  locale?: 'ar' | 'en' | 'fr';
  userId?: string; // Optional user ID for automatic activation
}

// ============================================================================
// Helper to get client IP
// ============================================================================

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

// ============================================================================
// POST /api/payments/create-checkout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json();
    const clientIP = getClientIP(request);

    // Sanitize inputs
    const customerEmail = body.customerEmail?.toLowerCase().trim();
    const customerName = sanitizeString(body.customerName);
    const customerPhone = body.customerPhone?.replace(/\s/g, '');
    const duration = body.duration;

    // Validate required fields
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate email format
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate duration is a number
    const durationDays = parseInt(duration);
    if (!duration || isNaN(durationDays) || durationDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid subscription duration' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate phone if provided
    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting per email
    const emailRateLimitKey = `create:email:${customerEmail}`;
    if (isRateLimited(emailRateLimitKey, RATE_LIMITS.CREATE_PER_EMAIL.maxRequests, RATE_LIMITS.CREATE_PER_EMAIL.windowMs)) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again later.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting per IP
    const ipRateLimitKey = `create:ip:${clientIP}`;
    if (isRateLimited(ipRateLimitKey, RATE_LIMITS.CREATE_PER_IP.maxRequests, RATE_LIMITS.CREATE_PER_IP.windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests from this IP. Please try again later.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // ====================================================================
    // Deep Verification: Server-side userId validation
    // ====================================================================
    let verifiedUserId = body.userId;
    if (verifiedUserId) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', verifiedUserId)
        .single();
      
      // If user not found or email doesn't match, clear the userId
      // We use case-insensitive matching for reliability
      if (userError || !userData || userData.email?.toLowerCase().trim() !== customerEmail) {
        if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('[Create Checkout] Error verifying userId:', userError);
        }
        console.warn(`[Create Checkout] userId mismatch or not found. Ignoring userId for auto-activation. User: ${verifiedUserId}, Email: ${customerEmail}`);
        verifiedUserId = undefined;
      }
    }

    // ====================================================================
    // Look up the plan dynamically from DB
    // ====================================================================
    const plan = await getActivePlanByDuration(durationDays);

    if (!plan) {
      return NextResponse.json(
        { error: 'No active subscription plan found for this duration' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const subscriptionAmount = plan.price;
    const subscriptionLabel = `${plan.name} - ${plan.price} DA`;

    // Auto-resolve userId from email if not provided (for renewal page guests)
    let resolvedUserId = verifiedUserId || '';
    if (!resolvedUserId && customerEmail) {
      const { data: userLookup } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();
      resolvedUserId = userLookup?.id || '';
    }

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
    const successUrl = `${baseUrl}/payment/success`;
    const failureUrl = `${baseUrl}/payment/failure`;
    const webhookEndpoint = `${baseUrl}/api/webhooks/chargily`;

    // Create Chargily checkout
    const chargily = getChargilyClient();

    const checkout = await chargily.createCheckout({
      amount: subscriptionAmount,
      currency: 'dzd',
      customerEmail: customerEmail,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      successUrl,
      failureUrl,
      webhookEndpoint,
      description: `Abonnement MCQ Med App - ${subscriptionLabel}`,
      locale: body.locale || 'fr',
      metadata: {
        duration_days: duration,
        source: 'web',
        customer_email: customerEmail,
        customer_name: customerName || '',
        user_id: resolvedUserId, // Auto-resolved/verified user ID for automatic activation
        plan_id: plan.id,
        plan_name: plan.name,
      },
    });

    // Store payment record in database
    const { error: insertError } = await supabaseAdmin
      .from('online_payments')
      .insert({
        checkout_id: checkout.id,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        amount: subscriptionAmount,
        currency: 'dzd',
        duration_days: durationDays,
        user_id: resolvedUserId || null, // Store the verified/resolved user ID if available
        checkout_url: checkout.checkout_url,
        success_url: successUrl,
        failure_url: failureUrl,
        status: 'pending',
        metadata: {
          duration_label: subscriptionLabel,
          locale: body.locale || 'fr',
          source: 'web',
          client_ip: clientIP,
          plan_id: plan.id,
          plan_name: plan.name,
        },
      });

    if (insertError) {
      console.error('[Create Checkout] Error storing payment record:', insertError);
      // Continue anyway - the checkout was created successfully
    }

    return NextResponse.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout.checkout_url,
      amount: subscriptionAmount,
      currency: 'dzd',
      duration: duration,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('[Create Checkout] Error:', error);

    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Failed to create checkout. Please try again.' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// ============================================================================
// GET - Get available subscription plans
// ============================================================================

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

    return NextResponse.json({
      plans,
      currency: 'dzd',
    }, { headers: getSecurityHeaders() });
  } catch (error) {
    console.error('[Get Plans] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
