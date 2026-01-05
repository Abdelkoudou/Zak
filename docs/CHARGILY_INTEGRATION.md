# Chargily Pay Integration Guide

This document explains how the Chargily Pay payment gateway is integrated into the MCQ Study App.

## Overview

Chargily Pay allows users to purchase subscriptions online using Algerian payment methods (CIB, EDAHABIA). When a payment is successful, an activation code is automatically generated and linked to the payment.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Native  │     │   db-interface  │     │   Chargily Pay  │
│      App        │     │   (Next.js)     │     │      API        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. User clicks       │                       │
         │     "Buy Online"      │                       │
         │──────────────────────>│                       │
         │                       │  2. Create checkout   │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │  3. Return checkout   │
         │                       │<──────────────────────│
         │  4. Redirect to       │                       │
         │     checkout URL      │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  5. User completes    │                       │
         │     payment           │                       │
         │──────────────────────────────────────────────>│
         │                       │                       │
         │                       │  6. Webhook: payment  │
         │                       │     successful        │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │  7. Generate code &   │
         │                       │     store in DB       │
         │                       │                       │
         │  8. Redirect to       │                       │
         │     success page      │                       │
         │<──────────────────────────────────────────────│
         │                       │                       │
         │  9. User registers    │                       │
         │     with code         │                       │
         │──────────────────────>│                       │
```

## Components

### Database (Supabase)

**New Table: `online_payments`**
- Tracks all payment attempts
- Links to generated activation codes
- Stores webhook payloads for audit

**Modified Table: `activation_keys`**
- Added `payment_id` to link to online payments
- Added `payment_source` enum ('manual' | 'online')

**Migration:** `supabase/migrations/019_online_payments.sql`

### API Endpoints (db-interface)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-checkout` | POST | Create Chargily checkout |
| `/api/payments/create-checkout` | GET | Get subscription plans |
| `/api/payments/status` | GET | Check payment status |
| `/api/webhooks/chargily` | POST | Receive Chargily webhooks |

### Pages (db-interface)

| Page | Description |
|------|-------------|
| `/buy` | Public purchase page |
| `/payment/success` | Success redirect page |
| `/payment/failure` | Failure redirect page |
| `/payments` | Admin payments dashboard |

### Library

**`db-interface/lib/chargily.ts`**
- `ChargilyClient` class for API calls
- `verifyWebhookSignature()` for security
- `SUBSCRIPTION_PRICES` constants

## Setup

### 1. Environment Variables

Add to `db-interface/.env.local`:

```env
# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Chargily Pay
CHARGILY_SECRET_KEY=test_sk_xxx  # or sk_xxx for live
CHARGILY_WEBHOOK_SECRET=your-webhook-secret  # optional

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Migration

Run the migration to create the online_payments table:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard SQL Editor
```

### 3. Configure Webhook in Chargily Dashboard

1. Go to [Chargily Pay Dashboard](https://pay.chargily.com)
2. Navigate to Developers Corner
3. Add webhook URL: `https://your-domain.com/api/webhooks/chargily`

### 4. Test Locally with ngrok

```bash
# Start ngrok
ngrok http 3000

# Use the ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/webhooks/chargily
```

## Payment Flow

### 1. Create Checkout

```typescript
// POST /api/payments/create-checkout
const response = await fetch('/api/payments/create-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerEmail: 'user@example.com',
    customerName: 'John Doe',
    duration: '365',  // 30, 90, 180, or 365 days
    locale: 'fr',
  }),
});

const { checkoutUrl } = await response.json();
window.location.href = checkoutUrl;
```

### 2. Webhook Processing

When Chargily sends a `checkout.paid` event:

1. Verify webhook signature (if configured)
2. Call `process_successful_payment()` database function
3. Auto-generate activation code with format: `PAY-XXXXXXXX-XX`
4. Link code to payment record
5. Return success response

### 3. User Registration

User receives the activation code and uses it during registration in the React Native app (same flow as manual codes).

## Subscription Plans

| Duration | Price (DZD) | Price (Centimes) |
|----------|-------------|------------------|
| 1 Month  | 1,000 DA    | 100,000          |
| 3 Months | 2,000 DA    | 200,000          |
| 6 Months | 3,000 DA    | 300,000          |
| 1 Year   | 5,000 DA    | 500,000          |

Prices are configured in `db-interface/lib/chargily.ts`:

```typescript
export const SUBSCRIPTION_PRICES = {
  '365': { amount: 500000, label: '1 An - 5000 DA' },
  '180': { amount: 300000, label: '6 Mois - 3000 DA' },
  '90': { amount: 200000, label: '3 Mois - 2000 DA' },
  '30': { amount: 100000, label: '1 Mois - 1000 DA' },
};
```

## Admin Dashboard

Access `/payments` to view:
- Total payments and revenue
- Payment status breakdown
- Customer details
- Generated activation codes
- Filter by status and search by email

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures in production
2. **Service Role Key**: Only use on server-side, never expose to client
3. **Idempotency**: Webhook handler checks if payment already processed
4. **HTTPS**: All production URLs must use HTTPS

## Troubleshooting

### Webhook Not Received

1. Check ngrok is running (for local testing)
2. Verify webhook URL in Chargily Dashboard
3. Check server logs for errors
4. Ensure endpoint returns 200 status

### Payment Not Generating Code

1. Check `online_payments` table for the checkout_id
2. Verify `process_successful_payment()` function exists
3. Check for RLS policy issues (use service role key)

### Code Not Working

1. Verify code exists in `activation_keys` table
2. Check `is_used` status
3. Verify `payment_source` is 'online'

## API Reference

See `docs/CHARGILY_PAY_API.md` for complete Chargily API documentation.
