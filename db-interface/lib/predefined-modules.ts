// Predefined modules - These are fixed and cannot be modified by admins
// Based on the French medical curriculum used in Algeria

import { Module, SubDiscipline } from '@/types/database';

export const PREDEFINED_MODULES: Omit<Module, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 1ère Année - Modules Annuels
  {
    name: 'Anatomie',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Biochimie',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Biophysique',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Biostatistique / Informatique',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Chimie',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Cytologie',
    year: '1',
    type: 'annual',
    examTypes: ['EMD1', 'EMD2', 'Rattrapage'],
    hasSubDisciplines: false,
  },

  // 1ère Année - Modules Semestriels
  {
    name: 'Embryologie',
    year: '1',
    type: 'semestrial',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Histologie',
    year: '1',
    type: 'semestrial',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Physiologie',
    year: '1',
    type: 'semestrial',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'S.S.H',
    year: '1',
    type: 'semestrial',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },

  // 2ème Année - U.E.I
  {
    name: 'Appareil Cardio-vasculaire et Respiratoire',
    year: '2',
    type: 'uei',
    examTypes: ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
    hasSubDisciplines: true,
  },
  {
    name: 'Appareil Digestif',
    year: '2',
    type: 'uei',
    examTypes: ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
    hasSubDisciplines: true,
  },
  {
    name: 'Appareil Urinaire',
    year: '2',
    type: 'uei',
    examTypes: ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
    hasSubDisciplines: true,
  },
  {
    name: 'Appareil Endocrinien et de la Reproduction',
    year: '2',
    type: 'uei',
    examTypes: ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
    hasSubDisciplines: true,
  },
  {
    name: 'Appareil Nerveux et Organes des Sens',
    year: '2',
    type: 'uei',
    examTypes: ['M1', 'M2', 'M3', 'M4', 'EMD', 'Rattrapage'],
    hasSubDisciplines: true,
  },

  // 2ème Année - Modules Autonomes
  {
    name: 'Génétique',
    year: '2',
    type: 'standalone',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },
  {
    name: 'Immunologie',
    year: '2',
    type: 'standalone',
    examTypes: ['EMD', 'Rattrapage'],
    hasSubDisciplines: false,
  },
];

// Predefined sub-disciplines for U.E.I
export const PREDEFINED_SUBDISCIPLINES: Record<string, string[]> = {
  'Appareil Cardio-vasculaire et Respiratoire': [
    'Anatomie',
    'Histologie',
    'Physiologie',
    'Biophysique',
  ],
  'Appareil Digestif': [
    'Anatomie',
    'Histologie',
    'Physiologie',
    'Biochimie',
  ],
  'Appareil Urinaire': [
    'Anatomie',
    'Histologie',
    'Physiologie',
    'Biochimie',
  ],
  'Appareil Endocrinien et de la Reproduction': [
    'Anatomie',
    'Histologie',
    'Physiologie',
    'Biochimie',
  ],
  'Appareil Nerveux et Organes des Sens': [
    'Anatomie',
    'Histologie',
    'Physiologie',
    'Biophysique',
  ],
};
