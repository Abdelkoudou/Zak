/**
 * Test Webhook Script
 * 
 * Simulates a Chargily webhook to test the payment processing flow.
 * 
 * Usage:
 *   node scripts/test-webhook.mjs <checkout_id>
 * 
 * Example:
 *   node scripts/test-webhook.mjs 01hj5n7cqpaf0mt2d0xx85tgz8
 * 
 * To update existing pending payments to paid:
 *   node scripts/test-webhook.mjs --update-all
 */

const args = process.argv.slice(2);
const checkoutId = args[0];

if (!checkoutId) {
  console.error('❌ Error: Please provide a checkout_id');
  console.log('');
  console.log('Usage: node scripts/test-webhook.mjs <checkout_id>');
  console.log('');
  console.log('Get the checkout_id from:');
  console.log('  1. Supabase → Table Editor → online_payments → checkout_id column');
  console.log('  2. Or from the browser console after clicking "Payer"');
  process.exit(1);
}

// Special command to update all pending payments
if (checkoutId === '--update-all') {
  console.log('🔄 This would update all pending payments. Use Supabase SQL Editor instead:');
  console.log('');
  console.log(`UPDATE online_payments SET status = 'paid', paid_at = NOW() WHERE status = 'pending';`);
  console.log('');
  process.exit(0);
}

const webhookPayload = {
  id: `event_${Date.now()}`,
  entity: 'event',
  livemode: 'false',
  type: 'checkout.paid',
  data: {
    id: checkoutId,
    entity: 'checkout',
    status: 'paid',
    amount: 500000,
    currency: 'dzd',
    payment_method: 'CIB_TEST',
    invoice_id: `inv_${Date.now()}`,
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    metadata: {
      customer_email: 'test@example.com',
      customer_name: 'Test User',
    },
  },
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
};

console.log('🚀 Sending test webhook to localhost:3005...');
console.log('');
console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
console.log('');

fetch('http://localhost:3005/api/webhooks/chargily', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(webhookPayload),
})
  .then(async (response) => {
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      console.log('');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('Next steps:');
      console.log('  1. Check Supabase → online_payments → status should be "paid"');
      console.log('  2. Check Supabase → activation_keys → new code should be created');
      console.log('  3. The activation code is:', data.keyCode || '(check database)');
    } else {
      console.error('❌ Webhook failed:', data);
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Make sure the dev server is running: npm run dev (port 3005)');
  });
