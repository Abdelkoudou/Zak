import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.warn('Could not read .env.local', e);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function rollback() {
  // Delete courses added today (after a certain timestamp)
  // The script ran at approximately 2025-12-28 around 22:35 UTC based on the screenshot
  
  console.log('Fetching courses added recently...');
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, name, created_at')
    .gte('created_at', '2025-12-28T00:00:00Z');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Courses added today:', courses.length);
  
  if (courses.length === 0) {
    console.log('No recent courses to delete');
    return;
  }

  // Show sample
  console.log('\nSample of courses to delete:');
  courses.slice(0, 5).forEach(c => console.log(' -', c.name));
  
  // Delete them
  console.log('\nDeleting', courses.length, 'courses...');
  
  const ids = courses.map(c => c.id);
  const { error: delError } = await supabase
    .from('courses')
    .delete()
    .in('id', ids);

  if (delError) {
    console.error('Delete error:', delError.message);
  } else {
    console.log('Deleted successfully!');
  }

  // Check remaining
  const { count } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });
  
  console.log('Remaining courses:', count);
}

rollback().catch(console.error);
