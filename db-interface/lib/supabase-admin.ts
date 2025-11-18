// Server-side Supabase client with service role key
// ⚠️ ONLY use this in API routes (server-side) - NEVER expose to client!

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local'
  );
}

// Create admin client with service role key (bypasses RLS)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper to verify user is admin/manager/owner
export async function verifyAdminUser(userId: string) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { isAdmin: false, role: null };
  }

  const isAdmin = ['owner', 'admin', 'manager'].includes(user.role);
  return { isAdmin, role: user.role };
}
