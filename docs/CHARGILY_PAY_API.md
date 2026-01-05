# Chargily Pay V2 API Documentation

Complete API reference for integrating Chargily Pay payment gateway into your application.

> Source: [Chargily Pay Documentation](https://dev.chargily.com/pay-v2/)

## Overview

Chargily Pay is an Algerian payment gateway that supports DZD, EUR, and USD currencies. The API is REST-based with JSON payloads.

## Base URLs

| Mode | Base URL |
|------|----------|
| Test | `https://pay.chargily.net/test/api/v2` |
| Live | `https://pay.chargily.net/api/v2` |

## Authentication

All requests require an API key in the Authorization header:

```
Authorization: Bearer <your_secret_key>
```

- Get your API keys from the [Chargily Pay Dashboard](https://pay.chargily.com) → Developers Corner
- Test keys start with `test_sk_`
- Live keys start with `sk_`
- **Never expose your secret key in client-side code**

---

## API Resources

### 1. Balance

Retrieve your account balance across all currencies.

#### The Balance Object

```json
{
  "entity": "balance",
  "livemode": false,
  "wallets": [
    {
      "currency": "dzd",
      "balance": 50000,
      "ready_for_payout": "40000",
      "on_hold": 10000
    },
    {
      "currency": "usd",
      "balance": 2000,
      "ready_for_payout": "1800",
      "on_hold": 200
    },
    {
      "currency": "eur",
      "balance": 500,
      "ready_for_payout": "250",
      "on_hold": 250
    }
  ]
}
```

#### Retrieve Balance

```bash
GET /balance
```

---

### 2. Customers

Manage customer records for repeat payments.

#### The Customer Object

```json
{
  "id": "01hj0p5s3ygy2mx1czg2wzcc4x",
  "entity": "customer",
  "livemode": false,
  "name": "Hocine Saad",
  "email": null,
  "phone": null,
  "address": {
    "country": "Algeria",
    "state": "Tizi-Ouzou",
    "address": "123 Main Street"
  },
  "metadata": null,
  "created_at": 1702977791,
  "updated_at": 1702977791
}
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customers` | Create a customer |
| POST | `/customers/{id}` | Update a customer |
| GET | `/customers/{id}` | Retrieve a customer |
| GET | `/customers` | List all customers |
| DELETE | `/customers/{id}` | Delete a customer |

#### Create Customer Example

```bash
curl --request POST \
  --url https://pay.chargily.net/test/api/v2/customers \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+213555123456",
    "address": {
      "country": "Algeria",
      "state": "Algiers",
      "address": "123 Main Street"
    }
  }'
```

---

### 3. Products

Create products for your catalog.

#### The Product Object

```json
{
  "id": "01hhyjnrdbc1xhgmd34hs1v3en",
  "entity": "product",
  "livemode": false,
  "name": "Super Product",
  "description": null,
  "images": [],
  "metadata": [],
  "created_at": 1702907011,
  "updated_at": 1702911993
}
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create a product |
| POST | `/products/{id}` | Update a product |
| GET | `/products/{id}` | Retrieve a product |
| GET | `/products` | List all products |
| DELETE | `/products/{id}` | Delete a product |
| GET | `/products/{id}/prices` | Get product's prices |

#### Create Product Example

```bash
curl --request POST \
  --url https://pay.chargily.net/test/api/v2/products \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Premium Subscription",
    "description": "1 Year Access",
    "images": ["https://example.com/image.png"],
    "metadata": {"plan": "premium"}
  }'
```

---

### 4. Prices

Set prices for your products.

#### The Price Object

```json
{
  "id": "01hhy57e5j3xzce7ama8gtk7m0",
  "entity": "price",
  "livemode": false,
  "amount": 200,
  "currency": "dzd",
  "metadata": null,
  "created_at": 1702892910,
  "updated_at": 1702892910,
  "product_id": "01hhy57dnhxf6pq4zcmw7tjnp6"
}
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/prices` | Create a price |
| POST | `/prices/{id}` | Update a price |
| GET | `/prices/{id}` | Retrieve a price |
| GET | `/prices` | List all prices |

#### Create Price Example

```bash
curl --request POST \
  --url https://pay.chargily.net/test/api/v2/prices \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "product_id": "01hhyjnrdbc1xhgmd34hs1v3en",
    "amount": 5000,
    "currency": "dzd"
  }'
```

---

### 5. Checkouts (Most Important)

Create payment sessions for customers.

#### The Checkout Object

```json
{
  "id": "01hj5n7cqpaf0mt2d0xx85tgz8",
  "entity": "checkout",
  "livemode": false,
  "amount": 2500,
  "currency": "dzd",
  "fees": 0,
  "fees_on_merchant": 0,
  "fees_on_customer": 0,
  "pass_fees_to_customer": null,
  "chargily_pay_fees_allocation": "customer",
  "status": "pending",
  "locale": "en",
  "description": null,
  "metadata": null,
  "success_url": "https://my-app.com/payments/success",
  "failure_url": "https://my-app.com/payments/failure",
  "webhook_endpoint": null,
  "payment_method": null,
  "invoice_id": null,
  "customer_id": "01hj150206g0jxnh5r2yvvdrna",
  "payment_link_id": null,
  "created_at": 1703144567,
  "updated_at": 1703144567,
  "shipping_address": null,
  "collect_shipping_address": 0,
  "discount": {
    "type": "percentage",
    "value": 50
  },
  "amount_without_discount": 5000,
  "checkout_url": "https://pay.chargily.dz/test/checkouts/01hj5n7cqpaf0mt2d0xx85tgz8/pay"
}
```

#### Checkout Status Values

- `pending` - Waiting for payment
- `paid` - Payment successful
- `failed` - Payment failed
- `canceled` - Checkout expired or canceled

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkouts` | Create a checkout |
| GET | `/checkouts/{id}` | Retrieve a checkout |
| GET | `/checkouts` | List all checkouts |
| GET | `/checkouts/{id}/items` | Get checkout items |
| POST | `/checkouts/{id}/expire` | Expire a checkout |

#### Create Checkout - Direct Amount (Recommended)

```bash
curl --request POST \
  --url https://pay.chargily.net/test/api/v2/checkouts \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount": 5000,
    "currency": "dzd",
    "success_url": "https://your-app.com/payment/success",
    "failure_url": "https://your-app.com/payment/failure",
    "webhook_endpoint": "https://your-app.com/api/webhooks/chargily",
    "description": "Order #12345",
    "locale": "ar",
    "customer_id": "01hj0p5s3ygy2mx1czg2wzcc4x",
    "metadata": {
      "order_id": "12345",
      "user_id": "user_abc"
    }
  }'
```

#### Create Checkout - With Products/Prices

```bash
curl --request POST \
  --url https://pay.chargily.net/test/api/v2/checkouts \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "items": [
      {
        "price": "01hhy57e5j3xzce7ama8gtk7m0",
        "quantity": 2
      }
    ],
    "success_url": "https://your-app.com/payment/success",
    "failure_url": "https://your-app.com/payment/failure"
  }'
```

#### Checkout Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | integer | Yes* | Amount in smallest currency unit (centimes for DZD) |
| `currency` | string | Yes* | `dzd`, `usd`, or `eur` |
| `items` | array | Yes* | Array of price/quantity objects (alternative to amount) |
| `success_url` | string | Yes | Redirect URL after successful payment |
| `failure_url` | string | No | Redirect URL after failed payment |
| `webhook_endpoint` | string | No | URL to receive webhook notifications |
| `customer_id` | string | No | Link to existing customer |
| `description` | string | No | Payment description |
| `locale` | string | No | `en`, `ar`, or `fr` |
| `metadata` | object | No | Custom key-value data |
| `percentage_discount` | integer | No | Percentage discount (0-100) |
| `amount_discount` | integer | No | Fixed amount discount |
| `collect_shipping_address` | boolean | No | Collect shipping address |

*Either `amount`+`currency` OR `items` is required

---

### 6. Payment Links

Create reusable payment links (for social media, etc.).

#### The Payment Link Object

```json
{
  "id": "01hhhtvg4w7gk4mcaxmgzb2ynw",
  "entity": "payment_link",
  "livemode": false,
  "name": "Payment Link for Facebook page.",
  "active": 1,
  "after_completion_message": "The product will arrive in 03 days.",
  "locale": "ar",
  "pass_fees_to_customer": false,
  "metadata": [],
  "created_at": 1702479380,
  "updated_at": 1702479380,
  "collect_shipping_address": 0,
  "url": "https://pay.chargily.dz/test/payment-links/01hhhtvg4w7gk4mcaxmgzb2ynw"
}
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment-links` | Create a payment link |
| POST | `/payment-links/{id}` | Update a payment link |
| GET | `/payment-links/{id}` | Retrieve a payment link |
| GET | `/payment-links` | List all payment links |
| GET | `/payment-links/{id}/items` | Get payment link items |

---

## Webhooks

Webhooks notify your server when payment events occur.

### Webhook Events

| Event | Description |
|-------|-------------|
| `checkout.paid` | Payment completed successfully |
| `checkout.failed` | Payment failed |
| `checkout.canceled` | Checkout was canceled/expired |

### Webhook Payload Example

```json
{
  "id": "01hjjjzf7wbc454te45mwx35fe",
  "entity": "event",
  "livemode": "false",
  "type": "checkout.paid",
  "data": {
    "id": "01hjjj9aymmrwe664nbzrv84sg",
    "entity": "checkout",
    "fees": 1250,
    "amount": 50000,
    "locale": "ar",
    "status": "paid",
    "metadata": null,
    "created_at": 1703577693,
    "invoice_id": null,
    "updated_at": 1703578418,
    "customer_id": "01hjjjzf07chnbkcjax2vs58fv",
    "description": null,
    "failure_url": null,
    "success_url": "https://your-cool-website.com/payments/success",
    "payment_method": null,
    "payment_link_id": null,
    "pass_fees_to_customer": null,
    "chargily_pay_fees_allocation": "customer",
    "shipping_address": null,
    "collect_shipping_address": 1,
    "discount": null,
    "amount_without_discount": null,
    "url": "https://pay.chargily.dz/test/checkouts/01hjjj9aymmrwe664nbzrv84sg/pay"
  },
  "created_at": 1703578418,
  "updated_at": 1703578418
}
```

### Setting Up Webhooks

1. **Dashboard Method**: Go to Developers Corner → Add webhook URL
2. **Per-Checkout**: Pass `webhook_endpoint` when creating a checkout

### Webhook Endpoint Requirements

Your endpoint must:
- Accept POST requests
- Return 2xx status code
- Process the JSON payload
- Verify the webhook signature (recommended)

### Example Webhook Handler (Node.js/Express)

```javascript
app.post('/api/webhooks/chargily', express.json(), async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'checkout.paid':
      const checkout = event.data;
      // Update order status, grant access, etc.
      await handleSuccessfulPayment(checkout);
      break;
    case 'checkout.failed':
      await handleFailedPayment(event.data);
      break;
    case 'checkout.canceled':
      await handleCanceledPayment(event.data);
      break;
  }
  
  res.status(200).json({ received: true });
});
```

### Local Testing

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Use the generated URL as your webhook endpoint
```

---

## Pagination

List endpoints support pagination:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `per_page` | 10 | Items per page |

### Response Format

```json
{
  "livemode": false,
  "current_page": 1,
  "data": [...],
  "first_page_url": "https://pay.chargily.net/test/api/v2/products?page=1",
  "last_page": 4,
  "last_page_url": "https://pay.chargily.net/test/api/v2/products?page=4",
  "next_page_url": "https://pay.chargily.net/test/api/v2/products?page=2",
  "path": "https://pay.chargily.net/test/api/v2/products",
  "per_page": 10,
  "prev_page_url": null,
  "total": 35
}
```

---

## Supported Currencies

| Currency | Code | Minimum Amount |
|----------|------|----------------|
| Algerian Dinar | `dzd` | 75 DZD |
| US Dollar | `usd` | - |
| Euro | `eur` | - |

---

## Error Handling

The API returns standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |

---

## Integration Flow (Quick Start)

### Simple Integration (Recommended)

1. **Create Checkout** with amount and currency
2. **Redirect user** to `checkout_url`
3. **Handle webhook** for payment confirmation
4. **Redirect user** lands on success/failure URL

```javascript
// 1. Create checkout (server-side)
const response = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer test_sk_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 5000,
    currency: 'dzd',
    success_url: 'https://your-app.com/success',
    failure_url: 'https://your-app.com/failure',
    webhook_endpoint: 'https://your-app.com/api/webhooks/chargily',
    metadata: { order_id: '12345' }
  })
});

const checkout = await response.json();

// 2. Redirect user to payment page
window.location.href = checkout.checkout_url;
```

### Full Integration (With Products)

1. **Create Product** (once)
2. **Create Price** for product (once)
3. **Create Checkout** with items
4. **Handle webhook** for confirmation

---

## Best Practices

1. **Always use webhooks** - Don't rely solely on redirect URLs
2. **Store checkout ID** - Link it to your order before redirecting
3. **Use metadata** - Store order/user IDs for easy reconciliation
4. **Verify webhook signatures** - Prevent spoofed requests
5. **Handle idempotency** - Webhooks may be sent multiple times
6. **Test thoroughly** - Use test mode before going live

---

## Official Resources

- [Documentation](https://dev.chargily.com/pay-v2/)
- [Dashboard](https://pay.chargily.com)
- [GitHub](https://github.com/Chargily)
