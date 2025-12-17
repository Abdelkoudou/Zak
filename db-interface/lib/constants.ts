// Constants for the medical curriculum structure

import { YearLevel, ModuleType, ExamType } from '@/types/database';

export const YEARS: { value: YearLevel; label: string }[] = [
  { value: '1', label: '1ère Année' },
  { value: '2', label: '2ème Année' },
  { value: '3', label: '3ème Année' },
];

export const MODULE_TYPES: { value: ModuleType; label: string }[] = [
  { value: 'annual', label: 'Module Annuel' },
  { value: 'semestrial', label: 'Module Semestriel' },
  { value: 'uei', label: 'U.E.I (Unité d\'Enseignement Intégré)' },
  { value: 'standalone', label: 'Module Autonome' },
];

export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'EMD', label: 'EMD' },
  { value: 'EMD1', label: 'EMD1' },
  { value: 'EMD2', label: 'EMD2' },
  { value: 'Rattrapage', label: 'Rattrapage' },
 
];

// Exam types available for each module type
export const EXAM_TYPES_BY_MODULE_TYPE: Record<ModuleType, ExamType[]> = {
  annual: ['EMD1', 'EMD2', 'Rattrapage'],
  semestrial: ['EMD', 'Rattrapage'],
  uei: [ 'EMD', 'Rattrapage'],
  standalone: ['EMD', 'Rattrapage'],
};

export const RESOURCE_TYPES = [
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'pdf', label: 'PDF' },
  { value: 'other', label: 'Autre' },
] as const;

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

// Predefined modules for 1st year
export const YEAR_1_ANNUAL_MODULES = [
  'Anatomie',
  'Biochimie',
  'Biophysique',
  'Biostatistique / Informatique',
  'Chimie',
  'Cytologie',
];

export const YEAR_1_SEMESTRIAL_MODULES = [
  'Embryologie',
  'Histologie',
  'Physiologie',
  'S.S.H',
];

// Predefined U.E.I for 2nd year
export const YEAR_2_UEI = [
  {
    name: 'Appareil Cardio-vasculaire et Respiratoire',
    subDisciplines: ['Anatomie', 'Histologie', 'Physiologie', 'Biophysique'],
  },
  {
    name: 'Appareil Digestif',
    subDisciplines: ['Anatomie', 'Histologie', 'Physiologie', 'Biochimie'],
  },
  {
    name: 'Appareil Urinaire',
    subDisciplines: ['Anatomie', 'Histologie', 'Physiologie', 'Biochimie'],
  },
  {
    name: 'Appareil Endocrinien et de la Reproduction',
    subDisciplines: ['Anatomie', 'Histologie', 'Physiologie', 'Biochimie'],
  },
  {
    name: 'Appareil Nerveux et Organes des Sens',
    subDisciplines: ['Anatomie', 'Histologie', 'Physiologie', 'Biophysique'],
  },
];

export const YEAR_2_STANDALONE_MODULES = ['Génétique', 'Immunologie'];
