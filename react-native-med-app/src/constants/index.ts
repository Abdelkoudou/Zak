// ============================================================================
// MCQ Study App - Constants
// ============================================================================

import { YearLevel, ModuleType, ExamType, Speciality, ResourceType } from '@/types'

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
// Theme Colors
// ============================================================================

export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
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

// ============================================================================
// Module Type Colors
// ============================================================================

export const MODULE_TYPE_COLORS: Record<ModuleType, { bg: string; text: string }> = {
  annual: { bg: 'bg-blue-100', text: 'text-blue-700' },
  semestrial: { bg: 'bg-purple-100', text: 'text-purple-700' },
  uei: { bg: 'bg-green-100', text: 'text-green-700' },
  standalone: { bg: 'bg-orange-100', text: 'text-orange-700' },
}
