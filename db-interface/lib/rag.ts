import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured');
    }
    
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

// Embedding model configuration
const EMBEDDING_MODEL = 'text-embedding-004';

export interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface ChatLogEntry {
  user_id?: string;
  model: string;
  model_name?: string;
  message: string;
  response: string;
  context_used?: KnowledgeResult[];
  fallback_used?: boolean;
  response_time_ms?: number;
}

/**
 * Generate embedding for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Format embedding array for Supabase pgvector
 */
function formatEmbeddingForSupabase(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Search knowledge base for relevant context
 */
export async function searchKnowledge(
  query: string,
  options: {
    threshold?: number;
    limit?: number;
    category?: string;
  } = {}
): Promise<KnowledgeResult[]> {
  const { threshold = 0.5, limit = 5, category } = options;

  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      console.warn('Could not generate embedding, skipping RAG');
      return [];
    }

    const supabase = getSupabaseAdmin();
    
    // Search using the database function
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: formatEmbeddingForSupabase(embedding),
      match_threshold: threshold,
      match_count: limit,
      filter_category: category || null,
    });

    if (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchKnowledge:', error);
    return [];
  }
}

/**
 * Format retrieved knowledge as context for the prompt
 */
export function formatContextForPrompt(results: KnowledgeResult[]): string {
  if (results.length === 0) return '';

  const contextParts = results.map((r, i) => 
    `[${i + 1}] ${r.title}: ${r.content}`
  );

  return `

## Retrieved Knowledge (Use this information to answer accurately):
${contextParts.join('\n')}
`;
}

/**
 * Log chat interaction to database
 */
export async function logChatInteraction(entry: ChatLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('chat_logs')
      .insert({
        user_id: entry.user_id || null,
        model: entry.model,
        model_name: entry.model_name,
        message: entry.message,
        response: entry.response,
        context_used: entry.context_used || [],
        fallback_used: entry.fallback_used || false,
        response_time_ms: entry.response_time_ms,
      });

    if (error) {
      console.error('Error logging chat:', error);
    }
  } catch (error) {
    console.error('Error in logChatInteraction:', error);
  }
}

/**
 * Add knowledge to the database with embedding
 */
export async function addKnowledge(
  title: string,
  content: string,
  category: string = 'general',
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Generate embedding
    const embedding = await generateEmbedding(`${title} ${content}`);
    
    const insertData: Record<string, unknown> = {
      title,
      content,
      category,
      metadata,
    };
    
    // Only add embedding if successfully generated
    if (embedding) {
      insertData.embedding = formatEmbeddingForSupabase(embedding);
    }
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Update embeddings for all knowledge entries without embeddings
 */
export async function updateAllEmbeddings(): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  try {
    const supabase = getSupabaseAdmin();
    
    // Get all entries without embeddings
    const { data: entries, error } = await supabase
      .from('knowledge_base')
      .select('id, title, content')
      .is('embedding', null);

    if (error || !entries) {
      console.error('Error fetching entries:', error);
      return { updated: 0, errors: 1 };
    }

    for (const entry of entries) {
      const embedding = await generateEmbedding(`${entry.title} ${entry.content}`);
      
      if (embedding) {
        const { error: updateError } = await supabase
          .from('knowledge_base')
          .update({ embedding: formatEmbeddingForSupabase(embedding) })
          .eq('id', entry.id);

        if (updateError) {
          console.error('Error updating embedding:', updateError);
          errors++;
        } else {
          updated++;
        }
      } else {
        errors++;
      }

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('Error updating embeddings:', error);
    errors++;
  }

  return { updated, errors };
}

/**
 * Get all knowledge entries (for admin)
 */
export async function getAllKnowledge(category?: string): Promise<KnowledgeResult[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('knowledge_base')
      .select('id, title, content, category')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching knowledge:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      ...item,
      similarity: 0, // Not applicable for listing
    }));
  } catch (error) {
    console.error('Error in getAllKnowledge:', error);
    return [];
  }
}
