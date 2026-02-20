'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getActivePlans } from '@/lib/subscription-plans';
import { generateSecureActivationCode } from '@/lib/security/payment-security';

// ============================================================================
// Types
// ============================================================================

export interface ExpiredUser {
  id: string;
  email: string;
  fullName: string | null;
  faculty: string | null;
  yearOfStudy: string | null;
  subscriptionExpiresAt: string;
  /** Positive = expired N days ago, negative = expires in N days */
  daysSinceExpiry: number;
  status: 'expired' | 'expiring';
  lastActivationCode: string | null;
  lastDurationDays: number | null;
}

export interface UserLookupResult {
  id: string;
  email: string;
  fullName: string | null;
  faculty: string | null;
  yearOfStudy: string | null;
  region: string | null;
  isPaid: boolean;
  subscriptionExpiresAt: string | null;
  lastActivationCode: string | null;
  lastDurationDays: number | null;
}

interface ActionResult {
  success?: boolean;
  error?: string;
  message?: string;
}

// ============================================================================
// Get expired + expiring users (expired OR expiring within 30 days)
// ============================================================================

export async function getExpiredUsers(): Promise<{
  data: ExpiredUser[];
  error?: string;
}> {
  try {
    // Include users expiring within the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, faculty, year_of_study, subscription_expires_at')
      .eq('is_paid', true)
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', thirtyDaysFromNow.toISOString())
      .order('subscription_expires_at', { ascending: true });

    if (error) {
      console.error('[Renewals] Error fetching expired users:', error);
      return { data: [], error: error.message };
    }

    if (!users || users.length === 0) {
      return { data: [] };
    }

    // Get last activation key for each user
    const userIds = users.map((u) => u.id);
    const { data: keys } = await supabaseAdmin
      .from('activation_keys')
      .select('used_by, key_code, duration_days, used_at')
      .in('used_by', userIds)
      .eq('is_used', true)
      .order('used_at', { ascending: false });

    // Build a map: userId -> latest key
    const keyMap = new Map<string, { key_code: string; duration_days: number }>();
    if (keys) {
      for (const k of keys) {
        if (k.used_by && !keyMap.has(k.used_by)) {
          keyMap.set(k.used_by, {
            key_code: k.key_code,
            duration_days: k.duration_days,
          });
        }
      }
    }

    const now = Date.now();
    const result: ExpiredUser[] = users.map((u) => {
      const expiresAt = new Date(u.subscription_expires_at).getTime();
      const diffDays = Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24));
      const lastKey = keyMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        faculty: u.faculty,
        yearOfStudy: u.year_of_study,
        subscriptionExpiresAt: u.subscription_expires_at,
        daysSinceExpiry: diffDays,
        status: diffDays >= 0 ? 'expired' : 'expiring',
        lastActivationCode: lastKey?.key_code ?? null,
        lastDurationDays: lastKey?.duration_days ?? null,
      };
    });

    return { data: result };
  } catch (err) {
    console.error('[Renewals] Unexpected error:', err);
    return { data: [], error: 'Failed to fetch expired users' };
  }
}

// ============================================================================
// Search user by email
// ============================================================================

export async function searchUserByEmail(
  email: string
): Promise<{ data: UserLookupResult | null; error?: string }> {
  if (!email || !email.includes('@')) {
    return { data: null, error: 'Email invalide' };
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(
        'id, email, full_name, faculty, year_of_study, region, is_paid, subscription_expires_at'
      )
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('[Renewals] Error searching user:', error);
      return { data: null, error: error.message };
    }

    if (!user) {
      return { data: null, error: 'Aucun utilisateur trouvé avec cet email' };
    }

    // Get latest activation key
    const { data: lastKey } = await supabaseAdmin
      .from('activation_keys')
      .select('key_code, duration_days')
      .eq('used_by', user.id)
      .eq('is_used', true)
      .order('used_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        faculty: user.faculty,
        yearOfStudy: user.year_of_study,
        region: user.region,
        isPaid: user.is_paid,
        subscriptionExpiresAt: user.subscription_expires_at,
        lastActivationCode: lastKey?.key_code ?? null,
        lastDurationDays: lastKey?.duration_days ?? null,
      },
    };
  } catch (err) {
    console.error('[Renewals] Unexpected search error:', err);
    return { data: null, error: 'Erreur lors de la recherche' };
  }
}

// ============================================================================
// Renew subscription
// ============================================================================

export async function renewSubscription(params: {
  userId: string;
  planId: string;
  receiptFileName?: string;
  notes?: string;
}): Promise<ActionResult & { keyCode?: string; expiresAt?: string }> {
  const { userId, planId, notes } = params;

  if (!userId || !planId) {
    return { error: 'Paramètres manquants' };
  }

  try {
    // Get the plan
    const plans = await getActivePlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return { error: 'Offre introuvable' };
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, is_paid, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { error: 'Utilisateur introuvable' };
    }

    // Calculate new expiry: extend from now (or from current expiry if still valid)
    const now = new Date();
    const currentExpiry = user.subscription_expires_at
      ? new Date(user.subscription_expires_at)
      : null;
    const baseDate =
      currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + plan.duration_days);
    newExpiry.setHours(23, 59, 59, 999);

    // Check if the user already has an existing activation key
    const { data: existingKey } = await supabaseAdmin
      .from('activation_keys')
      .select('id, key_code, duration_days')
      .eq('used_by', userId)
      .eq('is_used', true)
      .order('used_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // ── Step 1: Update user FIRST (easier to undo a field than delete a key) ──
    const previousExpiry = user.subscription_expires_at;
    const previousIsPaid = user.is_paid;
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_paid: true,
        subscription_expires_at: newExpiry.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Renewals] Error updating user:', updateError);
      return { error: 'Erreur lors de la mise à jour de l\'abonnement' };
    }

    // ── Step 2: Create or extend the activation key ──
    let keyCode: string;

    if (existingKey) {
      // ---- EXTEND existing key ----
      const renewNote = notes
        ? `Renouvellement manuel: ${notes}`
        : `Renouvellement manuel - ${plan.name}`;
      const receiptNote = params.receiptFileName
        ? ` | Reçu: ${params.receiptFileName}`
        : '';

      const { error: keyUpdateError } = await supabaseAdmin
        .from('activation_keys')
        .update({
          duration_days: existingKey.duration_days + plan.duration_days,
          expires_at: newExpiry.toISOString(),
          notes: `${renewNote}${receiptNote}`,
          price_paid: plan.price,
        })
        .eq('id', existingKey.id);

      if (keyUpdateError) {
        console.error('[Renewals] Error extending key — rolling back user update:', keyUpdateError);
        // Rollback: restore previous is_paid and expiry on the user row
        const { error: rollbackError } = await supabaseAdmin
          .from('users')
          .update({
            is_paid: previousIsPaid,
            subscription_expires_at: previousExpiry,
            updated_at: now.toISOString(),
          })
          .eq('id', userId);
        if (rollbackError) {
          console.error('[Renewals] CRITICAL: rollback after key extension failure also failed:', rollbackError);
          return { error: 'Erreur critique: échec de l\'extension ET de l\'annulation — contactez le support' };
        }
        return { error: 'Erreur lors de l\'extension du code (annulation effectuée)' };
      }

      keyCode = existingKey.key_code;
    } else {
      // ---- CREATE new key (user has no existing one) ----
      keyCode = generateSecureActivationCode();

      const { data: onlineSP } = await supabaseAdmin
        .from('sales_points')
        .select('id')
        .eq('code', 'ONLINE')
        .maybeSingle();

      const { error: keyError } = await supabaseAdmin
        .from('activation_keys')
        .insert({
          key_code: keyCode,
          duration_days: plan.duration_days,
          is_used: true,
          used_by: userId,
          used_at: now.toISOString(),
          expires_at: newExpiry.toISOString(),
          payment_source: 'manual' as const,
          sales_point_id: onlineSP?.id || null,
          price_paid: plan.price,
          notes: notes
            ? `Renouvellement manuel: ${notes}`
            : `Renouvellement manuel - ${plan.name}`,
        })
        .select('id')
        .single();

      if (keyError) {
        console.error('[Renewals] Error creating key — rolling back user update:', keyError);
        // Rollback: restore previous is_paid and expiry on the user row
        const { error: rollbackError } = await supabaseAdmin
          .from('users')
          .update({
            is_paid: previousIsPaid,
            subscription_expires_at: previousExpiry,
            updated_at: now.toISOString(),
          })
          .eq('id', userId);
        if (rollbackError) {
          console.error('[Renewals] CRITICAL: rollback after key creation failure also failed:', rollbackError);
          return { error: 'Erreur critique: échec de la création ET de l\'annulation — contactez le support' };
        }
        return { error: 'Erreur lors de la création du code (annulation effectuée)' };
      }
    }

    return {
      success: true,
      message: 'Abonnement renouvelé avec succès',
      keyCode,
      expiresAt: newExpiry.toISOString(),
    };
  } catch (err) {
    console.error('[Renewals] Unexpected renewal error:', err);
    return { error: 'Erreur inattendue lors du renouvellement' };
  }
}

// ============================================================================
// Upload receipt to storage (returns the file path)
// ============================================================================

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export async function uploadReceipt(
  formData: FormData
): Promise<{ path?: string; error?: string }> {
  const file = formData.get('receipt') as File | null;
  if (!file) {
    return { error: 'Aucun fichier fourni' };
  }

  // Validate MIME type
  if (!ALLOWED_RECEIPT_MIME_TYPES.includes(file.type)) {
    return { error: 'Type de fichier non autorisé (JPEG, PNG, WebP, GIF ou PDF uniquement)' };
  }

  // Validate file size
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return { error: `Le fichier est trop volumineux (maximum ${MAX_RECEIPT_SIZE_BYTES / 1024 / 1024} Mo)` };
  }

  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = `receipts/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from('payment-receipts')
    .upload(filePath, buffer, {
      contentType: file.type || 'image/webp',
      upsert: false,
    });

  if (error) {
    console.error('[Renewals] Upload error:', error);
    return { error: 'Erreur lors de l\'upload du reçu' };
  }

  return { path: filePath };
}

// ============================================================================
// Get active plans (for the renewal form)
// ============================================================================

export async function fetchActivePlans() {
  const plans = await getActivePlans();
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    durationDays: p.duration_days,
    price: p.price,
  }));
}

// ============================================================================
// Renewal history types & action
// ============================================================================

export interface RenewalHistoryItem {
  id: string;
  keyCode: string;
  durationDays: number;
  pricePaid: number | null;
  notes: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  receiptPath: string | null;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

export async function getRenewalHistory(): Promise<{
  data: RenewalHistoryItem[];
  error?: string;
}> {
  try {
    const { data: keys, error } = await supabaseAdmin
      .from('activation_keys')
      .select('id, key_code, duration_days, price_paid, notes, used_at, expires_at, used_by')
      .eq('payment_source', 'manual')
      .eq('is_used', true)
      .ilike('notes', 'Renouvellement manuel%')
      .order('used_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Renewals] Error fetching history:', error);
      return { data: [], error: error.message };
    }

    if (!keys || keys.length === 0) {
      return { data: [] };
    }

    // Get user info for each key
    const userIds = [...new Set(keys.map((k) => k.used_by).filter(Boolean))] as string[];
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    const userMap = new Map<string, { id: string; email: string; full_name: string | null }>();
    if (users) {
      for (const u of users) {
        userMap.set(u.id, u);
      }
    }

    const result: RenewalHistoryItem[] = keys.map((k) => {
      // Extract receipt path from notes if present
      let receiptPath: string | null = null;
      if (k.notes) {
        const receiptMatch = k.notes.match(/Reçu:\s*(\S+)/);
        if (receiptMatch) {
          receiptPath = receiptMatch[1];
        }
      }

      const user = k.used_by ? userMap.get(k.used_by) : null;

      return {
        id: k.id,
        keyCode: k.key_code,
        durationDays: k.duration_days,
        pricePaid: k.price_paid,
        notes: k.notes,
        usedAt: k.used_at,
        expiresAt: k.expires_at,
        receiptPath,
        user: user
          ? { id: user.id, email: user.email, fullName: user.full_name }
          : null,
      };
    });

    return { data: result };
  } catch (err) {
    console.error('[Renewals] Unexpected history error:', err);
    return { data: [], error: 'Failed to fetch renewal history' };
  }
}

// ============================================================================
// Get a signed URL for a receipt image (valid 1 hour)
// ============================================================================

export async function getReceiptUrl(path: string): Promise<{
  url?: string;
  error?: string;
}> {
  if (!path) return { error: 'No path provided' };

  const { data, error } = await supabaseAdmin.storage
    .from('payment-receipts')
    .createSignedUrl(path, 3600); // 1 hour

  if (error) {
    console.error('[Renewals] Error creating signed URL:', error);
    return { error: 'Could not load receipt image' };
  }

  return { url: data.signedUrl };
}
