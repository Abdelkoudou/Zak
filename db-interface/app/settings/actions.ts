'use server'

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function updateSubscriptionPrice(formData: FormData) {
    const price = formData.get('price');

    if (!price || typeof price !== 'string') {
        return { error: 'Price is required' };
    }

    const priceInt = parseInt(price);
    if (isNaN(priceInt) || priceInt < 0) {
        return { error: 'Invalid price value' };
    }

    try {
        // Upsert the configuration in app_config
        const { error } = await supabaseAdmin
            .from('app_config')
            .upsert({
                key: 'chargily_price_365',
                value: priceInt.toString(),
                description: 'Price for 1 year subscription in DZD',
                updated_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            console.error('Error updating price:', error);
            return { error: 'Failed to update price' };
        }

        revalidatePath('/settings');
        revalidatePath('/api/payments/create-checkout'); // Optional, mainly for cache busting if cached

        return { success: true, message: 'Price updated successfully' };
    } catch (err) {
        console.error('Unexpected error:', err);
        return { error: 'An unexpected error occurred' };
    }
}
