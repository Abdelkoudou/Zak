/**
 * Real Users Library
 * 
 * Functions to fetch and manage "real" users - those who activated
 * their codes through a sales point OR paid online (not test users).
 */

import { supabase } from './supabase';
import type { YearLevel, Speciality } from '@/types/database';

export interface RealUser {
    id: string;
    email: string;
    fullName?: string;
    yearOfStudy?: YearLevel;
    speciality?: Speciality;
    region?: string;
    // Source info
    source: 'sales_point' | 'online_payment';
    salesPointId?: string;
    salesPointName?: string;
    salesPointCode?: string;
    salesPointLocation?: string;
    // Activation info
    keyCode: string;
    activatedAt: Date;
    // Subscription info
    isPaid: boolean;
    subscriptionExpiresAt?: Date;
    isActive: boolean; // Calculated: isPaid && not expired
}

export interface RealUserStats {
    totalRealUsers: number;
    activeUsers: number;
    expiredUsers: number;
    salesPointUsers: number;
    onlinePaymentUsers: number;
    bySalesPoint: { name: string; count: number }[];
}

/**
 * Fetch all "real" users - users who activated via a sales point OR paid online
 */
export async function fetchRealUsers(filters?: {
    salesPointId?: string;
    status?: 'active' | 'expired' | '';
    search?: string;
    source?: 'sales_point' | 'online_payment' | '';
}): Promise<{ data: RealUser[]; error?: string }> {
    try {
        const now = new Date();
        const realUsers: RealUser[] = [];

        // =====================================================
        // SOURCE 1: Sales Point Users (activation_keys with sales_point_id)
        // =====================================================
        if (!filters?.source || filters.source === 'sales_point') {
            let spQuery = supabase
                .from('activation_keys')
                .select(`
                    id,
                    key_code,
                    used_by,
                    used_at,
                    sales_point_id,
                    sales_points (
                        id,
                        code,
                        name,
                        location
                    )
                `)
                .eq('is_used', true)
                .not('sales_point_id', 'is', null)
                .not('used_by', 'is', null)
                .order('used_at', { ascending: false });

            if (filters?.salesPointId) {
                spQuery = spQuery.eq('sales_point_id', filters.salesPointId);
            }

            const { data: spKeys, error: spError } = await spQuery;

            if (spError) {
                console.error('Sales Point Keys Error:', spError);
            } else if (spKeys && spKeys.length > 0) {
                // Get user IDs
                const userIds = spKeys.map((k: { used_by: string }) => k.used_by);

                const { data: users } = await supabase
                    .from('users')
                    .select('*')
                    .in('id', userIds);

                const userMap: Record<string, Record<string, unknown>> = {};
                (users || []).forEach((u: Record<string, unknown>) => {
                    userMap[u.id as string] = u;
                });

                // Use any for Supabase dynamic result
                spKeys.forEach((k: any) => {
                    if (!userMap[k.used_by]) return;

                    const user = userMap[k.used_by];
                    const salesPoint = Array.isArray(k.sales_points)
                        ? k.sales_points[0]
                        : k.sales_points;

                    const expiresAt = user.subscription_expires_at
                        ? new Date(user.subscription_expires_at as string)
                        : undefined;
                    const isActive = (user.is_paid as boolean) && (!expiresAt || expiresAt > now);

                    realUsers.push({
                        id: user.id as string,
                        email: user.email as string,
                        fullName: user.full_name as string | undefined,
                        yearOfStudy: user.year_of_study as YearLevel | undefined,
                        speciality: user.speciality as Speciality | undefined,
                        region: user.region as string | undefined,
                        source: 'sales_point',
                        salesPointId: salesPoint?.id || k.sales_point_id,
                        salesPointName: salesPoint?.name,
                        salesPointCode: salesPoint?.code,
                        salesPointLocation: salesPoint?.location,
                        keyCode: k.key_code,
                        activatedAt: new Date(k.used_at),
                        isPaid: user.is_paid as boolean,
                        subscriptionExpiresAt: expiresAt,
                        isActive,
                    });
                });
            }
        }

        // =====================================================
        // SOURCE 2: Online Payment Users
        // =====================================================
        if (!filters?.source || filters.source === 'online_payment') {
            // Skip if filtering by sales point (online payments don't have sales points)
            if (!filters?.salesPointId) {
                const { data: onlinePayments, error: opError } = await supabase
                    .from('online_payments')
                    .select(`
                        id,
                        customer_email,
                        customer_name,
                        status,
                        paid_at,
                        activation_key_id,
                        activation_keys!online_payments_activation_key_id_fkey (
                            key_code,
                            is_used,
                            used_by,
                            used_at
                        )
                    `)
                    .eq('status', 'paid')
                    .not('activation_key_id', 'is', null)
                    .order('paid_at', { ascending: false });

                if (opError) {
                    console.error('Online Payments Error:', opError);
                } else if (onlinePayments && onlinePayments.length > 0) {
                    // Get user IDs from used activation keys
                    // Filter used payments
                    const usedPayments = onlinePayments.filter((p: any) =>
                        p.activation_keys?.is_used && p.activation_keys?.used_by
                    );

                    const userIds = usedPayments.map((p: any) => p.activation_keys.used_by);

                    if (userIds.length > 0) {
                        const { data: users } = await supabase
                            .from('users')
                            .select('*')
                            .in('id', userIds);

                        const userMap: Record<string, Record<string, unknown>> = {};
                        (users || []).forEach((u: Record<string, unknown>) => {
                            userMap[u.id as string] = u;
                        });

                        usedPayments.forEach((p: any) => {
                            const userId = p.activation_keys.used_by;
                            // Skip if already added from sales point (avoid duplicates)
                            if (realUsers.some(ru => ru.id === userId)) return;
                            if (!userMap[userId]) return;

                            const user = userMap[userId];
                            const expiresAt = user.subscription_expires_at
                                ? new Date(user.subscription_expires_at as string)
                                : undefined;
                            const isActive = (user.is_paid as boolean) && (!expiresAt || expiresAt > now);

                            realUsers.push({
                                id: user.id as string,
                                email: user.email as string,
                                fullName: user.full_name as string | undefined,
                                yearOfStudy: user.year_of_study as YearLevel | undefined,
                                speciality: user.speciality as Speciality | undefined,
                                region: user.region as string | undefined,
                                source: 'online_payment',
                                keyCode: p.activation_keys.key_code,
                                activatedAt: new Date(p.activation_keys.used_at || p.paid_at),
                                isPaid: user.is_paid as boolean,
                                subscriptionExpiresAt: expiresAt,
                                isActive,
                            });
                        });
                    }
                }
            }
        }

        // Apply search filter
        let filtered = realUsers;
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(u =>
                u.email.toLowerCase().includes(search) ||
                u.fullName?.toLowerCase().includes(search) ||
                u.salesPointName?.toLowerCase().includes(search) ||
                u.keyCode.toLowerCase().includes(search)
            );
        }

        // Apply status filter
        if (filters?.status === 'active') {
            filtered = filtered.filter(u => u.isActive);
        } else if (filters?.status === 'expired') {
            filtered = filtered.filter(u => !u.isActive);
        }

        // Sort by activation date (newest first)
        filtered.sort((a, b) => b.activatedAt.getTime() - a.activatedAt.getTime());

        console.log('Real Users Found:', filtered.length, { salesPoint: filtered.filter(u => u.source === 'sales_point').length, online: filtered.filter(u => u.source === 'online_payment').length });
        return { data: filtered };
    } catch (err) {
        console.error('fetchRealUsers error:', err);
        return { data: [], error: (err as Error).message };
    }
}

/**
 * Fetch statistics for real users
 */
export async function fetchRealUserStats(): Promise<RealUserStats> {
    const { data: realUsers } = await fetchRealUsers();

    const activeUsers = realUsers.filter(u => u.isActive).length;
    const expiredUsers = realUsers.filter(u => !u.isActive).length;
    const salesPointUsers = realUsers.filter(u => u.source === 'sales_point').length;
    const onlinePaymentUsers = realUsers.filter(u => u.source === 'online_payment').length;

    // Group by sales point
    const salesPointCounts: Record<string, number> = {};
    realUsers.filter(u => u.salesPointName).forEach(u => {
        salesPointCounts[u.salesPointName!] = (salesPointCounts[u.salesPointName!] || 0) + 1;
    });

    const bySalesPoint = Object.entries(salesPointCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        totalRealUsers: realUsers.length,
        activeUsers,
        expiredUsers,
        salesPointUsers,
        onlinePaymentUsers,
        bySalesPoint,
    };
}

/**
 * Export real users to CSV
 */
export function exportRealUsersToCsv(users: RealUser[]): string {
    const headers = [
        'Email', 'Nom', 'Année', 'Spécialité', 'Région',
        'Source', 'Point de Vente', 'Localisation', 'Code Activation',
        'Date Activation', 'Statut', 'Expire le'
    ];

    const rows = users.map(user => [
        user.email,
        user.fullName || '',
        user.yearOfStudy ? `${user.yearOfStudy}ère année` : '',
        user.speciality || '',
        user.region || '',
        user.source === 'sales_point' ? 'Point de Vente' : 'Paiement en Ligne',
        user.salesPointName || '',
        user.salesPointLocation || '',
        user.keyCode,
        new Date(user.activatedAt).toLocaleDateString('fr-FR'),
        user.isActive ? 'Actif' : 'Expiré',
        user.subscriptionExpiresAt
            ? new Date(user.subscriptionExpiresAt).toLocaleDateString('fr-FR')
            : '',
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
}
