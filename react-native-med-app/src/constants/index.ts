// ============================================================================
// MCQ Study App - Constants
// ============================================================================

import { YearLevel, ModuleType, ExamType, Speciality, ResourceType } from '@/types'

// Export theme
export * from './theme'

// Export theme context
export { useTheme, ThemeProvider } from '@/context/ThemeContext'
export type { ThemeColors, ThemeMode } from '@/context/ThemeContext'

// ============================================================================
// Years
// ============================================================================

export const YEARS: { value: YearLevel; label: string }[] = [
  { value: '1', label: '1ère Année' },
  { value: '2', label: '2ème Année' },
  { value: '3', label: '3ème Année' },
]

// ============================================================================
// Specialities
// ============================================================================

export const SPECIALITIES: { value: Speciality; label: string }[] = [
  { value: 'Médecine', label: 'Médecine' },
  { value: 'Pharmacie', label: 'Pharmacie' },
  { value: 'Dentaire', label: 'Dentaire' },
]

// ============================================================================
// Module Types
// ============================================================================

export const MODULE_TYPES: { value: ModuleType; label: string; icon: string }[] = [
  { value: 'annual', label: 'Module Annuel', icon: '📅' },
  { value: 'semestrial', label: 'Module Semestriel', icon: '📆' },
  { value: 'uei', label: 'U.E.I', icon: '🔬' },
  { value: 'standalone', label: 'Module Autonome', icon: '📚' },
]

// ============================================================================
// Exam Types
// ============================================================================

export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'EMD', label: 'EMD' },
  { value: 'EMD1', label: 'EMD1' },
  { value: 'EMD2', label: 'EMD2' },
  { value: 'Rattrapage', label: 'Rattrapage' },
 
]

export const EXAM_TYPES_BY_MODULE_TYPE: Record<ModuleType, ExamType[]> = {
  annual: ['EMD1', 'EMD2', 'Rattrapage'],
  semestrial: ['EMD', 'Rattrapage'],
  uei: [ 'EMD', 'Rattrapage'],
  standalone: ['EMD', 'Rattrapage'],
}

// ============================================================================
// Resource Types
// ============================================================================

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'google_drive', label: 'Google Drive', icon: '📁' },
  { value: 'telegram', label: 'Telegram', icon: '📱' },
  { value: 'youtube', label: 'YouTube', icon: '🎬' },
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'other', label: 'Autre', icon: '🔗' },
]

// ============================================================================
// Answer Options
// ============================================================================

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const

// ============================================================================
// Brand Colors - Light Sea Green Palette
// ============================================================================

export const BRAND_COLORS = {
  // Primary Light Sea Green palette
  primary: {
    50: '#f0fdfa',    // Very light tint
    100: '#ccfbf1',   // Light tint
    200: '#99f6e4',   // Lighter
    300: '#5eead4',   // Light
    400: '#2dd4bf',   // Medium light
    500: '#14b8a6',   // Base (#0fb2ac from palette)
    600: '#0d9488',   // Medium dark (#0fa3db from palette)
    700: '#0f766e',   // Dark (#07b17d from palette)
    800: '#115e59',   // Darker (#04514e from palette)
    900: '#134e4a',   // Darkest (#02201f from palette)
  },
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
}

// Legacy COLORS export for backward compatibility
export const COLORS = BRAND_COLORS

// ============================================================================
// Module Type Colors - Updated with brand colors
// ============================================================================

export const MODULE_TYPE_COLORS: Record<ModuleType, { bg: string; text: string }> = {
  annual: { bg: 'bg-primary-100', text: 'text-primary-700' },
  semestrial: { bg: 'bg-primary-200', text: 'text-primary-800' },
  uei: { bg: 'bg-primary-300', text: 'text-primary-900' },
  standalone: { bg: 'bg-primary-400', text: 'text-white' },
}
