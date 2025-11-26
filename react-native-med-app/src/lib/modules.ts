// ============================================================================
// Modules Service
// ============================================================================

import { supabase } from './supabase'
import { Module, YearLevel } from '@/types'

// ============================================================================
// Get All Modules
// ============================================================================

export async function getAllModules(): Promise<{ modules: Module[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('year')
      .order('name')

    if (error) {
      return { modules: [], error: error.message }
    }

    return { modules: data as Module[], error: null }
  } catch (error) {
    return { modules: [], error: 'Failed to fetch modules' }
  }
}

// ============================================================================
// Get Modules by Year
// ============================================================================

export async function getModulesByYear(year: YearLevel): Promise<{ modules: Module[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('year', year)
      .order('type')
      .order('name')

    if (error) {
      return { modules: [], error: error.message }
    }

    return { modules: data as Module[], error: null }
  } catch (error) {
    return { modules: [], error: 'Failed to fetch modules' }
  }
}

// ============================================================================
// Get Module by ID
// ============================================================================

export async function getModuleById(id: string): Promise<{ module: Module | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return { module: null, error: error.message }
    }

    return { module: data as Module, error: null }
  } catch (error) {
    return { module: null, error: 'Failed to fetch module' }
  }
}

// ============================================================================
// Get Module by Name
// ============================================================================

export async function getModuleByName(name: string): Promise<{ module: Module | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      return { module: null, error: error.message }
    }

    return { module: data as Module, error: null }
  } catch (error) {
    return { module: null, error: 'Failed to fetch module' }
  }
}

// ============================================================================
// Get Question Count for Module
// ============================================================================

export async function getModuleQuestionCount(moduleName: string): Promise<{ count: number; error: string | null }> {
  try {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('module_name', moduleName)

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    return { count: 0, error: 'Failed to fetch question count' }
  }
}

// ============================================================================
// Get Modules with Question Counts
// ============================================================================

export async function getModulesWithCounts(year: YearLevel): Promise<{ 
  modules: (Module & { question_count: number })[]; 
  error: string | null 
}> {
  try {
    // Get modules for the year
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('year', year)
      .order('type')
      .order('name')

    if (modulesError) {
      return { modules: [], error: modulesError.message }
    }

    // Get question counts for each module
    const modulesWithCounts = await Promise.all(
      (modules || []).map(async (module) => {
        const { count } = await getModuleQuestionCount(module.name)
        return { ...module, question_count: count }
      })
    )

    return { modules: modulesWithCounts as (Module & { question_count: number })[], error: null }
  } catch (error) {
    return { modules: [], error: 'Failed to fetch modules with counts' }
  }
}

// ============================================================================
// Get Available Cours for Module
// ============================================================================

export async function getModuleCours(moduleName: string): Promise<{ cours: string[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('cours')
      .eq('module_name', moduleName)
      .not('cours', 'is', null)

    if (error) {
      return { cours: [], error: error.message }
    }

    // Flatten and deduplicate cours
    const allCours = (data || [])
      .flatMap(q => q.cours || [])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort()

    return { cours: allCours, error: null }
  } catch (error) {
    return { cours: [], error: 'Failed to fetch cours' }
  }
}
