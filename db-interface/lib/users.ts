/**
 * User Management Library
 * 
 * Provides functions for managing users, their subscriptions, and devices.
 * Owner-only operations for the admin panel.
 */

import { supabase } from './supabase';
import type { YearLevel, Speciality, ActivationKeyUser } from '@/types/database';

// User role type
export type UserRole = 'owner' | 'admin' | 'manager' | 'student';

// Extended user interface for management
export interface ManagedUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  isPaid: boolean;
  subscriptionExpiresAt?: Date;
  yearOfStudy?: YearLevel;
  speciality?: Speciality;
  region?: string;
  deviceCount: number;
  activationKeyCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User update data
export interface UserUpdateData {
  fullName?: string;
  yearOfStudy?: YearLevel;
  speciality?: Speciality;
  region?: string;
  subscriptionExpiresAt?: Date | null;
  isPaid?: boolean;
}

// User stats
export interface UserStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  expiredUsers: number;
  activeSubscriptions: number;
  totalDevices: number;
  year1Users: number;
  year2Users: number;
  year3Users: number;
}

/**
 * Fetch all users with their device counts and subscription info
 */
export async function fetchAllUsers(filters?: {
  role?: UserRole;
  isPaid?: boolean;
  yearOfStudy?: YearLevel;
  search?: string;
}): Promise<{ data: ManagedUser[]; error?: string }> {
  try {
    // Fetch users
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.isPaid !== undefined) {
      query = query.eq('is_paid', filters.isPaid);
    }
    if (filters?.yearOfStudy) {
      query = query.eq('year_of_study', filters.yearOfStudy);
    }
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      return { data: [], error: usersError.message };
    }

    if (!users || users.length === 0) {
      return { data: [] };
    }

    // Get user IDs
    const userIds = users.map(u => u.id);

    // Fetch device counts for all users
    const { data: deviceCounts } = await supabase
      .from('device_sessions')
      .select('user_id')
      .in('user_id', userIds);

    // Count devices per user
    const deviceCountMap: Record<string, number> = {};
    (deviceCounts || []).forEach((d: { user_id: string }) => {
      deviceCountMap[d.user_id] = (deviceCountMap[d.user_id] || 0) + 1;
    });

    // Fetch activation keys used by these users
    const { data: activationKeys } = await supabase
      .from('activation_keys')
      .select('used_by, key_code')
      .in('used_by', userIds)
      .eq('is_used', true);

    // Map activation keys to users
    const keyMap: Record<string, string> = {};
    (activationKeys || []).forEach((k: { used_by: string; key_code: string }) => {
      keyMap[k.used_by] = k.key_code;
    });

    // Transform users
    const transformed: ManagedUser[] = users.map((user: Record<string, unknown>) => ({
      id: user.id as string,
      email: user.email as string,
      fullName: user.full_name as string | undefined,
      role: user.role as UserRole,
      isPaid: user.is_paid as boolean,
      subscriptionExpiresAt: user.subscription_expires_at 
        ? new Date(user.subscription_expires_at as string) 
        : undefined,
      yearOfStudy: user.year_of_study as YearLevel | undefined,
      speciality: user.speciality as Speciality | undefined,
      region: user.region as string | undefined,
      deviceCount: deviceCountMap[user.id as string] || 0,
      activationKeyCode: keyMap[user.id as string],
      createdAt: new Date(user.created_at as string),
      updatedAt: new Date(user.updated_at as string),
    }));

    return { data: transformed };
  } catch (err) {
    return { data: [], error: (err as Error).message };
  }
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(userId: string): Promise<{ data?: ManagedUser; error?: string }> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Get device count
  const { count: deviceCount } = await supabase
    .from('device_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get activation key
  const { data: keyData } = await supabase
    .from('activation_keys')
    .select('key_code')
    .eq('used_by', userId)
    .eq('is_used', true)
    .single();

  return {
    data: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      isPaid: user.is_paid,
      subscriptionExpiresAt: user.subscription_expires_at 
        ? new Date(user.subscription_expires_at) 
        : undefined,
      yearOfStudy: user.year_of_study,
      speciality: user.speciality,
      region: user.region,
      deviceCount: deviceCount || 0,
      activationKeyCode: keyData?.key_code,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
    }
  };
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string, 
  updates: UserUpdateData
): Promise<{ error?: string }> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.fullName !== undefined) {
    updateData.full_name = updates.fullName;
  }
  if (updates.yearOfStudy !== undefined) {
    updateData.year_of_study = updates.yearOfStudy;
  }
  if (updates.speciality !== undefined) {
    updateData.speciality = updates.speciality;
  }
  if (updates.region !== undefined) {
    updateData.region = updates.region;
  }
  if (updates.subscriptionExpiresAt !== undefined) {
    updateData.subscription_expires_at = updates.subscriptionExpiresAt 
      ? updates.subscriptionExpiresAt.toISOString() 
      : null;
  }
  if (updates.isPaid !== undefined) {
    updateData.is_paid = updates.isPaid;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  return { error: error?.message };
}

/**
 * Extend user subscription
 */
export async function extendSubscription(
  userId: string, 
  days: number
): Promise<{ newExpiresAt?: Date; error?: string }> {
  // Get current subscription
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('subscription_expires_at, is_paid')
    .eq('id', userId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  // Calculate new expiration date
  const now = new Date();
  const currentExpiry = user.subscription_expires_at 
    ? new Date(user.subscription_expires_at) 
    : now;
  
  // If expired, start from now; otherwise extend from current expiry
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newExpiresAt = new Date(baseDate);
  newExpiresAt.setDate(newExpiresAt.getDate() + days);

  const { error } = await supabase
    .from('users')
    .update({
      subscription_expires_at: newExpiresAt.toISOString(),
      is_paid: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { newExpiresAt };
}

/**
 * Revoke user subscription
 */
export async function revokeSubscription(userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('users')
    .update({
      is_paid: false,
      subscription_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { error: error?.message };
}

/**
 * Delete all user devices
 */
export async function deleteAllUserDevices(userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('device_sessions')
    .delete()
    .eq('user_id', userId);

  return { error: error?.message };
}

/**
 * Fetch user statistics
 */
export async function fetchUserStats(): Promise<UserStats> {
  const now = new Date().toISOString();

  const [
    totalResult,
    paidResult,
    expiredResult,
    devicesResult,
    year1Result,
    year2Result,
    year3Result,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_paid', true),
    supabase.from('users').select('id', { count: 'exact', head: true })
      .eq('is_paid', true).lt('subscription_expires_at', now),
    supabase.from('device_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('year_of_study', '1'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('year_of_study', '2'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('year_of_study', '3'),
  ]);

  const totalUsers = totalResult.count || 0;
  const paidUsers = paidResult.count || 0;
  const expiredUsers = expiredResult.count || 0;
  const activeSubscriptions = paidUsers - expiredUsers;

  return {
    totalUsers,
    paidUsers,
    freeUsers: totalUsers - paidUsers,
    expiredUsers,
    activeSubscriptions,
    totalDevices: devicesResult.count || 0,
    year1Users: year1Result.count || 0,
    year2Users: year2Result.count || 0,
    year3Users: year3Result.count || 0,
  };
}

/**
 * Export users to CSV
 */
export function exportUsersToCsv(users: ManagedUser[]): string {
  const headers = [
    'Email', 'Nom', 'Rôle', 'Année', 'Spécialité', 'Région',
    'Abonnement', 'Expire le', 'Appareils', 'Code Activation', 'Inscrit le'
  ];

  const rows = users.map(user => [
    user.email,
    user.fullName || '',
    user.role,
    user.yearOfStudy ? `${user.yearOfStudy}ère année` : '',
    user.speciality || '',
    user.region || '',
    user.isPaid ? 'Payé' : 'Non activé',
    user.subscriptionExpiresAt 
      ? new Date(user.subscriptionExpiresAt).toLocaleDateString('fr-FR') 
      : '',
    user.deviceCount.toString(),
    user.activationKeyCode || '',
    new Date(user.createdAt).toLocaleDateString('fr-FR'),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}
