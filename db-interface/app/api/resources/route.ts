// API route for resources CRUD operations
// Uses service role key to bypass RLS (server-side only)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdminUser } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';

// GET /api/resources - List all resources
export async function GET(request: NextRequest) {
  try {
    const { data: resources, error } = await supabaseAdmin
      .from('course_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: resources });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No auth token' },
        { status: 401 }
      );
    }

    // Verify session with anon client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { isAdmin, role } = await verifyAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: `Forbidden - Role '${role}' cannot create resources` },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { resource } = body;

    // Insert resource using admin client (bypasses RLS)
    const resourceData = {
      year: resource.year,
      module_name: resource.module_name,
      sub_discipline: resource.sub_discipline || null,
      title: resource.title,
      type: resource.type,
      url: resource.url,
      description: resource.description || null,
      speciality: resource.speciality || null,
      cours: resource.cours || null,
      unity_name: resource.unity_name || null,
      module_type: resource.module_type,
      created_by: user.id,
    };

    const { data: newResource, error: resourceError } = await supabaseAdmin
      .from('course_resources')
      .insert(resourceData as any)
      .select()
      .single();

    if (resourceError) throw resourceError;

    return NextResponse.json({
      success: true,
      data: newResource,
    });
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/resources - Delete resource
export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { isAdmin } = await verifyAdminUser(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get resource ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resource ID required' },
        { status: 400 }
      );
    }

    // Delete resource
    const { error } = await supabaseAdmin
      .from('course_resources')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
