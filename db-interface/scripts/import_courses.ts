
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const COURS_FILE_PATH = 'c:\\Users\\MOZ\\Desktop\\qcm\\qcm-med\\cours';
const DEFAULT_YEAR = '2';
const DEFAULT_SPECIALITY = 'Médecine';

// --- Module Mapping ---
// Maps the file header (normalized) to the DB module name
const MODULE_MAPPING: Record<string, string> = {
    'cardio': 'Appareil Cardio-vasculaire et Respiratoire',
    'l’appareil urinaire': 'Appareil Urinaire',
    'appareil urinaire': 'Appareil Urinaire',
    'immunologie': 'Immunologie',
    'appareil endocrinien': 'Appareil Endocrinien et de la Reproduction',
    "l'appareil digestif": 'Appareil Digestif',
    'appareil digestif': 'Appareil Digestif'
};

// --- Env Loader ---
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    process.env[key] = value;
                }
            });
        }
    } catch (e) {
        console.warn('Could not read .env.local', e);
    }
}

async function main() {
    loadEnv();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }

    // Use a client with the key. If it's ANON, we might face RLS issues if not logged in.
    // Ideally we need SERVICE_ROLE_KEY for admin tasks.
    // If we only have ANON, we might fail unless we sign in, but we have no user creds here.
    // We'll hope for SERVICE_ROLE_KEY or loose RLS.
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📖 Reading courses from: ${COURS_FILE_PATH}`);

    if (!fs.existsSync(COURS_FILE_PATH)) {
        console.error('❌ File not found');
        process.exit(1);
    }

    const content = fs.readFileSync(COURS_FILE_PATH, 'utf8');
    const lines = content.split(/\r?\n/);

    let currentModule: string | null = null;
    let currentSubDiscipline: string | null = null;
    let coursesBuffer: { name: string; module: string; sub: string | null }[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect Module Header
        // Example: 🔴 Unité04: Cardio
        if (line.includes('🔴')) {
            // Extract raw name
            const rawName = line.replace(/^🔴\s*(?:Unité\s*\d+[:]?)?\s*/i, '').replace(/[:\.]+$/, '').trim();
            // Normalize for mapping
            const normalized = rawName.toLowerCase().replace(/\.\.\.$/, ''); // remove trailing dots

            let mapped = null;
            for (const key in MODULE_MAPPING) {
                if (normalized.includes(key)) {
                    mapped = MODULE_MAPPING[key];
                    break;
                }
            }

            if (mapped) {
                currentModule = mapped;
                currentSubDiscipline = null;
                console.log(`\n📦 Found Module: "${rawName}" -> Mapped to: "${currentModule}"`);
            } else {
                console.warn(`⚠️  Could not map module header: "${rawName}"`);
                currentModule = null; // Reset to avoid adding to wrong module
            }
            continue;
        }

        if (!currentModule) continue;

        // Detect Sub-discipline Header
        // Example: *Anatomie: or → Anatomie:
        if (line.match(/^[\*•→]\s*\w+/)) {
            const match = line.match(/^[\*•→]\s*([^:]+)/);
            if (match) {
                currentSubDiscipline = match[1].trim();
                // console.log(`   📂 Sub-discipline: ${currentSubDiscipline}`);
            }
            continue;
        }

        // Detect Course lines (usually start with number or dash, or just text)
        // Examples: "1/- embryologie...", "2/1- config...", "- la rate"
        // We want to capture the text part.
        // Regex to strip numbering: ^(?:\d+(?:\/\d+)?\s*[-–]\s*|[-–]\s*)

        // Also handling specific instruction lines to ignore
        if (line.includes('دروس يتم الاعتماد عليها') || line.startsWith('_')) continue;

        const courseNameClean = line.replace(/^(?:\d+(?:\/\d+)?\s*[-–]\s*|[-–]\s*)/, '').trim();

        if (courseNameClean.length > 2) { // minimal length check
            // We will store just the cleaned name. 
            // NOTE: User didn't ask to prefix sub-discipline, but it provides context.
            // However, standard QCM app usually just lists courses. 
            // Let's decide: If I don't prefix, "embryologie..." is fine. 
            // "structure du cœur" is fine.
            // Let's NOT prefix for now to keep names clean, as the sub-discipline is often implicit or not strictly required for filtering if the module is correct.
            // BUT, if there are duplicate names across sub-disciplines (unlikely here), it might be an issue.
            // Let's stick to clean names.

            coursesBuffer.push({
                name: courseNameClean,
                module: currentModule,
                sub: currentSubDiscipline
            });
        }
    }

    console.log(`\n✨ Parsed ${coursesBuffer.length} courses. Inserting into DB...`);

    // Insert loop
    let successCount = 0;
    let failCount = 0;

    for (const course of coursesBuffer) {
        // Upsert based on name, year, speciality, module_name
        // Note: unique constraint is (name, year, speciality, module_name)

        const { error } = await supabase
            .from('courses')
            .upsert({
                name: course.name,
                year: DEFAULT_YEAR,
                speciality: DEFAULT_SPECIALITY,
                module_name: course.module // Mapping
            }, {
                onConflict: 'name, year, speciality, module_name'
            });

        if (error) {
            console.error(`❌ Failed: ${course.name} (${course.module})`, error.message);
            failCount++;
        } else {
            //   console.log(`✅ Imported: ${course.name}`);
            successCount++;
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

main().catch(console.error);
