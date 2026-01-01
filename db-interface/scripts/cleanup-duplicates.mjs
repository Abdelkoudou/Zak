import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
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

async function cleanupDuplicates() {
  console.log('Fetching all courses...');
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching courses:', error.message);
    process.exit(1);
  }

  console.log('Total courses:', courses.length);

  // Group by name + year + speciality + module_name (ignore sub_discipline for finding duplicates)
  const groups = {};
  for (const course of courses) {
    const key = `${course.name}|${course.year}|${course.speciality}|${course.module_name}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(course);
  }

  // Find duplicates (groups with more than 1 entry)
  const duplicateIds = [];
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      // Keep the first one (oldest), delete the rest
      for (let i = 1; i < group.length; i++) {
        duplicateIds.push(group[i].id);
      }
    }
  }

  console.log('Duplicate entries to delete:', duplicateIds.length);

  if (duplicateIds.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  // Delete duplicates
  console.log('Deleting duplicates...');
  const { error: deleteError } = await supabase
    .from('courses')
    .delete()
    .in('id', duplicateIds);

  if (deleteError) {
    console.error('Error deleting duplicates:', deleteError.message);
  } else {
    console.log('Successfully deleted', duplicateIds.length, 'duplicate entries');
  }

  // Verify final count
  const { count } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });
  
  console.log('Remaining courses:', count);
}

cleanupDuplicates().catch(console.error);
