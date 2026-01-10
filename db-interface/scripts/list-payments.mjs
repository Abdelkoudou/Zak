/**
 * List all payments in the database
 * 
 * Usage: node scripts/list-payments.mjs
 * 
 * SECURITY: Credentials are loaded from .env.local file
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (key && !key.startsWith('#')) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not read .env.local:', e.message);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listPayments() {
  const { data, error } = await supabase
    .from('online_payments')
    .select(`
      id,
      checkout_id,
      customer_email,
      status,
      activation_key_id,
      created_at,
      activation_key:activation_keys!online_payments_activation_key_id_fkey(key_code)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Recent payments:');
  console.log('================');
  
  if (!data || data.length === 0) {
    console.log('No payments found');
    return;
  }

  data.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.checkout_id}`);
    console.log(`   Email: ${p.customer_email}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   Activation Key: ${p.activation_key?.key_code || 'None'}`);
    console.log(`   Created: ${p.created_at}`);
  });
}

listPayments();
