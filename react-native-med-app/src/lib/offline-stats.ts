// ============================================================================
// Offline Statistics Service
// Handles caching of stats and queueing of offline attempts for synchronization
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatistics, TestAttempt } from '@/types';
import { supabase } from './supabase';
import { TestAttemptData } from './stats';

// Storage Keys
const KEYS = {
    PENDING_ATTEMPTS: 'offline_stats_pending_attempts',
    CACHED_STATS: 'offline_stats_cached_user_stats',
};

// Queue Item Structure
export interface PendingAttempt {
    id: string; // Client-generated UUID for idempotency
    data: TestAttemptData;
    timestamp: number;
}

// Simple UUID v4 generator (RFC4122)
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const OfflineStatsService = {

    // ============================================================================
    // Queue Management
    // ============================================================================

    // Save an attempt to the pending queue
    async savePendingAttempt(data: TestAttemptData): Promise<string> {
        try {
            const id = generateId();
            const pendingItem: PendingAttempt = {
                id,
                data,
                timestamp: Date.now(),
            };

            const existingJson = await AsyncStorage.getItem(KEYS.PENDING_ATTEMPTS);
            const queue: PendingAttempt[] = existingJson ? JSON.parse(existingJson) : [];

            queue.push(pendingItem);

            await AsyncStorage.setItem(KEYS.PENDING_ATTEMPTS, JSON.stringify(queue));
            return id;
        } catch (error) {
            console.error('[OfflineStats] Failed to save pending attempt:', error);
            return '';
        }
    },

    // Get all pending attempts
    async getPendingAttempts(): Promise<PendingAttempt[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.PENDING_ATTEMPTS);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            return [];
        }
    },

    // Remove a specific attempt from queue
    async removePendingAttempt(id: string): Promise<void> {
        try {
            const json = await AsyncStorage.getItem(KEYS.PENDING_ATTEMPTS);
            if (!json) return;

            const queue: PendingAttempt[] = JSON.parse(json);
            const newQueue = queue.filter(item => item.id !== id);

            await AsyncStorage.setItem(KEYS.PENDING_ATTEMPTS, JSON.stringify(newQueue));
        } catch (error) {
            console.error('[OfflineStats] Failed to remove pending attempt:', error);
        }
    },

    // Clear entire queue
    async clearQueue(): Promise<void> {
        try {
            await AsyncStorage.removeItem(KEYS.PENDING_ATTEMPTS);
        } catch (error) {
            console.error('[OfflineStats] Failed to clear queue:', error);
        }
    },

    // ============================================================================
    // Cache Management
    // ============================================================================

    // Save validated server stats to cache
    async saveCachedStats(stats: UserStatistics): Promise<void> {
        try {
            if (!stats) return;
            await AsyncStorage.setItem(KEYS.CACHED_STATS, JSON.stringify(stats));
        } catch (error) {
            console.error('[OfflineStats] Failed to cache stats:', error);
        }
    },

    // Get cached stats
    async getCachedStats(): Promise<UserStatistics | null> {
        try {
            const json = await AsyncStorage.getItem(KEYS.CACHED_STATS);
            return json ? JSON.parse(json) : null;
        } catch (error) {
            return null;
        }
    },

    // ============================================================================
    // Aggregation Logic (The "Optimistic" View)
    // ============================================================================

    // Calculate current stats by merging Cached + Pending
    async getAggregatedStats(): Promise<UserStatistics | null> {
        try {
            const cached = await this.getCachedStats();
            const pending = await this.getPendingAttempts();

            if (!cached && pending.length === 0) return null;

            // Start with cached stats or empty baseline
            const current: UserStatistics = cached ? { ...cached } : {
                total_questions_attempted: 0,
                total_correct_answers: 0,
                average_score: 0,
                total_time_spent_minutes: 0,
                saved_questions_count: 0,
                test_attempts_count: 0,
                modules_practiced: 0,
                last_practice_date: null
            };

            if (pending.length === 0) return current;

            // Aggregate pending attempts
            let pendingQuestions = 0;
            let pendingCorrect = 0;
            let pendingTime = 0;

            pending.forEach(item => {
                pendingQuestions += item.data.total_questions;
                pendingCorrect += item.data.correct_answers;
                pendingTime += (item.data.time_spent_seconds || 0);

                // Update last practice date if this attempt is newer
                const attemptDate = new Date(item.timestamp).toISOString();
                if (!current.last_practice_date || attemptDate > current.last_practice_date) {
                    current.last_practice_date = attemptDate;
                }
            });

            // Update Totals
            current.total_questions_attempted += pendingQuestions;
            current.total_correct_answers += pendingCorrect;
            current.total_time_spent_minutes += Math.round(pendingTime / 60);
            current.test_attempts_count += pending.length;

            // Recalculate Average Score
            if (current.total_questions_attempted > 0) {
                current.average_score = (current.total_correct_answers / current.total_questions_attempted) * 100;
            }

            return current;
        } catch (error) {
            return null;
        }
    },

    // ============================================================================
    // Synchronization Engine
    // ============================================================================

    isSyncing: false,

    // Sync Pending Items to Server
    async syncPendingQueue(userId: string): Promise<{ syncedCount: number; errors: number }> {
        // 1. Mutex Lock
        if (this.isSyncing) {
            console.log('[OfflineStats] Sync already in progress, skipping.');
            return { syncedCount: 0, errors: 0 };
        }

        this.isSyncing = true;

        try {
            const pending = await this.getPendingAttempts();
            if (pending.length === 0) return { syncedCount: 0, errors: 0 };

            let syncedCount = 0;
            let errors = 0;

            for (const item of pending) {
                try {
                    // Security Check
                    if (item.data.user_id !== userId) {
                        await this.removePendingAttempt(item.id);
                        continue;
                    }

                    // 2. Migration: Ensure ID is a valid UUID
                    let attemptId = item.id;
                    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId);

                    if (!isValidUUID) {
                        console.log('[OfflineStats] Migrating legacy ID to UUID for item', item.id);
                        attemptId = generateId();
                        // Note: We don't update the ID in the queue here, we just use the new valid ID for the server.
                        // If it fails, we resync later. Ideally we should update the queue but that's complex.
                        // If we succeed, we delete from queue anyway.
                    }

                    const { error } = await supabase
                        .from('test_attempts')
                        .insert({
                            ...item.data,
                            id: attemptId,
                            completed_at: new Date(item.timestamp).toISOString()
                        });

                    if (!error) {
                        await this.removePendingAttempt(item.id);
                        syncedCount++;
                    } else {
                        // 3. Idempotency Check
                        if (error.code === '23505') {
                            // Unique Violation = Already Synced
                            await this.removePendingAttempt(item.id);
                            syncedCount++;
                        } else {
                            console.warn('[OfflineStats] Sync save error:', error);
                            errors++;
                        }
                    }
                } catch (err) {
                    console.warn('[OfflineStats] Sync network error:', err);
                    errors++;
                    break;
                }
            }

            return { syncedCount, errors };

        } finally {
            this.isSyncing = false;
        }
    }
};
