// ============================================================================
// Modules Service
// ============================================================================

import { supabase } from './supabase'
import { Module, YearLevel, ExamType } from '@/types'
import { OfflineContentService } from './offline-content'

// ============================================================================
// Get All Modules
// ============================================================================

export async function getAllModules(): Promise<{ modules: Module[]; error: string | null }> {
  try {
    // Try offline content first
    const offlineModules = await OfflineContentService.getAllModules()
    if (offlineModules && offlineModules.length > 0) {
      return { modules: offlineModules as Module[], error: null }
    }

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
    // Try offline content first
    const offlineModules = await OfflineContentService.getModulesByYear(year)
    if (offlineModules && offlineModules.length > 0) {
      return { modules: offlineModules as Module[], error: null }
    }

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
    // Try offline content first
    const offlineModule = await OfflineContentService.getModuleById(id)
    if (offlineModule) {
      return { module: offlineModule as Module, error: null }
    }

    // Fallback to online
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
    // Try offline content first
    const offlineModuleData = await OfflineContentService.getModuleContent(moduleName)
    if (offlineModuleData && offlineModuleData.questions && offlineModuleData.questions.length > 0) {
      // Only use offline data if it has actual questions
      return { count: offlineModuleData.questions.length, error: null }
    }

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
// Get Modules with Question Counts - OPTIMIZED (Single Query)
// ============================================================================
// Previously: N+1 queries (1 for modules + N for each module's count)
// Now: Single database call using RPC function
// 
// IMPORTANT: Offline-first with validation
// - Checks offline content first for better performance
// - Only uses offline data if it has valid question counts (> 0)
// - Falls back to Supabase RPC if offline data is incomplete
// - This prevents showing "0 Questions" on native when offline files don't exist
// ============================================================================

export async function getModulesWithCounts(year: YearLevel): Promise<{
  modules: (Module & { question_count: number })[];
  error: string | null
}> {
  try {
    // Try offline content first
    const offlineModules = await OfflineContentService.getModulesByYear(year)
    if (offlineModules && offlineModules.length > 0) {
      // Check if offline data has valid question counts
      // Only use offline data if at least one module has questions
      const hasValidCounts = offlineModules.some((m: any) => (m.question_count || 0) > 0)

      if (hasValidCounts) {
        // Offline data is valid, use it
        const modulesWithCounts = offlineModules.map((module: any) => ({
          ...module,
          question_count: module.question_count || 0
        }))
        return { modules: modulesWithCounts as (Module & { question_count: number })[], error: null }
      }

      // Offline data exists but has no question counts - fall through to fetch from Supabase
      if (__DEV__) {
        console.log('[Modules] Offline data incomplete, fetching from Supabase')
      }
    }

    // Use optimized RPC function - single query instead of N+1
    const { data, error } = await supabase.rpc('get_modules_with_question_counts', {
      p_year: year
    })

    if (error) {
      // Fallback to old method if RPC not available (migration not run yet)
      console.warn('[Modules] RPC not available, falling back to legacy method:', error.message)
      return getModulesWithCountsLegacy(year)
    }

    // Map the RPC response to the expected format
    const modules = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      year: row.year,
      type: row.type,
      exam_types: row.exam_types,
      has_sub_disciplines: row.has_sub_disciplines,
      sub_disciplines: row.sub_disciplines,
      created_at: row.created_at,
      updated_at: row.updated_at,
      question_count: Number(row.question_count) || 0
    }))

    return { modules: modules as (Module & { question_count: number })[], error: null }
  } catch (error) {
    console.error('[Modules] Error in getModulesWithCounts:', error)
    return { modules: [], error: 'Failed to fetch modules with counts' }
  }
}

// Legacy fallback method (N+1 queries) - used if migration hasn't been run
async function getModulesWithCountsLegacy(year: YearLevel): Promise<{
  modules: (Module & { question_count: number })[];
  error: string | null
}> {
  try {
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('year', year)
      .order('type')
      .order('name')

    if (modulesError) {
      return { modules: [], error: modulesError.message }
    }

    // N+1 queries - only used as fallback
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
// Get Exam Types with Counts - OPTIMIZED (Single Query)
// ============================================================================

export async function getExamTypesWithCounts(
  moduleName: string,
  year?: YearLevel
): Promise<{ examTypes: { type: ExamType; count: number }[]; error: string | null }> {
  try {
    // Try offline content first
    const yearNum = year ? parseInt(year) : undefined;
    const offlineModuleData = await OfflineContentService.getModuleContent(moduleName, yearNum);
    if (offlineModuleData && offlineModuleData.questions && offlineModuleData.questions.length > 0) {
      // Compute exam types with counts from offline data
      const examTypeCounts: Record<string, number> = {};
      offlineModuleData.questions.forEach((q: any) => {
        if (q.exam_type) {
          examTypeCounts[q.exam_type] = (examTypeCounts[q.exam_type] || 0) + 1;
        }
      });

      const examTypes = Object.entries(examTypeCounts).map(([type, count]) => ({
        type: type as ExamType,
        count
      }));

      return { examTypes, error: null };
    }

    // Fallback to Supabase RPC
    const { data, error } = await supabase.rpc('get_exam_types_with_counts', {
      p_module_name: moduleName,
      p_year: year || null
    })

    if (error) {
      console.warn('[Modules] get_exam_types_with_counts RPC failed:', error.message)
      return { examTypes: [], error: error.message }
    }

    const examTypes = (data || []).map((row: any) => ({
      type: row.exam_type as ExamType,
      count: Number(row.question_count) || 0
    }))

    return { examTypes, error: null }
  } catch (error) {
    return { examTypes: [], error: 'Failed to fetch exam types with counts' }
  }
}

// ============================================================================
// Get Cours with Counts - OPTIMIZED (Single Query)
// ============================================================================

export async function getCoursWithCounts(
  moduleName: string
): Promise<{ cours: { name: string; count: number }[]; error: string | null }> {
  try {
    // Try offline content first
    const offlineModuleData = await OfflineContentService.getModuleContent(moduleName);
    if (offlineModuleData && offlineModuleData.questions && offlineModuleData.questions.length > 0) {
      // Compute cours with counts from offline data
      const coursCounts: Record<string, number> = {};
      offlineModuleData.questions.forEach((q: any) => {
        if (q.cours && Array.isArray(q.cours)) {
          q.cours.forEach((c: string) => {
            coursCounts[c] = (coursCounts[c] || 0) + 1;
          });
        }
      });

      const cours = Object.entries(coursCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { cours, error: null };
    }

    // Fallback to Supabase RPC
    const { data, error } = await supabase.rpc('get_cours_with_counts', {
      p_module_name: moduleName
    })

    if (error) {
      console.warn('[Modules] get_cours_with_counts RPC failed:', error.message)
      return { cours: [], error: error.message }
    }

    const cours = (data || []).map((row: any) => ({
      name: row.cours_name,
      count: Number(row.question_count) || 0
    }))

    return { cours, error: null }
  } catch (error) {
    return { cours: [], error: 'Failed to fetch cours with counts' }
  }
}

// ============================================================================
// Get Module Details - OPTIMIZED (Single Query for entire detail page)
// ============================================================================

export async function getModuleDetailsOptimized(moduleId: string): Promise<{
  module: Module | null;
  questionCount: number;
  examTypesWithCounts: { type: ExamType; count: number }[];
  coursWithCounts: { name: string; count: number }[];
  subDisciplines: string[];
  error: string | null
}> {
  try {
    const { data, error } = await supabase.rpc('get_module_details', {
      p_module_id: moduleId
    })

    if (error) {
      console.warn('[Modules] get_module_details RPC failed:', error.message)
      return {
        module: null,
        questionCount: 0,
        examTypesWithCounts: [],
        coursWithCounts: [],
        subDisciplines: [],
        error: error.message
      }
    }

    if (!data || data.length === 0) {
      return {
        module: null,
        questionCount: 0,
        examTypesWithCounts: [],
        coursWithCounts: [],
        subDisciplines: [],
        error: 'Module not found'
      }
    }

    const row = data[0]

    return {
      module: row.module_data as Module,
      questionCount: Number(row.question_count) || 0,
      examTypesWithCounts: (row.exam_types_with_counts || []).map((et: any) => ({
        type: et.type as ExamType,
        count: Number(et.count) || 0
      })),
      coursWithCounts: (row.cours_with_counts || []).map((c: any) => ({
        name: c.name,
        count: Number(c.count) || 0
      })),
      subDisciplines: row.sub_disciplines || [],
      error: null
    }
  } catch (error) {
    return {
      module: null,
      questionCount: 0,
      examTypesWithCounts: [],
      coursWithCounts: [],
      subDisciplines: [],
      error: 'Failed to fetch module details'
    }
  }
}

// ============================================================================
// Get Available Cours for Module
// ============================================================================

export async function getModuleCours(moduleName: string): Promise<{ cours: string[]; error: string | null }> {
  try {
    // Try offline content first
    const offlineModuleData = await OfflineContentService.getModuleContent(moduleName)
    if (offlineModuleData && offlineModuleData.questions) {
      // Extract unique cours from offline questions
      // Need to handle potential nested or missing cours field if type is loose
      const allCours = offlineModuleData.questions
        .flatMap((q: any) => q.cours || [])
        .filter((value: any, index: number, self: any[]) => self.indexOf(value) === index)
        .sort() as string[];

      return { cours: allCours, error: null }
    }

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

// ============================================================================
// Get Module Courses Structure (with Sub-disciplines)
// ============================================================================

export async function getModuleCoursesStructure(moduleName: string): Promise<{
  structure: { name: string; sub_discipline: string | null }[];
  error: string | null
}> {
  try {
    // Try offline content first
    const offlineModuleData = await OfflineContentService.getModuleContent(moduleName)
    if (offlineModuleData && offlineModuleData.questions) {
      // Create structure from offline data which has both cours and sub_discipline (if available)
      // This is a bit tricky as questions might not have sub_discipline consistent with courses but we'll try
      const uniqueCourses = new Set<string>();
      const structure: { name: string; sub_discipline: string | null }[] = [];

      offlineModuleData.questions.forEach((q: any) => {
        if (q.cours && Array.isArray(q.cours)) {
          q.cours.forEach((c: string) => {
            if (!uniqueCourses.has(c)) {
              uniqueCourses.add(c);
              structure.push({
                name: c,
                sub_discipline: q.sub_discipline || null
              });
            }
          });
        }
      });

      return { structure: structure.sort((a, b) => a.name.localeCompare(b.name)), error: null }
    }

    const { data, error } = await supabase
      .from('courses')
      .select('name, sub_discipline')
      .eq('module_name', moduleName)
      .order('name')

    if (error) {
      return { structure: [], error: error.message }
    }

    return { structure: data || [], error: null }
  } catch (error) {
    return { structure: [], error: 'Failed to fetch module courses structure' }
  }
}
