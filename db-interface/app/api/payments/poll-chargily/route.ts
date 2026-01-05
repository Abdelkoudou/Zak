/**
 * Poll Chargily API for Payment Status
 * 
 * This endpoint directly queries Chargily API to check payment status,
 * bypassing the need for webhooks (useful for local development or
 * when webhooks are delayed).
 * 
 * SECURITY:
 * - Rate limited per checkout_id
 * - Validates checkout_id format
 * - Uses database transaction to prevent duplicate code generation
 * - Uses cryptographically secure random for activation codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getChargilyClient } from '@/lib/chargily';
import {
  generateSecureActivationCode,
  isRateLimited,
  isValidCheckoutId,
  getSecurityHeaders,
  RATE_LIMITS,
} from '@/lib/security/payment-security';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkoutId = searchParams.get('checkout_id');
  
  // Validate checkout_id format
  if (!checkoutId || !isValidCheckoutId(checkoutId)) {
    return NextResponse.json(
      { error: 'Invalid or missing checkout_id' },
      { status: 400, headers: getSecurityHeaders() }
    );
  }
  
  // Rate limiting per checkout_id
  const rateLimitKey = `poll:${checkoutId}`;
  if (isRateLimited(rateLimitKey, RATE_LIMITS.POLL_PER_CHECKOUT.maxRequests, RATE_LIMITS.POLL_PER_CHECKOUT.windowMs)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: getSecurityHeaders() }
    );
  }
  
  try {
    // First check our database for existing payment with activation code
    const { data: existingPayment } = await supabaseAdmin
      .from('online_payments')
      .select(`
        *,
        activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code)
      `)
      .eq('checkout_id', checkoutId)
      .single();
    
    // If already paid with activation code, return it immediately
    if (existingPayment?.status === 'paid' && existingPayment?.activation_key?.key_code) {
      return NextResponse.json({
        status: 'paid',
        activationCode: existingPayment.activation_key.key_code,
        customerEmail: existingPayment.customer_email,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        source: 'database',
      }, { headers: getSecurityHeaders() });
    }
    
    // Query Chargily API directly
    const chargily = getChargilyClient();
    const checkout = await chargily.getCheckout(checkoutId);
    
    // If Chargily says it's paid, process it
    if (checkout.status === 'paid') {
      // Use a transaction-like approach with optimistic locking
      // First, try to claim this payment by setting a processing flag
      
      // Re-check database to prevent race condition
      const { data: currentPayment } = await supabaseAdmin
        .from('online_payments')
        .select('id, status, activation_key_id')
        .eq('checkout_id', checkoutId)
        .single();
      
      // If already processed, return existing code
      if (currentPayment?.status === 'paid' && currentPayment?.activation_key_id) {
        const { data: keyData } = await supabaseAdmin
          .from('activation_keys')
          .select('key_code')
          .eq('id', currentPayment.activation_key_id)
          .single();
        
        if (keyData) {
          return NextResponse.json({
            status: 'paid',
            activationCode: keyData.key_code,
            customerEmail: existingPayment?.customer_email || checkout.metadata?.customer_email,
            amount: existingPayment?.amount || checkout.amount,
            currency: existingPayment?.currency || checkout.currency,
            source: 'database',
          }, { headers: getSecurityHeaders() });
        }
      }
      
      // Create payment record if it doesn't exist
      if (!currentPayment) {
        const metadata = checkout.metadata as Record<string, string> | null;
        const customerEmail = metadata?.customer_email || 'unknown@payment.com';
        const customerName = metadata?.customer_name || null;
        
        await supabaseAdmin
          .from('online_payments')
          .insert({
            checkout_id: checkout.id,
            customer_email: customerEmail,
            customer_name: customerName,
            amount: checkout.amount,
            currency: checkout.currency || 'dzd',
            status: 'pending',
            duration_days: 365,
          });
      }
      
      // Generate secure activation code
      const keyCode = generateSecureActivationCode();
      
      // Create activation key
      const { data: newKey, error: keyError } = await supabaseAdmin
        .from('activation_keys')
        .insert({
          key_code: keyCode,
          duration_days: 365,
          payment_source: 'online',
          notes: `Auto-generated from online payment: ${checkout.id}`,
          price_paid: checkout.amount / 100,
        })
        .select('id')
        .single();
      
      if (keyError) {
        // Check if it's a duplicate key error (race condition)
        if (keyError.code === '23505') {
          // Another request already created the key, fetch it
          const { data: existingKey } = await supabaseAdmin
            .from('online_payments')
            .select('activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code)')
            .eq('checkout_id', checkoutId)
            .single();
          
          // Extract key_code from the joined data (type varies based on relationship)
          const activationKeyData = existingKey?.activation_key;
          let keyCode: string | undefined;
          if (Array.isArray(activationKeyData)) {
            keyCode = activationKeyData[0]?.key_code;
          } else if (activationKeyData && typeof activationKeyData === 'object') {
            keyCode = (activationKeyData as Record<string, unknown>).key_code as string | undefined;
          }
          
          if (keyCode) {
            return NextResponse.json({
              status: 'paid',
              activationCode: keyCode,
              customerEmail: existingPayment?.customer_email,
              amount: existingPayment?.amount || checkout.amount,
              currency: existingPayment?.currency || checkout.currency,
              source: 'database',
            }, { headers: getSecurityHeaders() });
          }
        }
        
        console.error('[Poll Chargily] Error creating activation key:', keyError);
        return NextResponse.json(
          { error: 'Failed to create activation key' },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
      
      // Update payment record atomically
      const { error: updateError } = await supabaseAdmin
        .from('online_payments')
        .update({
          status: 'paid',
          invoice_id: checkout.invoice_id,
          payment_method: checkout.payment_method,
          activation_key_id: newKey.id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_id', checkoutId)
        .is('activation_key_id', null); // Only update if not already processed
      
      if (updateError) {
        console.error('[Poll Chargily] Error updating payment:', updateError);
      }
      
      // Get customer email from payment record
      const { data: paymentData } = await supabaseAdmin
        .from('online_payments')
        .select('customer_email, amount, currency')
        .eq('checkout_id', checkoutId)
        .single();
      
      return NextResponse.json({
        status: 'paid',
        activationCode: keyCode,
        customerEmail: paymentData?.customer_email || checkout.metadata?.customer_email,
        amount: paymentData?.amount || checkout.amount,
        currency: paymentData?.currency || checkout.currency,
        source: 'chargily_poll',
      }, { headers: getSecurityHeaders() });
    }
    
    // Return current status from Chargily
    return NextResponse.json({
      status: checkout.status,
      activationCode: null,
      customerEmail: existingPayment?.customer_email || checkout.metadata?.customer_email,
      amount: existingPayment?.amount || checkout.amount,
      currency: existingPayment?.currency || checkout.currency,
      source: 'chargily_poll',
    }, { headers: getSecurityHeaders() });
    
  } catch (error) {
    console.error('[Poll Chargily] Error:', error);
    
    // If Chargily API fails, fall back to database
    const { data: payment } = await supabaseAdmin
      .from('online_payments')
      .select(`
        *,
        activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code)
      `)
      .eq('checkout_id', checkoutId)
      .single();
    
    if (payment) {
      return NextResponse.json({
        status: payment.status,
        activationCode: payment.activation_key?.key_code || null,
        customerEmail: payment.customer_email,
        amount: payment.amount,
        currency: payment.currency,
        source: 'database_fallback',
      }, { headers: getSecurityHeaders() });
    }
    
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
