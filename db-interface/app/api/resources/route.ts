/**
 * API route for resources CRUD operations
 * Secured with authentication, authorization, validation, and rate limiting
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  validateBody,
  validateParam,
  requireAuthenticatedAdmin,
  applyRateLimit,
  sanitizeError,
  successResponse,
  errorResponse,
} from '@/lib/security/api-utils';
import { createResourceSchema, uuidSchema } from '@/lib/security/validation';

// GET /api/resources - List all resources (requires admin auth)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    const { data: resources, error } = await supabaseAdmin
      .from('course_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(resources, rateLimitResult.headers);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// POST /api/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(request, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Validate request body
    const bodyResult = await validateBody(request, createResourceSchema);
    if (bodyResult.error) return bodyResult.error;

    const { resource } = bodyResult.data;

    // Insert resource using admin client (bypasses RLS)
    const resourceData = {
      year: resource.year,
      module_name: resource.module_name || null,
      sub_discipline: resource.sub_discipline || null,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      description: resource.description || null,
      speciality: resource.speciality || null,
      cours: resource.cours || null,
      unity_name: resource.unity_name || null,
      module_type: resource.module_type,
      created_by: authResult.user.id,
    };

    const { data: newResource, error: resourceError } = await supabaseAdmin
      .from('course_resources')
      .insert(resourceData as any)
      .select()
      .single();

    if (resourceError) throw resourceError;

    return successResponse(newResource, rateLimitResult.headers);
  } catch (error) {
    console.error('Error creating resource:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}

// DELETE /api/resources?id=xxx - Delete resource
export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting for write operations
    const rateLimitResult = await applyRateLimit(request, 'write');
    if (rateLimitResult.error) return rateLimitResult.error;

    // Require authenticated admin
    const authResult = await requireAuthenticatedAdmin(request);
    if (authResult.error) return authResult.error;

    // Validate resource ID
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const idResult = validateParam(idParam, uuidSchema, 'Resource ID');
    if (idResult.error) return idResult.error;

    // Delete resource
    const { error } = await supabaseAdmin
      .from('course_resources')
      .delete()
      .eq('id', idResult.data);

    if (error) throw error;

    return successResponse({ deleted: true }, rateLimitResult.headers);
  } catch (error) {
    console.error('Error deleting resource:', error);
    return errorResponse(sanitizeError(error), 500);
  }
}
