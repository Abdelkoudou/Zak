/**
 * Zod validation schemas for API request validation
 * Provides type-safe input validation to prevent malformed data
 */
import { z } from 'zod';

// ============ Constants ============
const MAX_TEXT_LENGTH = 10000;
const MAX_SEARCH_LENGTH = 100;
const MAX_URL_LENGTH = 1000;

// ============ Common Schemas ============
export const uuidSchema = z.string().uuid('Invalid ID format');

export const searchSchema = z
  .string()
  .max(MAX_SEARCH_LENGTH, 'Search query too long')
  .transform((s) => s.replace(/[%_]/g, '')); // Escape LIKE wildcards for DoS prevention

// ============ Question Schemas ============
export const answerSchema = z.object({
  option_label: z.enum(['A', 'B', 'C', 'D', 'E']),
  answer_text: z.string().min(1, 'Answer text required').max(MAX_TEXT_LENGTH),
  is_correct: z.boolean(),
  display_order: z.number().int().min(1).max(5),
});

export const questionSchema = z.object({
  year: z.enum(['1', '2', '3']),
  module_name: z.string().min(1, 'Module name required').max(200),
  sub_discipline: z.string().max(200).nullish(),
  exam_type: z.enum(['EMD', 'EMD1', 'EMD2', 'Rattrapage']),
  exam_year: z.number().int().min(2000).max(2100, 'Année de l\'examen (promo) est obligatoire'),
  number: z.number().int().min(1).max(500),
  question_text: z.string().min(1, 'Question text required').max(MAX_TEXT_LENGTH),
  speciality: z.string().max(100).nullish(),
  cours: z.array(z.string().max(200)).max(10).nullish(),
  unity_name: z.string().max(200).nullish(),
  module_type: z.enum(['annual', 'semestrial', 'uei', 'standalone']).nullish(),
  faculty_source: z
    .enum([
      'fac_mere',
      'annexe_biskra',
      'annexe_oum_el_bouaghi',
      'annexe_khenchela',
      'annexe_souk_ahras',
    ])
    .nullish(),
  image_url: z.string().url().max(MAX_URL_LENGTH).nullish(),
  explanation: z.string().max(MAX_TEXT_LENGTH).nullish(),
});

export const createQuestionSchema = z.object({
  question: questionSchema,
  answers: z
    .array(answerSchema)
    .min(2, 'At least 2 answers required')
    .max(5, 'Maximum 5 answers allowed'),
});

export const updateQuestionSchema = z.object({
  id: uuidSchema,
  question: questionSchema,
  answers: z
    .array(answerSchema)
    .min(2, 'At least 2 answers required')
    .max(5, 'Maximum 5 answers allowed'),
});

// ============ Resource Schemas ============
export const resourceSchema = z.object({
  year: z.enum(['1', '2', '3']),
  module_name: z.string().max(200).nullish(),
  sub_discipline: z.string().max(200).nullish(),
  title: z.string().min(1, 'Title required').max(300),
  type: z.enum(['google_drive', 'telegram', 'youtube', 'pdf', 'other']),
  url: z.string().url('Invalid URL').max(MAX_URL_LENGTH),
  description: z.string().max(MAX_TEXT_LENGTH).nullish(),
  speciality: z.string().max(100).nullish(),
  cours: z.array(z.string().max(200)).max(10).nullish(),
  unity_name: z.string().max(200).nullish(),
  module_type: z.string().max(50).nullish(),
});

export const createResourceSchema = z.object({
  resource: resourceSchema,
});

// ============ Payment Schema ============
export const paymentSchema = z.object({
  userId: uuidSchema,
  amount: z.number().positive('Amount must be positive').max(1000000),
});

// ============ Type Exports ============
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
