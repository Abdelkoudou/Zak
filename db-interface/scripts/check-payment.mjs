/**
 * Check Payment Status Script
 * 
 * Usage: node scripts/check-payment.mjs <checkout_id>
 */

const checkoutId = process.argv[2];

if (!checkoutId) {
  console.error('Usage: node scripts/check-payment.mjs <checkout_id>');
  process.exit(1);
}

console.log(`Checking payment status for: ${checkoutId}`);
console.log('');

fetch(`http://localhost:3005/api/payments/status?checkout_id=${checkoutId}`)
  .then(async (response) => {
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
