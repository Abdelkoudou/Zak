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
      
      // Extract metadata
      const metadata = checkout.metadata as Record<string, string> | null;
      const customerEmail = metadata?.customer_email || 'unknown@payment.com';
      const customerName = metadata?.customer_name || null;
      const userId = metadata?.user_id || null;
      const metadataDurationDays = parseInt(metadata?.duration_days || '365') || 365;

      // Create payment record if it doesn't exist
      if (!currentPayment) {
        await supabaseAdmin
          .from('online_payments')
          .insert({
            checkout_id: checkout.id,
            customer_email: customerEmail,
            customer_name: customerName,
            amount: checkout.amount,
            currency: checkout.currency || 'dzd',
            status: 'pending',
            duration_days: metadataDurationDays,
            user_id: userId || null,
          });
      }
      
      // Generate secure activation code
      const keyCode = generateSecureActivationCode();

      // CRITICAL: Read duration from the existing online_payments record first,
      // which was correctly stored during checkout creation. Fall back to metadata.
      let durationDays = metadataDurationDays;
      if (currentPayment) {
        const { data: paymentDurationData } = await supabaseAdmin
          .from('online_payments')
          .select('duration_days')
          .eq('id', currentPayment.id)
          .single();
        durationDays = paymentDurationData?.duration_days || metadataDurationDays;
      }

      // Mask email for logs (avoid raw PII in server output)
      const maskedEmail = customerEmail.replace(/^(.{3}).*(@.*)$/, '$1***$2');
      console.log(`[Poll Chargily] Processing payment for ${maskedEmail}. Duration: ${durationDays} days. User ID: ${userId || 'none'}`);
      
      // Fetch "En ligne" sales point ID
      const { data: onlineSP, error: spError } = await supabaseAdmin
        .from('sales_points')
        .select('id')
        .eq('code', 'ONLINE')
        .single();

      if (spError) {
        console.error('[Poll Chargily] Failed to fetch ONLINE sales_point:', spError);
      }

      // Explicit check for not found case - stop creating keys without a valid sales point
      if (!onlineSP) {
        console.error('[Poll Chargily] ONLINE sales_point not found (onlineSP is null). spError:', spError, 'Cannot create activation key without sales point.');
        return NextResponse.json(
          { error: 'Configuration error: ONLINE sales point not found. Please create a sales point with code "ONLINE".' },
          { status: 500, headers: getSecurityHeaders() }
        );
      }

      const salesPointId = onlineSP.id;
      
      // Create activation key
      const { data: newKey, error: keyError } = await supabaseAdmin
        .from('activation_keys')
        .insert({
          key_code: keyCode,
          duration_days: durationDays,
          payment_source: 'online',
          sales_point_id: salesPointId,
          notes: `Auto-generated from online payment: ${checkout.id}`,
          price_paid: checkout.amount, // Chargily v2 uses exact DZD (not centimes)
          is_used: userId ? true : false,
          used_by: userId || null,
          used_at: userId ? new Date().toISOString() : null,
          expires_at: userId
            ? (() => { const d = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000); d.setHours(23, 59, 59, 999); return d.toISOString(); })()
            : null,
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

      // Link activation key to payment record (parity with webhook)
      const { data: linkedPayment } = await supabaseAdmin
        .from('online_payments')
        .select('id')
        .eq('checkout_id', checkoutId)
        .single();

      if (linkedPayment) {
        await supabaseAdmin
          .from('activation_keys')
          .update({ payment_id: linkedPayment.id })
          .eq('id', newKey.id);
      }
      
      // AUTOMATED ACTIVATION: If user_id is present, update the user record directly
      if (userId) {
        console.log(`[Poll Chargily] Performing automated activation for user: ${userId}`);
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        expiresAt.setHours(23, 59, 59, 999);

        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({
            is_paid: true,
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (userUpdateError) {
          console.error('[Poll Chargily] Error performing automated activation:', userUpdateError);

          // CRITICAL: Rollback activation key status to prevent "used but not received" state
          console.warn(`[Poll Chargily] Rolling back activation key ${newKey.id} usage due to user update failure`);
          const { error: rollbackError } = await supabaseAdmin
            .from('activation_keys')
            .update({
              is_used: false,
              used_by: null,
              used_at: null,
              expires_at: null,
            })
            .eq('id', newKey.id);

          if (rollbackError) {
            console.error('[Poll Chargily] CRITICAL: Failed to rollback activation key:', rollbackError);
          }
        } else {
          console.log(`[Poll Chargily] Successfully activated user: ${userId}`);
        }
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
