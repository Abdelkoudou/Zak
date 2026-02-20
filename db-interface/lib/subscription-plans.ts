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
// Custom Error Classes
// ============================================================================

/** Thrown when attempting to deactivate or delete the last active plan */
export class LastActivePlanError extends Error {
  constructor(message = 'Cannot deactivate the last active plan') {
    super(message);
    this.name = 'LastActivePlanError';
  }
}

/** Thrown when a plan cannot be found */
export class PlanNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Plan not found: ${id}` : 'Plan not found');
    this.name = 'PlanNotFoundError';
  }
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
    .maybeSingle();

  if (error) {
    console.error('[SubscriptionPlans] Error fetching plan by duration:', error);
    throw new Error('Failed to fetch plan by duration');
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

/**
 * Toggle plan active status (atomic via DB RPC).
 * Uses row-level locking to prevent TOCTOU race conditions.
 */
export async function togglePlanActive(id: string): Promise<SubscriptionPlan> {
  const { data, error } = await supabaseAdmin.rpc('toggle_plan_active', {
    plan_id: id,
  });

  if (error) {
    // Map DB error codes to typed errors
    if (error.message?.includes('Plan not found')) {
      throw new PlanNotFoundError(id);
    }
    if (error.message?.includes('last active plan')) {
      throw new LastActivePlanError();
    }
    console.error('[SubscriptionPlans] Error toggling plan:', error);
    throw new Error('Failed to toggle plan status');
  }

  // RPC returns an array (SETOF); take the first row
  const plan = Array.isArray(data) ? data[0] : data;
  if (!plan) {
    throw new PlanNotFoundError(id);
  }

  return plan as SubscriptionPlan;
}

/**
 * Delete a plan (atomic via DB RPC).
 * Uses row-level locking to prevent TOCTOU race conditions.
 */
export async function deletePlan(id: string): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc('delete_plan_safe', {
    plan_id: id,
  });

  if (error) {
    // Map DB error codes to typed errors
    if (error.message?.includes('Plan not found')) {
      throw new PlanNotFoundError(id);
    }
    if (error.message?.includes('last active plan')) {
      throw new LastActivePlanError('Cannot delete the last active plan');
    }
    console.error('[SubscriptionPlans] Error deleting plan:', error);
    throw new Error('Failed to delete plan');
  }

  const deleted = Array.isArray(data) ? data[0] : data;
  if (!deleted) {
    throw new PlanNotFoundError(id);
  }
}
