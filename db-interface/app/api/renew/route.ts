/**
 * Subscription Renewal API
 * 
 * GET  /api/renew?email=xxx  → Identity lookup (name + subscription status)
 * POST /api/renew { email, keyCode } → Code-based subscription renewal
 * 
 * SECURITY:
 * - Rate limited per IP and per email
 * - Uses supabaseAdmin (service role) for all DB operations
 * - Atomic key consumption with rollback on failure
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  isRateLimited,
  getSecurityHeaders,
} from '@/lib/security/payment-security';

// Supabase admin client (service role)
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

// Rate limit config
const RATE_LIMITS = {
  IDENTIFY_PER_IP: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour per IP
  IDENTIFY_PER_EMAIL: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour per email
  RENEW_PER_IP: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour per IP
  RENEW_PER_EMAIL: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3/hour per email
};

// ============================================================================
// GET /api/renew?email=xxx — Identity Lookup
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    if (isRateLimited(`renew:identify:ip:${clientIP}`, RATE_LIMITS.IDENTIFY_PER_IP.maxRequests, RATE_LIMITS.IDENTIFY_PER_IP.windowMs)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    if (isRateLimited(`renew:identify:email:${email}`, RATE_LIMITS.IDENTIFY_PER_EMAIL.maxRequests, RATE_LIMITS.IDENTIFY_PER_EMAIL.windowMs)) {
      return NextResponse.json(
        { error: 'Trop de tentatives pour cet email. Réessayez plus tard.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // Look up user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, is_paid, subscription_expires_at')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { found: false, error: 'Aucun compte trouvé avec cet email.' },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    // Calculate subscription status
    const now = new Date();
    const expiresAt = user.subscription_expires_at 
      ? new Date(user.subscription_expires_at) 
      : null;
    const isExpired = !expiresAt || expiresAt < now;
    const daysLeft = expiresAt 
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
      : 0;

    return NextResponse.json({
      found: true,
      fullName: user.full_name || 'Utilisateur',
      expiresAt: expiresAt?.toISOString() || null,
      daysLeft: isExpired ? 0 : daysLeft,
      isExpired,
      isPaid: user.is_paid,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('[Renew API] Identity lookup error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// ============================================================================
// POST /api/renew — Code-Based Renewal
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse body
    let body: { email?: string; keyCode?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const email = body.email?.trim().toLowerCase();
    const keyCode = body.keyCode?.trim().toUpperCase();

    // Validate inputs
    if (!email || !keyCode) {
      return NextResponse.json(
        { error: 'Email et code d\'activation requis' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    if (isRateLimited(`renew:code:ip:${clientIP}`, RATE_LIMITS.RENEW_PER_IP.maxRequests, RATE_LIMITS.RENEW_PER_IP.windowMs)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    if (isRateLimited(`renew:code:email:${email}`, RATE_LIMITS.RENEW_PER_EMAIL.maxRequests, RATE_LIMITS.RENEW_PER_EMAIL.windowMs)) {
      return NextResponse.json(
        { error: 'Trop de tentatives pour cet email. Réessayez plus tard.' },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    // Step 1: Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, subscription_expires_at')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Aucun compte trouvé avec cet email.' },
        { status: 404, headers: getSecurityHeaders() }
      );
    }

    // Step 2: Consume activation key atomically
    const { data: consumedKey, error: keyError } = await supabaseAdmin
      .from('activation_keys')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('key_code', keyCode)
      .eq('is_used', false)
      .select('id, duration_days')
      .single();

    if (keyError || !consumedKey) {
      return NextResponse.json(
        { success: false, error: 'Code invalide ou déjà utilisé.' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Step 3: Calculate new expiry using extension logic
    // If expired → start from NOW(); if active → extend from current expiry
    const now = new Date();
    const currentExpiry = user.subscription_expires_at
      ? new Date(user.subscription_expires_at)
      : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + consumedKey.duration_days);
    newExpiresAt.setHours(23, 59, 59, 999);

    // Update key with expiry
    await supabaseAdmin
      .from('activation_keys')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', consumedKey.id);

    // Step 4: Update user subscription
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_paid: true,
        subscription_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      // CRITICAL: Rollback — un-use the activation key
      console.error('[Renew API] User update failed, rolling back key:', updateError);
      const { error: rollbackError } = await supabaseAdmin
        .from('activation_keys')
        .update({
          is_used: false,
          used_by: null,
          used_at: null,
          expires_at: null,
        })
        .eq('id', consumedKey.id);

      if (rollbackError) {
        console.error('[Renew API] CRITICAL: Key rollback failed:', rollbackError);
      }

      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour de l\'abonnement.' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    console.log(`[Renew API] Successfully renewed subscription for ${email}. New expiry: ${newExpiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      newExpiresAt: newExpiresAt.toISOString(),
      durationDays: consumedKey.duration_days,
    }, { headers: getSecurityHeaders() });

  } catch (error) {
    console.error('[Renew API] Code renewal error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
