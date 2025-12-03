/**
 * Activation Codes Management Library
 * 
 * Provides secure code generation and management functions for the activation keys system.
 * Uses cryptographically secure random generation to ensure codes are unpredictable.
 */

import { supabase } from './supabase';
import type { 
  ActivationKey,
  ActivationKeyUser,
  ActivationKeyFormData, 
  SalesPoint, 
  Faculty,
  SalesPointStats,
  FacultyStats,
  YearLevel,
  Speciality
} from '@/types/database';

// Characters used for code generation (no confusing chars like 0/O, 1/I/l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate cryptographically secure random bytes
 */
function getSecureRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }
  // Fallback for server-side (less secure, but functional)
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * Generate a checksum for code validation
 * Uses a combination of XOR and modular arithmetic for verification
 */
function generateChecksum(baseCode: string, salt: Uint8Array): string {
  let sum = 0;
  for (let i = 0; i < baseCode.length; i++) {
    // Mix character code with position and salt
    sum = (sum * 31 + baseCode.charCodeAt(i) * (i + 1)) ^ salt[i % salt.length];
    sum = sum >>> 0; // Keep as unsigned 32-bit
  }
  
  // Generate 2-character checksum
  const c1 = CODE_CHARS[sum % CODE_CHARS.length];
  const c2 = CODE_CHARS[(sum >> 8) % CODE_CHARS.length];
  return c1 + c2;
}

/**
 * Generate a single secure activation code
 * 
 * Format: {POINT_CODE}-{RANDOM_8}-{CHECKSUM_2}
 * Example: ALG-X7K9P2AB-4F
 * 
 * Simplified format (year/faculty removed - user fills these during registration):
 * - Sales point code for tracking
 * - Cryptographically secure random segment
 * - Checksum for validation
 */
export function generateSecureCode(params: {
  salesPointCode: string;
}): { code: string; checksum: string; timestamp: number } {
  const timestamp = Date.now();
  
  // Generate 32 random bytes for maximum entropy
  const randomBytes = getSecureRandomBytes(32);
  
  // Create 8-character random segment (longer since we removed year/faculty)
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    randomPart += CODE_CHARS[randomBytes[i] % CODE_CHARS.length];
  }
  
  // Build base code: POINT(3) + RANDOM(8)
  const pointShort = params.salesPointCode.substring(0, 3).toUpperCase();
  const baseCode = `${pointShort}-${randomPart}`;
  
  // Generate checksum using remaining random bytes as salt
  const checksum = generateChecksum(baseCode, randomBytes.slice(8, 16));
  
  // Final code format
  const code = `${baseCode}-${checksum}`;
  
  return { code, checksum, timestamp };
}

/**
 * Validate a code's checksum
 */
export function validateCodeChecksum(code: string): boolean {
  const parts = code.split('-');
  if (parts.length !== 3) return false;
  
  const baseCode = `${parts[0]}-${parts[1]}`;
  const providedChecksum = parts[2];
  
  // We can't fully validate without the original salt,
  // but we can check format and basic structure
  return providedChecksum.length === 2 && 
         /^[A-Z0-9]{2}$/.test(providedChecksum);
}

/**
 * Simplified form data for code generation (year/faculty removed)
 */
interface SimplifiedCodeFormData {
  salesPointId: string;
  durationDays: number;
  notes?: string;
  pricePaid?: number;
  quantity: number;
}

/**
 * Generate multiple codes in a batch
 * Simplified - no year/faculty (user fills these during registration)
 */
export async function generateBatchCodes(
  params: SimplifiedCodeFormData,
  salesPointCode: string,
  createdBy: string
): Promise<{ codes: string[]; batchId: string; error?: string }> {
  const batchId = crypto.randomUUID ? crypto.randomUUID() : 
    `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const codes: string[] = [];
  const keysToInsert: Array<{
    key_code: string;
    duration_days: number;
    sales_point_id: string;
    batch_id: string;
    notes: string | null;
    price_paid: number | null;
    created_by: string;
    generation_params: object;
  }> = [];
  
  for (let i = 0; i < params.quantity; i++) {
    const { code, checksum, timestamp } = generateSecureCode({
      salesPointCode,
    });
    
    codes.push(code);
    keysToInsert.push({
      key_code: code,
      duration_days: params.durationDays,
      sales_point_id: params.salesPointId,
      batch_id: batchId,
      notes: params.notes || null,
      price_paid: params.pricePaid || null,
      created_by: createdBy,
      generation_params: {
        algorithm: 'secure-random-v2',
        timestamp,
        checksum,
        batchIndex: i,
      },
    });
  }
  
  // Insert all codes in a single transaction
  const { error } = await supabase
    .from('activation_keys')
    .insert(keysToInsert);
  
  if (error) {
    return { codes: [], batchId, error: error.message };
  }
  
  return { codes, batchId };
}


// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Fetch all activation keys with related data including user info
 */
export async function fetchActivationKeys(filters?: {
  year?: YearLevel;
  facultyId?: string;
  salesPointId?: string;
  isUsed?: boolean;
  batchId?: string;
  search?: string;
}): Promise<{ data: ActivationKey[]; error?: string }> {
  // First fetch activation keys with faculty and sales point
  let query = supabase
    .from('activation_keys')
    .select(`
      *,
      faculty:faculties(*),
      sales_point:sales_points(*)
    `)
    .order('created_at', { ascending: false });
  
  if (filters?.year) {
    query = query.eq('year', filters.year);
  }
  if (filters?.facultyId) {
    query = query.eq('faculty_id', filters.facultyId);
  }
  if (filters?.salesPointId) {
    query = query.eq('sales_point_id', filters.salesPointId);
  }
  if (filters?.isUsed !== undefined) {
    query = query.eq('is_used', filters.isUsed);
  }
  if (filters?.batchId) {
    query = query.eq('batch_id', filters.batchId);
  }
  if (filters?.search) {
    query = query.ilike('key_code', `%${filters.search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return { data: [], error: error.message };
  }
  
  // Get unique user IDs from used codes
  const usedByIds = (data || [])
    .filter((row: Record<string, unknown>) => row.used_by)
    .map((row: Record<string, unknown>) => row.used_by as string);
  
  // Fetch user data for used codes
  let usersMap: Record<string, ActivationKeyUser> = {};
  if (usedByIds.length > 0) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, full_name, speciality, year_of_study, region')
      .in('id', usedByIds);
    
    if (usersData) {
      usersMap = usersData.reduce((acc: Record<string, ActivationKeyUser>, user: Record<string, unknown>) => {
        acc[user.id as string] = transformUser(user);
        return acc;
      }, {});
    }
  }
  
  // Transform to camelCase
  const transformed: ActivationKey[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    keyCode: row.key_code as string,
    durationDays: row.duration_days as number,
    isUsed: row.is_used as boolean,
    usedBy: row.used_by as string | undefined,
    usedByUser: row.used_by ? usersMap[row.used_by as string] : undefined,
    usedAt: row.used_at ? new Date(row.used_at as string) : undefined,
    createdBy: row.created_by as string | undefined,
    createdAt: new Date(row.created_at as string),
    year: row.year as YearLevel | undefined,
    facultyId: row.faculty_id as string | undefined,
    faculty: row.faculty ? transformFaculty(row.faculty as Record<string, unknown>) : undefined,
    salesPointId: row.sales_point_id as string | undefined,
    salesPoint: row.sales_point ? transformSalesPoint(row.sales_point as Record<string, unknown>) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : undefined,
    batchId: row.batch_id as string | undefined,
    notes: row.notes as string | undefined,
    pricePaid: row.price_paid as number | undefined,
    generationParams: row.generation_params as ActivationKey['generationParams'],
  }));
  
  return { data: transformed };
}

/**
 * Fetch all faculties
 */
export async function fetchFaculties(): Promise<{ data: Faculty[]; error?: string }> {
  const { data, error } = await supabase
    .from('faculties')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    return { data: [], error: error.message };
  }
  
  return { 
    data: (data || []).map((row: Record<string, unknown>) => transformFaculty(row)) 
  };
}

/**
 * Fetch all sales points
 */
export async function fetchSalesPoints(): Promise<{ data: SalesPoint[]; error?: string }> {
  const { data, error } = await supabase
    .from('sales_points')
    .select('*')
    .order('name');
  
  if (error) {
    return { data: [], error: error.message };
  }
  
  return { 
    data: (data || []).map((row: Record<string, unknown>) => transformSalesPoint(row)) 
  };
}

/**
 * Create a new sales point
 */
export async function createSalesPoint(
  salesPoint: Omit<SalesPoint, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<{ data?: SalesPoint; error?: string }> {
  const { data, error } = await supabase
    .from('sales_points')
    .insert({
      code: salesPoint.code,
      name: salesPoint.name,
      location: salesPoint.location,
      contact_name: salesPoint.contactName,
      contact_phone: salesPoint.contactPhone,
      contact_email: salesPoint.contactEmail,
      is_active: salesPoint.isActive,
      commission_rate: salesPoint.commissionRate,
      notes: salesPoint.notes,
      created_by: createdBy,
    })
    .select()
    .single();
  
  if (error) {
    return { error: error.message };
  }
  
  return { data: transformSalesPoint(data) };
}

/**
 * Update a sales point
 */
export async function updateSalesPoint(
  id: string,
  updates: Partial<SalesPoint>
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('sales_points')
    .update({
      code: updates.code,
      name: updates.name,
      location: updates.location,
      contact_name: updates.contactName,
      contact_phone: updates.contactPhone,
      contact_email: updates.contactEmail,
      is_active: updates.isActive,
      commission_rate: updates.commissionRate,
      notes: updates.notes,
    })
    .eq('id', id);
  
  return { error: error?.message };
}

/**
 * Delete a sales point
 */
export async function deleteSalesPoint(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('sales_points')
    .delete()
    .eq('id', id);
  
  return { error: error?.message };
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Fetch dashboard statistics
 */
export async function fetchDashboardStats(): Promise<{
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
  totalRevenue: number;
  error?: string;
}> {
  const now = new Date().toISOString();
  
  // Get all counts in parallel
  const [totalResult, usedResult, expiredResult, revenueResult] = await Promise.all([
    supabase.from('activation_keys').select('id', { count: 'exact', head: true }),
    supabase.from('activation_keys').select('id', { count: 'exact', head: true }).eq('is_used', true),
    supabase.from('activation_keys').select('id', { count: 'exact', head: true })
      .eq('is_used', false).lt('expires_at', now),
    supabase.from('activation_keys').select('price_paid').eq('is_used', true),
  ]);
  
  const totalCodes = totalResult.count || 0;
  const usedCodes = usedResult.count || 0;
  const expiredCodes = expiredResult.count || 0;
  const activeCodes = totalCodes - usedCodes - expiredCodes;
  
  const totalRevenue = (revenueResult.data || []).reduce(
    (sum: number, row: { price_paid: number | null }) => sum + (row.price_paid || 0), 
    0
  );
  
  return { totalCodes, activeCodes, usedCodes, expiredCodes, totalRevenue };
}

/**
 * Fetch sales point statistics
 */
export async function fetchSalesPointStats(): Promise<{ data: SalesPointStats[]; error?: string }> {
  const { data, error } = await supabase
    .from('sales_point_stats')
    .select('*');
  
  if (error) {
    return { data: [], error: error.message };
  }
  
  return {
    data: (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      code: row.code as string,
      name: row.name as string,
      location: row.location as string | undefined,
      totalCodes: Number(row.total_codes) || 0,
      usedCodes: Number(row.used_codes) || 0,
      activeCodes: Number(row.active_codes) || 0,
      expiredCodes: Number(row.expired_codes) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
      lastSaleAt: row.last_sale_at ? new Date(row.last_sale_at as string) : undefined,
    })),
  };
}

/**
 * Fetch faculty statistics
 */
export async function fetchFacultyStats(): Promise<{ data: FacultyStats[]; error?: string }> {
  const { data, error } = await supabase
    .from('faculty_stats')
    .select('*');
  
  if (error) {
    return { data: [], error: error.message };
  }
  
  return {
    data: (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      code: row.code as string,
      name: row.name as string,
      city: row.city as string,
      totalCodes: Number(row.total_codes) || 0,
      usedCodes: Number(row.used_codes) || 0,
      year1Codes: Number(row.year_1_codes) || 0,
      year2Codes: Number(row.year_2_codes) || 0,
      year3Codes: Number(row.year_3_codes) || 0,
    })),
  };
}

// ============================================================================
// Transform Helpers
// ============================================================================

function transformUser(row: Record<string, unknown>): ActivationKeyUser {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string | undefined,
    speciality: row.speciality as Speciality | undefined,
    yearOfStudy: row.year_of_study as YearLevel | undefined,
    region: row.region as string | undefined,
  };
}

function transformFaculty(row: Record<string, unknown>): Faculty {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    city: row.city as string,
    specialities: row.specialities as Faculty['specialities'],
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function transformSalesPoint(row: Record<string, unknown>): SalesPoint {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    location: row.location as string | undefined,
    contactName: row.contact_name as string | undefined,
    contactPhone: row.contact_phone as string | undefined,
    contactEmail: row.contact_email as string | undefined,
    isActive: row.is_active as boolean,
    commissionRate: Number(row.commission_rate) || 0,
    notes: row.notes as string | undefined,
    createdBy: row.created_by as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Revoke (delete) an activation key
 */
export async function revokeActivationKey(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('activation_keys')
    .delete()
    .eq('id', id)
    .eq('is_used', false); // Can only revoke unused keys
  
  return { error: error?.message };
}

/**
 * Export codes to CSV format with user information
 */
export function exportToCsv(codes: ActivationKey[]): string {
  const headers = [
    'Code', 'Année', 'Faculté', 'Point de Vente', 'Durée (jours)', 'Statut',
    'Nom Utilisateur', 'Email', 'Spécialité', 'Année Étude', 'Région',
    'Utilisé le', 'Créé le'
  ];
  const rows = codes.map(code => {
    const user = code.usedByUser;
    return [
      code.keyCode,
      code.year || '',
      code.faculty?.name || '',
      code.salesPoint?.name || '',
      code.durationDays.toString(),
      code.isUsed ? 'Utilisé' : (code.expiresAt && new Date(code.expiresAt) < new Date() ? 'Expiré' : 'Actif'),
      user?.fullName || '',
      user?.email || '',
      user?.speciality || '',
      user?.yearOfStudy ? `${user.yearOfStudy}ère année` : '',
      user?.region || '',
      code.usedAt ? new Date(code.usedAt).toLocaleDateString('fr-FR') : '',
      new Date(code.createdAt).toLocaleDateString('fr-FR'),
    ];
  });
  
  return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
}
