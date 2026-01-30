// ============================================================================
// Resources Service
// ============================================================================

import { supabase } from './supabase'
import { CourseResource, YearLevel, ResourceType } from '@/types'

// ============================================================================
// Get Resources
// ============================================================================

export interface ResourceFilters {
  year?: YearLevel
  module_name?: string
  sub_discipline?: string
  type?: ResourceType
}

export async function getResources(filters: ResourceFilters = {}): Promise<{ 
  resources: CourseResource[]; 
  error: string | null 
}> {
  try {
    let query = supabase
      .from('course_resources')
      .select('*')

    if (filters.year) {
      query = query.eq('year', filters.year)
    }
    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.sub_discipline) {
      query = query.eq('sub_discipline', filters.sub_discipline)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    query = query.order('module_name').order('title')

    const { data, error } = await query

    if (error) {
      return { resources: [], error: error.message }
    }

    return { resources: data as CourseResource[], error: null }
  } catch (error) {
    if (__DEV__) {
      console.error('[Resources] Failed to fetch resources:', error)
    }
    return { resources: [], error: 'Failed to fetch resources' }
  }
}

// ============================================================================
// Get Resources by Year
// ============================================================================

export async function getResourcesByYear(year: YearLevel): Promise<{ 
  resources: CourseResource[]; 
  error: string | null 
}> {
  return getResources({ year })
}

// ============================================================================
// Get Resources by Module
// ============================================================================

export async function getResourcesByModule(moduleName: string): Promise<{ 
  resources: CourseResource[]; 
  error: string | null 
}> {
  return getResources({ module_name: moduleName })
}

// ============================================================================
// Get Resource by ID
// ============================================================================

export async function getResourceById(id: string): Promise<{ 
  resource: CourseResource | null; 
  error: string | null 
}> {
  try {
    const { data, error } = await supabase
      .from('course_resources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { resource: null, error: error.message }
    }

    return { resource: data as CourseResource, error: null }
  } catch (error) {
    return { resource: null, error: 'Failed to fetch resource' }
  }
}

// ============================================================================
// Get Resource Types Available
// ============================================================================

export async function getAvailableResourceTypes(year?: YearLevel): Promise<{ 
  types: ResourceType[]; 
  error: string | null 
}> {
  try {
    let query = supabase
      .from('course_resources')
      .select('type')

    if (year) {
      query = query.eq('year', year)
    }

    const { data, error } = await query

    if (error) {
      return { types: [], error: error.message }
    }

    // Get unique types
    const types = [...new Set((data || []).map(r => r.type))] as ResourceType[]

    return { types, error: null }
  } catch (error) {
    return { types: [], error: 'Failed to fetch resource types' }
  }
}

// ============================================================================
// Get Resources Count
// ============================================================================

export async function getResourcesCount(filters: ResourceFilters = {}): Promise<{ 
  count: number; 
  error: string | null 
}> {
  try {
    let query = supabase
      .from('course_resources')
      .select('*', { count: 'exact', head: true })

    if (filters.year) {
      query = query.eq('year', filters.year)
    }
    if (filters.module_name) {
      query = query.eq('module_name', filters.module_name)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    const { count, error } = await query

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error: 'Failed to fetch resources count' }
  }
}
