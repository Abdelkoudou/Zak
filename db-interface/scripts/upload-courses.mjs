import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Get environment variables from process.env (passed via command line or set in environment)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please provide them via environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const currentDir = process.cwd(); // Assuming this is c:\Users\MOZ\Desktop\qcm\qcm-med\db-interface
const COURS_FILE_PATH = path.join(currentDir, '..', 'cours');

function cleanCourseName(name) {
  // Remove leading symbols like *, →, but keep numbers
  return name
    .replace(/^[\s*→]+/, '')
    .trim();
}

async function uploadCourses() {
  console.log('Reading cours file from:', COURS_FILE_PATH);
  if (!fs.existsSync(COURS_FILE_PATH)) {
      console.error('File not found:', COURS_FILE_PATH);
      process.exit(1);
  }

  // Clear existing courses to avoid duplicates with different names (with/without numbers)
  console.log('Clearing existing courses...');
  const { error: clearError } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (clearError) {
      console.error('Error clearing courses:', clearError.message);
      // Continue anyway, maybe it's fine
  }

  const content = fs.readFileSync(COURS_FILE_PATH, 'utf-8');
  const lines = content.split('\n');

  let currentModule = '';
  let currentSubDiscipline = '';
  let currentYear = '2';
  const speciality = 'Médecine';
  const coursesToInsert = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.includes('🔴 Unité 01: Cardio')) {
      currentModule = 'Appareil Cardio-vasculaire et Respiratoire';
      currentSubDiscipline = '';
      continue;
    } else if (line.includes('🔴 Unité 03: l’appareil urinaire')) {
      currentModule = 'Appareil Urinaire';
      currentSubDiscipline = '';
      continue;
    } else if (line.includes('Unité 04: Appareil Endocrinien')) {
      currentModule = 'Appareil Endocrinien et de la Reproduction';
      currentSubDiscipline = '';
      continue;
    }

    if (line.includes('Embryologie du tube digestif')) {
        currentModule = 'Appareil Digestif';
        currentSubDiscipline = '';
    }

    if (line.endsWith(':') || line.startsWith('*') && line.endsWith(':') || line.startsWith('→')) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('anatomie')) currentSubDiscipline = 'Anatomie';
        else if (lowerLine.includes('histologie')) currentSubDiscipline = 'Histologie';
        else if (lowerLine.includes('physiologie')) currentSubDiscipline = 'Physiologie';
        else if (lowerLine.includes('biochimie')) currentSubDiscipline = 'Biochimie';
        else if (lowerLine.includes('biophysique')) currentSubDiscipline = 'Biophysique';
        
        // Skip adding the header as a course
        if (lowerLine.includes('anatomie') || 
            lowerLine.includes('histologie') || 
            lowerLine.includes('physiologie') || 
            lowerLine.includes('biochimie') || 
            lowerLine.includes('biophysique')) {
            continue;
        }
    }

    if (currentModule && line.length > 3) {
      const cleanName = cleanCourseName(line);
      if (cleanName && !cleanName.includes('Unité')) {
        coursesToInsert.push({
          name: cleanName,
          year: currentYear,
          speciality: speciality,
          module_name: currentModule,
          sub_discipline: currentSubDiscipline || null
        });
      }
    }
  }

  console.log(`Found ${coursesToInsert.length} courses to insert.`);

  if (coursesToInsert.length === 0) {
      console.log('No courses found to insert.');
      return;
  }

  const { data, error } = await supabase
    .from('courses')
    .upsert(coursesToInsert, { 
        onConflict: 'name,year,speciality,module_name,sub_discipline',
        ignoreDuplicates: true 
    });

  if (error) {
    console.error('Error inserting courses:', error.message);
  } else {
    console.log('Successfully processed courses.');
  }
}

uploadCourses().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

