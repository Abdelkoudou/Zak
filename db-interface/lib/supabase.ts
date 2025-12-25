// Supabase client configuration for browser (client-side)
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if credentials are configured
const isConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

if (!isConfigured && typeof window !== 'undefined') {
  // Only warn in browser environment during development
}

// Create Supabase client for browser with session management
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Auto-refresh tokens before expiry
      autoRefreshToken: true,
      // Persist session in local storage
      persistSession: true,
      // Detect session in URL (for email confirmations, etc.)
      detectSessionInUrl: true,
      // Flow type
      flowType: 'pkce',
    },
    // Don't override storage key - let Supabase use default
    // This ensures cookies match what middleware expects
  }
);

// Export configuration status
export const supabaseConfigured = isConfigured;

// Helper function to check connection
export async function checkSupabaseConnection() {
  if (!isConfigured) {
    return { 
      connected: false, 
      error: 'Supabase not configured. Please add credentials to .env.local' 
    };
  }
  
  try {
    const { error } = await supabase.from('modules').select('count');
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error };
  }
}
