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

if (!isConfigured) {
  console.warn('⚠️ Supabase credentials not configured. Please add them to .env.local');
  console.warn('📝 Copy .env.local.example to .env.local and add your credentials');
}

// Create Supabase client for browser
// Using 'any' for Database type to avoid strict type checking issues during build
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
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
