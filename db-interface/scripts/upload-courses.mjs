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
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const COURS_FILE_PATH = path.resolve(__dirname, '../../cours');

const MODULE_MAPPING = {
  'cardio': 'Appareil Cardio-vasculaire et Respiratoire',
  'urinaire': 'Appareil Urinaire',
  'digestif': 'Appareil Digestif',
  'endocrinien': 'Appareil Endocrinien et de la Reproduction',
  'immunologie': 'Immunologie'
};


function cleanCourseName(name) {
  // Keep the numbering (e.g., "01- Embryologie du cœur")
  // Only remove leading symbols like *, →, • but NOT numbers
  return name
    .replace(/^[-–•*→]\s*/, '')  // Remove leading dashes/bullets only
    .trim();
}

function isSubDisciplineHeader(line) {
  const pattern = /^[\s*→•]+\s*(Anatomie|Histologie|Physiologie|Biochimie|Biophysique)\s*:?\s*$/i;
  return pattern.test(line);
}

function isModuleHeader(line) {
  return line.includes('🔴') || line.toLowerCase().includes('unité');
}

function detectModule(line) {
  const lowerLine = line.toLowerCase();
  for (const [key, value] of Object.entries(MODULE_MAPPING)) {
    if (lowerLine.includes(key)) {
      return value;
    }
  }
  return null;
}

function detectSubDiscipline(line) {
  const lowerLine = line.toLowerCase();
  if (lowerLine.includes('anatomie')) return 'Anatomie';
  if (lowerLine.includes('histologie')) return 'Histologie';
  if (lowerLine.includes('physiologie')) return 'Physiologie';
  if (lowerLine.includes('biochimie')) return 'Biochimie';
  if (lowerLine.includes('biophysique')) return 'Biophysique';
  return null;
}

async function uploadCourses() {
  console.log('Reading cours file from:', COURS_FILE_PATH);
  
  if (!fs.existsSync(COURS_FILE_PATH)) {
    console.error('File not found:', COURS_FILE_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(COURS_FILE_PATH, 'utf-8');
  const lines = content.split('\n');

  let currentModule = '';
  let currentSubDiscipline = '';
  const currentYear = '2';
  const speciality = 'Médecine';
  const coursesToInsert = [];
  const seenCourses = new Set();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // Check for module header
    if (isModuleHeader(line)) {
      const detectedModule = detectModule(line);
      if (detectedModule) {
        currentModule = detectedModule;
        currentSubDiscipline = '';
        console.log('\nModule:', currentModule);
      }
      continue;
    }

    // Check for sub-discipline header
    if (isSubDisciplineHeader(line)) {
      const detected = detectSubDiscipline(line);
      if (detected) currentSubDiscipline = detected;
      continue;
    }

    // Detect Appareil Digestif section
    if (line.toLowerCase().includes('embryologie du tube digestif')) {
      currentModule = 'Appareil Digestif';
      currentSubDiscipline = 'Anatomie';
      console.log('\nModule:', currentModule, '(detected from content)');
    }

    // Detect sub-discipline from inline headers
    const subMatch = line.match(/^[\s*→•]*(Anatomie|Histologie|Physiologie|Biochimie|Biophysique)\s*:/i);
    if (subMatch) {
      currentSubDiscipline = subMatch[1].charAt(0).toUpperCase() + subMatch[1].slice(1).toLowerCase();
      continue;
    }

    if (!currentModule) continue;
    if (line.startsWith('🔴') || line.toLowerCase().includes('unité')) continue;

    const cleanName = cleanCourseName(line);
    if (cleanName.length < 3) continue;
    if (cleanName.toLowerCase().includes('unité')) continue;
    if (/^[\s*→•:]+$/.test(cleanName)) continue;

    const uniqueKey = `${cleanName}|${currentYear}|${speciality}|${currentModule}|${currentSubDiscipline}`;
    if (seenCourses.has(uniqueKey)) continue;
    seenCourses.add(uniqueKey);

    coursesToInsert.push({
      name: cleanName,
      year: currentYear,
      speciality: speciality,
      module_name: currentModule,
      sub_discipline: currentSubDiscipline || null
    });
  }

  console.log('\nFound', coursesToInsert.length, 'courses to insert.');

  if (coursesToInsert.length === 0) {
    console.log('No courses found.');
    return;
  }

  // Summary by module
  const byModule = {};
  for (const course of coursesToInsert) {
    byModule[course.module_name] = (byModule[course.module_name] || 0) + 1;
  }
  console.log('\nSummary by module:');
  for (const [mod, count] of Object.entries(byModule)) {
    console.log(' ', mod + ':', count, 'courses');
  }

  console.log('\nUploading to Supabase...');
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const course of coursesToInsert) {
    // First check if course already exists
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('name', course.name)
      .eq('year', course.year)
      .eq('speciality', course.speciality)
      .eq('module_name', course.module_name)
      .eq('sub_discipline', course.sub_discipline)
      .single();

    if (existing) {
      skipCount++;
      continue;
    }

    // Insert new course
    const { error } = await supabase
      .from('courses')
      .insert(course);

    if (error) {
      if (error.code === '23505') {
        // Duplicate - already exists
        skipCount++;
      } else {
        console.error('Failed:', course.name, '-', error.message);
        failCount++;
      }
    } else {
      successCount++;
    }
  }

  console.log('\nDone!');
  console.log('Success:', successCount);
  console.log('Skipped (already exist):', skipCount);
  console.log('Failed:', failCount);
}

uploadCourses().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
