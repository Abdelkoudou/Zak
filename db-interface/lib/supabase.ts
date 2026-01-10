// Supabase client configuration for browser (client-side)
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Get environment variables - NEVER use fallback values for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are configured
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Throw error in production if not configured
if (!isConfigured) {
  const errorMsg = 'Missing Supabase credentials. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  }
  if (typeof window !== 'undefined') {
    console.error('⚠️ ' + errorMsg);
  }
}

// Create Supabase client for browser with session management
// Use empty strings as fallback only for build time - will fail at runtime if not configured
export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
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
