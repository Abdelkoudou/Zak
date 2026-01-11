import { NextResponse } from 'next/server';
import { updateAllEmbeddings } from '@/lib/rag';

// POST: Regenerate all embeddings
export async function POST() {
  try {
    const result = await updateAllEmbeddings();
    
    return NextResponse.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
