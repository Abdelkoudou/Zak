/**
 * Payment Status API
 * 
 * Check the status of a payment and retrieve the activation code if available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  
  if (!checkoutId) {
    return NextResponse.json(
      { error: 'checkout_id is required' },
      { status: 400 }
    );
  }
  
  try {
    console.log('[Payment Status] Looking up checkout_id:', checkoutId);
    
    const { data: payment, error } = await supabaseAdmin
      .from('online_payments')
      .select(`
        *,
        activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code)
      `)
      .eq('checkout_id', checkoutId)
      .single();
    
    if (error) {
      console.log('[Payment Status] Query error:', error);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    if (!payment) {
      console.log('[Payment Status] No payment found');
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    console.log('[Payment Status] Found payment:', {
      id: payment.id,
      status: payment.status,
      activation_key_id: payment.activation_key_id,
      activation_key: payment.activation_key,
    });
    
    return NextResponse.json({
      status: payment.status,
      customerEmail: payment.customer_email,
      amount: payment.amount,
      currency: payment.currency,
      activationCode: payment.activation_key?.key_code || null,
      paidAt: payment.paid_at,
    });
  } catch (error) {
    console.error('[Payment Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
