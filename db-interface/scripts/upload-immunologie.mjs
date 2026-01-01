import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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

const courses = [
  "1- Les organes lymphoïdes",
  "2- Les cytokines",
  "3- Les réponses immunitaires",
  "4- Les immunoglobulines",
  "5- Les cellules  de l'immunité CPA (M23)",
  "5- Les cellules  de l'immunité LB (M23)",
  "5- Les cellules  de l'immunité Les granulocytes et les mastocytes (M23)",
  "5-Les cellules  de l'immunité Les monocytes et les macrophages (M23)",
  "5- Les cellules  de l'immunité NK (M23)",
  "5-Les cellules  de l'immunité LT et TCR (M23)",
  "6- Les antigènes",
  "7- Le système du complément",
  "8- Le complexe majeur d’histocompatibilite",
  "9- Les Molécules d'adhésions"
];

async function upload() {
  const currentYear = '2';
  const speciality = 'Médecine';
  const currentModule = 'Immunologie';

  console.log(`Uploading ${courses.length} courses to ${currentModule}...`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const name of courses) {
    const cleanName = name.trim();
    
    // Check if exists
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('name', cleanName)
      .eq('year', currentYear)
      .eq('speciality', speciality)
      .eq('module_name', currentModule)
      .single();

    if (existing) {
      console.log(`Skipping (already exists): ${cleanName}`);
      skipCount++;
      continue;
    }

    const { error } = await supabase
      .from('courses')
      .insert({
        name: cleanName,
        year: currentYear,
        speciality: speciality,
        module_name: currentModule,
        sub_discipline: null
      });

    if (error) {
      console.error(`Failed: ${cleanName} - ${error.message}`);
      failCount++;
    } else {
      console.log(`Uploaded: ${cleanName}`);
      successCount++;
    }
  }

  console.log('\nDone!');
  console.log('Success:', successCount);
  console.log('Skipped:', skipCount);
  console.log('Failed:', failCount);
}

upload().catch(console.error);
