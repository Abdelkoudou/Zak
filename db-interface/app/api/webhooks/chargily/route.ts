/**
 * Chargily Pay Webhook Handler
 * 
 * Receives webhook notifications from Chargily Pay when payment events occur.
 * Processes successful payments by generating activation codes.
 * 
 * SECURITY:
 * - Signature verification REQUIRED in production
 * - Uses cryptographically secure random for activation codes
 * - Idempotent processing (safe to receive same webhook multiple times)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, ChargilyWebhookEvent } from '@/lib/chargily';
import {
  generateSecureActivationCode,
  getSecurityHeaders,
} from '@/lib/security/payment-security';

// Create Supabase admin client for webhook processing
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
// POST /api/webhooks/chargily
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get signature from header
    const signature = request.headers.get('signature');
    
    // Get webhook secret - REQUIRED in production
    const webhookSecret = process.env.CHARGILY_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Verify signature
    if (webhookSecret) {
      if (!signature) {
        console.error('[Chargily Webhook] Missing signature header');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401, headers: getSecurityHeaders() }
        );
      }
      
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[Chargily Webhook] Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401, headers: getSecurityHeaders() }
        );
      }
    } else if (isProduction) {
      // In production, webhook secret is required
      console.error('[Chargily Webhook] CHARGILY_WEBHOOK_SECRET not configured in production');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500, headers: getSecurityHeaders() }
      );
    } else {
      // Development mode warning
      console.warn('[Chargily Webhook] WARNING: Signature verification skipped (development mode)');
    }
    
    // Parse the webhook payload
    let event: ChargilyWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch {
      console.error('[Chargily Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }
    
    // Validate event structure
    if (!event.type || !event.data || !event.data.id) {
      console.error('[Chargily Webhook] Invalid event structure');
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.paid':
        return await handleCheckoutPaid(event);
      
      case 'checkout.failed':
        return await handleCheckoutFailed(event);
      
      case 'checkout.canceled':
        return await handleCheckoutCanceled(event);
      
      default:
        // Unknown event type - acknowledge but don't process
        return NextResponse.json(
          { received: true, message: 'Unknown event type' },
          { headers: getSecurityHeaders() }
        );
    }
  } catch (error) {
    console.error('[Chargily Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutPaid(event: ChargilyWebhookEvent) {
  const checkout = event.data;
  
  // Extract customer info from metadata if available
  const metadata = checkout.metadata as Record<string, string> | null;
  const customerEmail = metadata?.customer_email || 'unknown@payment.com';
  const customerName = metadata?.customer_name || null;
  
  // First, check if the payment record exists and is already processed
  const { data: existingPayment } = await supabaseAdmin
    .from('online_payments')
    .select('id, status, activation_key_id')
    .eq('checkout_id', checkout.id)
    .single();
  
  // If already paid with activation key, return success (idempotent)
  if (existingPayment?.status === 'paid' && existingPayment?.activation_key_id) {
    const { data: keyData } = await supabaseAdmin
      .from('activation_keys')
      .select('key_code')
      .eq('id', existingPayment.activation_key_id)
      .single();
    
    return NextResponse.json({
      received: true,
      success: true,
      keyCode: keyData?.key_code,
      message: 'Payment already processed',
    }, { headers: getSecurityHeaders() });
  }
  
  // Create payment record if it doesn't exist
  if (!existingPayment) {
    const { error: createError } = await supabaseAdmin
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
    
    if (createError && createError.code !== '23505') { // Ignore duplicate key error
      console.error('[Chargily Webhook] Error creating payment record:', createError);
    }
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
    console.error('[Chargily Webhook] Error creating activation key:', keyError);
    return NextResponse.json(
      { error: 'Failed to create activation key' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
  
  // Update payment record with optimistic locking
  const { error: updateError } = await supabaseAdmin
    .from('online_payments')
    .update({
      status: 'paid',
      invoice_id: checkout.invoice_id,
      payment_method: checkout.payment_method,
      webhook_payload: event,
      activation_key_id: newKey.id,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('checkout_id', checkout.id)
    .is('activation_key_id', null); // Only update if not already processed
  
  if (updateError) {
    console.error('[Chargily Webhook] Error updating payment:', updateError);
  }
  
  // Update activation key with payment reference
  const { data: paymentData } = await supabaseAdmin
    .from('online_payments')
    .select('id')
    .eq('checkout_id', checkout.id)
    .single();
  
  if (paymentData) {
    await supabaseAdmin
      .from('activation_keys')
      .update({ payment_id: paymentData.id })
      .eq('id', newKey.id);
  }
  
  return NextResponse.json({
    received: true,
    success: true,
    keyCode: keyCode,
  }, { headers: getSecurityHeaders() });
}

async function handleCheckoutFailed(event: ChargilyWebhookEvent) {
  const checkout = event.data;
  
  // Update payment status to failed
  const { error } = await supabaseAdmin
    .from('online_payments')
    .update({
      status: 'failed',
      webhook_payload: event,
      updated_at: new Date().toISOString(),
    })
    .eq('checkout_id', checkout.id);
  
  if (error) {
    console.error('[Chargily Webhook] Error updating failed payment:', error);
  }
  
  return NextResponse.json(
    { received: true },
    { headers: getSecurityHeaders() }
  );
}

async function handleCheckoutCanceled(event: ChargilyWebhookEvent) {
  const checkout = event.data;
  
  // Update payment status to canceled
  const { error } = await supabaseAdmin
    .from('online_payments')
    .update({
      status: 'canceled',
      webhook_payload: event,
      updated_at: new Date().toISOString(),
    })
    .eq('checkout_id', checkout.id);
  
  if (error) {
    console.error('[Chargily Webhook] Error updating canceled payment:', error);
  }
  
  return NextResponse.json(
    { received: true },
    { headers: getSecurityHeaders() }
  );
}

// ============================================================================
// GET - Health check for webhook endpoint
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Chargily Pay Webhook',
    timestamp: new Date().toISOString(),
    signatureRequired: !!process.env.CHARGILY_WEBHOOK_SECRET,
  }, { headers: getSecurityHeaders() });
}
