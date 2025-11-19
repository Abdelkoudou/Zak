// API functions for resources
import { supabase } from '@/lib/supabase';

export interface CreateResourceData {
  year: string;
  module_name: string;
  sub_discipline?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
  speciality?: string;
  cours?: string[];
  unity_name?: string;
  module_type?: string;
}

// Create a new resource
export async function createResource(data: CreateResourceData) {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call API route (server-side with service role key)
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        resource: {
          year: data.year,
          module_name: data.module_name,
          sub_discipline: data.sub_discipline || null,
          title: data.title,
          type: data.type,
          url: data.url,
          description: data.description || null,
          speciality: data.speciality || null,
          cours: data.cours || null,
          unity_name: data.unity_name || null,
          module_type: data.module_type,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create resource');
    }

    return result;
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return {
      success: false,
      error: error.message || 'Failed to create resource',
    };
  }
}

// Get all resources with filters
export async function getResources(filters?: {
  year?: string;
  module_name?: string;
  sub_discipline?: string;
  type?: string;
}) {
  try {
    let query = supabase
      .from('course_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.module_name) {
      query = query.eq('module_name', filters.module_name);
    }
    if (filters?.sub_discipline) {
      query = query.eq('sub_discipline', filters.sub_discipline);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resources',
      data: [],
    };
  }
}

// Get a single resource by ID
export async function getResourceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('course_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch resource',
    };
  }
}

// Delete a resource
export async function deleteResource(id: string) {
  try {
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call API route
    const response = await fetch(`/api/resources?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete resource');
    }

    return result;
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete resource',
    };
  }
}

// Get resource statistics
export async function getResourceStats() {
  try {
    const { count, error } = await supabase
      .from('course_resources')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return {
      success: true,
      data: {
        total: count || 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return {
      success: false,
      data: { total: 0 },
    };
  }
}
