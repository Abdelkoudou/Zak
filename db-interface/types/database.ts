// Database type definitions for the MCQ Study App

export type YearLevel = '1' | '2' | '3';

export type ModuleType = 
  | 'annual'        // Modules Annuels (1st year)
  | 'semestrial'    // Modules Semestriels (1st year)
  | 'uei'           // U.E.I (2nd/3rd year)
  | 'standalone';   // Standalone modules (Génétique, Immunologie, etc.)

export type ExamType = 
  | 'EMD'           // For semestrial modules and standalone
  | 'EMD1'          // For annual modules
  | 'EMD2'          // For annual modules
  | 'Rattrapage'    // For all
  | 'M1'            // For U.E.I sub-disciplines
  | 'M2'            // For U.E.I sub-disciplines
  | 'M3'            // For U.E.I sub-disciplines
  | 'M4';           // For U.E.I sub-disciplines

export interface Module {
  id: string;
  name: string;
  year: YearLevel;
  type: ModuleType;
  examTypes: ExamType[];
  hasSubDisciplines: boolean;
  subDisciplines?: SubDiscipline[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubDiscipline {
  id: string;
  moduleId: string;
  name: string;
  examTypes: ExamType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  moduleId: string;
  subDisciplineId?: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  chapterId?: string;
  examType: ExamType;
  number: number;
  questionText: string;
  explanation?: string;
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  optionLabel: string;  // A, B, C, D, E
  answerText: string;
  isCorrect: boolean;
  order: number;
}

export interface CourseResource {
  id: string;
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form data types for creating/editing
export interface ModuleFormData {
  name: string;
  year: YearLevel;
  type: ModuleType;
  examTypes: ExamType[];
  hasSubDisciplines: boolean;
  subDisciplines?: { name: string; examTypes: ExamType[] }[];
}

export interface QuestionFormData {
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  chapterId?: string;
  examType: ExamType;
  number: number;
  questionText: string;
  explanation?: string;
  answers: {
    optionLabel: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}

export interface CourseResourceFormData {
  year: YearLevel;
  moduleId: string;
  subDisciplineId?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
}
