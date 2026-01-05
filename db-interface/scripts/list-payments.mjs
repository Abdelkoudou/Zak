/**
 * List all payments in the database
 * 
 * Usage: node scripts/list-payments.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tkthvgvjecihqfnknosj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdGh2Z3ZqZWNpaHFmbmtub3NqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQyODA5NCwiZXhwIjoyMDc5MDA0MDk0fQ.zGNgmAqA9ir7G0tDDL2GDOukGti6aiZsezGCo1V5S4Y'
);

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
