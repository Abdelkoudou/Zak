/**
 * Poll Chargily API directly for payment status
 * 
 * Usage: node scripts/poll-chargily.mjs <checkout_id>
 */

const checkoutId = process.argv[2];

if (!checkoutId) {
  console.error('Usage: node scripts/poll-chargily.mjs <checkout_id>');
  process.exit(1);
}

console.log(`Polling Chargily for checkout: ${checkoutId}`);
console.log('');

fetch(`http://localhost:3005/api/payments/poll-chargily?checkout_id=${checkoutId}`)
  .then(async (response) => {
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
