// API functions for modules
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Module = Database['public']['Tables']['modules']['Row'];

// Get all modules
export async function getModules(filters?: { year?: string; type?: string }) {
  try {
    let query = supabase
      .from('modules')
      .select('*')
      .order('year', { ascending: true })
      .order('name', { ascending: true });

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data as Module[],
    };
  } catch (error: any) {
    console.error('Error fetching modules:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch modules',
      data: [],
    };
  }
}

// Get a single module by name
export async function getModuleByName(name: string) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as Module,
    };
  } catch (error: any) {
    console.error('Error fetching module:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch module',
    };
  }
}

// Get module statistics
export async function getModuleStats() {
  try {
    const { count, error } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return {
      success: true,
      data: {
        total: count || 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching module stats:', error);
    return {
      success: false,
      data: { total: 0 },
    };
  }
}
