/**
 * Subscription Plans CRUD
 *
 * Provides functions to manage subscription plans stored in the
 * `subscription_plans` table. Used by admin settings and the checkout API.
 */

import { supabaseAdmin } from '@/lib/supabase-admin';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  is_featured: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  name: string;
  duration_days: number;
  price: number;
  is_active?: boolean;
  sort_order?: number;
  is_featured?: boolean;
  description?: string | null;
}

export interface UpdatePlanInput {
  id: string;
  name?: string;
  duration_days?: number;
  price?: number;
  is_active?: boolean;
  sort_order?: number;
  is_featured?: boolean;
  description?: string | null;
}

// ============================================================================
// Read operations
// ============================================================================

/** Get only active plans, sorted by sort_order (for the buy page / checkout API) */
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[SubscriptionPlans] Error fetching active plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }

  return data || [];
}

/** Get ALL plans, sorted by sort_order (for the admin settings page) */
export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[SubscriptionPlans] Error fetching all plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }

  return data || [];
}

/** Find a single active plan by its duration_days (for checkout validation) */
export async function getActivePlanByDuration(
  durationDays: number
): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('duration_days', durationDays)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found — that's fine, return null
    console.error('[SubscriptionPlans] Error fetching plan by duration:', error);
  }

  return data || null;
}

/** Find a plan by ID */
export async function getPlanById(
  id: string
): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[SubscriptionPlans] Error fetching plan by ID:', error);
    return null;
  }

  return data;
}

// ============================================================================
// Write operations
// ============================================================================

/** Create a new plan */
export async function createPlan(
  input: CreatePlanInput
): Promise<SubscriptionPlan> {
  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .insert({
      name: input.name,
      duration_days: input.duration_days,
      price: input.price,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
      is_featured: input.is_featured ?? false,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[SubscriptionPlans] Error creating plan:', error);
    throw new Error('Failed to create plan');
  }

  return data;
}

/** Update an existing plan */
export async function updatePlan(
  input: UpdatePlanInput
): Promise<SubscriptionPlan> {
  const { id, ...updates } = input;

  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[SubscriptionPlans] Error updating plan:', error);
    throw new Error('Failed to update plan');
  }

  return data;
}

/** Toggle plan active status */
export async function togglePlanActive(id: string): Promise<SubscriptionPlan> {
  // Get current state
  const plan = await getPlanById(id);
  if (!plan) {
    throw new Error('Plan not found');
  }

  // If deactivating, ensure there's at least one other active plan
  if (plan.is_active) {
    const activePlans = await getActivePlans();
    if (activePlans.length <= 1) {
      throw new Error('Cannot deactivate the last active plan');
    }
  }

  return updatePlan({ id, is_active: !plan.is_active });
}

/** Delete a plan */
export async function deletePlan(id: string): Promise<void> {
  // Ensure not deleting the last active plan
  const plan = await getPlanById(id);
  if (plan?.is_active) {
    const activePlans = await getActivePlans();
    if (activePlans.length <= 1) {
      throw new Error('Cannot delete the last active plan');
    }
  }

  const { error } = await supabaseAdmin
    .from('subscription_plans')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[SubscriptionPlans] Error deleting plan:', error);
    throw new Error('Failed to delete plan');
  }
}
