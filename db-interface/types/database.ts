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


export type Speciality = 'Médecine' | 'Pharmacie' | 'Dentaire';

// Faculty source: where the question comes from
export type FacultySource =
  | 'fac_mere'
  | 'annexe_biskra'
  | 'annexe_oum_el_bouaghi'
  | 'annexe_khenchela'
  | 'annexe_souk_ahras';

export interface Course {
  id: string;
  name: string;
  year: string;
  speciality: string;
  module_name?: string;
  sub_discipline?: string;
  createdAt: Date;
}

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
  examYear?: number;  // Year when exam was taken (promo year)
  number: number;
  questionText: string;
  // New fields
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType: ModuleType;
  facultySource?: FacultySource;
  imageUrl?: string;  // URL to the image in storage
  createdBy?: string;
  explanation?: string;  // Optional explanation for the answer
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
  moduleId?: string;
  module_name?: string;
  subDisciplineId?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
  // New fields
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType?: ModuleType;
  createdBy?: string;
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
  examYear?: number;  // Optional in form, but required on submit
  number: number;
  questionText: string;
  // New fields
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType?: ModuleType;
  facultySource?: FacultySource;
  imageUrl?: string;
  explanation?: string;  // Optional explanation for the answer
  answers: {
    optionLabel: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}

export interface CourseResourceFormData {
  year: YearLevel;
  moduleId?: string;
  subDisciplineId?: string;
  title: string;
  type: 'google_drive' | 'telegram' | 'youtube' | 'pdf' | 'other';
  url: string;
  description?: string;
  // New fields
  speciality?: Speciality;
  cours?: string[];
  unityName?: string;
  moduleType?: ModuleType;
}

// ============================================================================
// Activation Keys System Types
// ============================================================================

export interface Faculty {
  id: string;
  code: string;
  name: string;
  city: string;
  specialities: Speciality[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesPoint {
  id: string;
  code: string;
  name: string;
  location?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  commissionRate: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User info for activation key (when used)
export interface ActivationKeyUser {
  id: string;
  email: string;
  fullName?: string;
  speciality?: Speciality;
  yearOfStudy?: YearLevel;
  region?: string;
  faculty?: string;
}

export interface DeviceSession {
  id: string;
  user_id: string;
  device_id: string;
  fingerprint: string | null;
  device_name: string;
  last_active_at: string;
  created_at?: string;
}

export interface ActivationKey {
  id: string;
  keyCode: string;
  durationDays: number;
  isUsed: boolean;
  usedBy?: string;
  usedByUser?: ActivationKeyUser;  // User details when code is used
  usedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  // Extended fields
  year?: YearLevel;
  facultyId?: string;
  faculty?: Faculty;
  salesPointId?: string;
  salesPoint?: SalesPoint;
  expiresAt?: Date;
  batchId?: string;
  notes?: string;
  pricePaid?: number;
  generationParams?: {
    algorithm: string;
    timestamp: number;
    checksum: string;
  };
}

export interface ActivationKeyFormData {
  year: YearLevel;
  facultyId: string;
  salesPointId: string;
  durationDays: number;
  expiresAt?: Date;
  notes?: string;
  pricePaid?: number;
  quantity: number;  // For batch generation
}

export interface SalesPointStats {
  id: string;
  code: string;
  name: string;
  location?: string;
  totalCodes: number;
  usedCodes: number;
  activeCodes: number;
  expiredCodes: number;
  totalRevenue: number;
  lastSaleAt?: Date;
}

export interface FacultyStats {
  id: string;
  code: string;
  name: string;
  city: string;
  totalCodes: number;
  usedCodes: number;
  year1Codes: number;
  year2Codes: number;
  year3Codes: number;
}

export interface ActivationCodesDashboard {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
  totalRevenue: number;
  salesPointStats: SalesPointStats[];
  facultyStats: FacultyStats[];
  recentCodes: ActivationKey[];
}


// ============================================================================
// Online Payments System Types (Chargily Pay Integration)
// ============================================================================

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
export type PaymentSource = 'manual' | 'online';

export interface OnlinePayment {
  id: string;
  checkoutId: string;
  invoiceId?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;  // In centimes
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  durationDays: number;
  activationKeyId?: string;
  activationKey?: {
    keyCode: string;
    isUsed: boolean;
  };
  userId?: string;
  checkoutUrl?: string;
  successUrl?: string;
  failureUrl?: string;
  metadata?: Record<string, unknown>;
  webhookPayload?: Record<string, unknown>;
  createdAt: Date;
  paidAt?: Date;
  updatedAt: Date;
}

export interface OnlinePaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  canceledPayments: number;
  totalRevenueCentimes: number;
  totalRevenue: number;
  uniqueCustomers: number;
  lastPaymentAt?: Date;
}

export interface CreateCheckoutRequest {
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  duration: '30' | '90' | '180' | '365';
  locale?: 'ar' | 'en' | 'fr';
}

export interface CreateCheckoutResponse {
  success: boolean;
  checkoutId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  duration: string;
}

export interface SubscriptionPlan {
  duration: string;
  durationDays: number;
  amount: number;
  amountFormatted: string;
  label: string;
}
