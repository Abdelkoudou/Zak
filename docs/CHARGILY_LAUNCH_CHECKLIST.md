# Chargily Payment - Production Launch Checklist

Quick reference for launching Chargily payment integration to production.

## ⏱️ Estimated Time: 4-8 hours

---

## 📝 Pre-Launch Checklist

### 1. Get Chargily Credentials (30 min)

- [ ] Log in to [Chargily Dashboard](https://pay.chargily.com)
- [ ] Switch to **Live Mode** (toggle in top-right)
- [ ] Go to: Developers Corner → API Keys
- [ ] Copy **Live Secret Key** (starts with `sk_live_`)
- [ ] Save securely (you'll need it for environment variables)

### 2. Configure Webhook (15 min)

- [ ] In Chargily Dashboard: Developers Corner → Webhooks
- [ ] Click "Add Webhook"
- [ ] Enter URL: `https://your-domain.com/api/webhooks/chargily`
- [ ] Select events:
  - [x] checkout.paid
  - [x] checkout.failed
  - [x] checkout.canceled
- [ ] Click "Create"
- [ ] Copy **Webhook Secret** (starts with `whsec_`)
- [ ] Save securely

### 3. Set Environment Variables (15 min)

#### In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add these variables:

```bash
# Chargily Live Credentials
CHARGILY_SECRET_KEY=sk_live_your_key_here
CHARGILY_WEBHOOK_SECRET=whsec_your_secret_here

# Production URL (MUST be HTTPS)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Node Environment
NODE_ENV=production

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

3. Click "Save"
4. Redeploy application

### 4. Apply Database Migration (5 min)

- [ ] Open Supabase Dashboard
- [ ] Go to: SQL Editor
- [ ] Open file: `supabase/migrations/019_online_payments.sql`
- [ ] Click "Run"
- [ ] Verify no errors

### 5. Test in Test Mode (1-2 hours)

#### A. Test Webhook Endpoint
```bash
curl https://your-domain.com/api/webhooks/chargily
# Should return: {"status":"ok","endpoint":"Chargily Pay Webhook",...}
```

#### B. Test Buy Page
- [ ] Visit: `https://your-domain.com/buy`
- [ ] Page loads correctly
- [ ] Form validation works
- [ ] No console errors

#### C. Test Payment Flow (Test Mode)
1. **Switch Chargily to Test Mode**
   - [ ] Chargily Dashboard → Toggle to "Test Mode"
   - [ ] Update `CHARGILY_SECRET_KEY` to test key (`test_sk_...`)
   - [ ] Redeploy

2. **Make Test Payment**
   - [ ] Fill out buy form
   - [ ] Click "Payer"
   - [ ] Redirects to Chargily checkout
   - [ ] Use test card: `4242 4242 4242 4242`
   - [ ] Complete payment
   - [ ] Redirects to success page
   - [ ] Activation code appears (within 10 seconds)
   - [ ] Code is copyable

3. **Verify in Database**
   - [ ] Check `online_payments` table
   - [ ] Status = 'paid'
   - [ ] `activation_key_id` is set
   - [ ] Check `activation_keys` table
   - [ ] Code exists with format `PAY-XXXXXXXX-XX`

4. **Test Code in App**
   - [ ] Open React Native app
   - [ ] Go to registration
   - [ ] Enter activation code
   - [ ] Subscription activates

5. **Test Failure Scenario**
   - [ ] Start new payment
   - [ ] Use test card: `4000 0000 0000 0002` (decline)
   - [ ] Payment fails
   - [ ] Redirects to failure page
   - [ ] Can retry

#### D. Test Webhook Delivery
- [ ] Check Chargily Dashboard → Webhooks → Logs
- [ ] Verify webhook was sent
- [ ] Status = 200 OK
- [ ] No errors

#### E. Test Polling Fallback
1. **Temporarily disable webhook**
   - [ ] Chargily Dashboard → Webhooks → Disable
2. **Make test payment**
   - [ ] Complete payment
   - [ ] Success page polls API
   - [ ] Code generated via polling
3. **Re-enable webhook**

### 6. Switch to Live Mode (30 min)

- [ ] **IMPORTANT**: Test mode complete and working
- [ ] Switch Chargily to **Live Mode**
- [ ] Update `CHARGILY_SECRET_KEY` to live key (`sk_live_...`)
- [ ] Update `CHARGILY_WEBHOOK_SECRET` to live webhook secret
- [ ] Redeploy application
- [ ] Verify webhook URL is correct in Chargily Dashboard

### 7. Make Real Test Payment (30 min)

**⚠️ Use small amount for first test (e.g., 100 DA if possible)**

- [ ] Visit buy page
- [ ] Enter real email
- [ ] Complete payment with real card
- [ ] Verify webhook received
- [ ] Verify code generated
- [ ] Test code in app
- [ ] Verify subscription activated

**If successful**: ✅ You're live!

**If failed**: Check troubleshooting section below

---

## 🔍 Post-Launch Monitoring (First 24 hours)

### Hour 1-2: Active Monitoring
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Supabase logs
- [ ] Check Chargily webhook logs
- [ ] Test with 2-3 real payments

### Hour 3-24: Periodic Checks
- [ ] Check every 2 hours for errors
- [ ] Monitor payment success rate
- [ ] Check admin dashboard for payments
- [ ] Verify all codes are generated

### Day 2-7: Daily Checks
- [ ] Review failed payments
- [ ] Check webhook delivery rate
- [ ] Monitor user feedback
- [ ] Fix any issues immediately

---

## 🐛 Troubleshooting

### Webhook Not Received

**Symptoms**: Payment succeeds but no code generated

**Checks**:
1. [ ] Webhook URL correct in Chargily Dashboard?
2. [ ] Webhook secret matches environment variable?
3. [ ] Check Chargily Dashboard → Webhooks → Logs
4. [ ] Check Vercel logs for webhook errors
5. [ ] Verify HTTPS enabled on domain

**Solution**: Polling fallback should work automatically

### Code Not Generated

**Symptoms**: Payment paid but activation_key_id is null

**Checks**:
1. [ ] Check Vercel logs for errors
2. [ ] Check Supabase logs
3. [ ] Verify `process_successful_payment()` function exists
4. [ ] Check RLS policies on `activation_keys` table

**Solution**: Run SQL manually:
```sql
SELECT process_successful_payment('checkout_id_here');
```

### Webhook Signature Invalid

**Symptoms**: Webhook returns 401 Unauthorized

**Checks**:
1. [ ] Webhook secret matches Chargily Dashboard?
2. [ ] Environment variable set correctly?
3. [ ] No extra spaces in secret?

**Solution**: Copy webhook secret again from Chargily Dashboard

### Rate Limit Errors

**Symptoms**: "Too many requests" error

**Checks**:
1. [ ] User refreshing success page too much?
2. [ ] Bot attacking endpoint?

**Solution**: Rate limits will reset automatically

---

## 📊 Success Metrics

After 1 week, you should see:
- ✅ Payment success rate: >95%
- ✅ Webhook delivery rate: >99%
- ✅ Average code generation time: <5 seconds
- ✅ Zero duplicate codes
- ✅ Zero lost payments

---

## 🚨 Emergency Contacts

### If Critical Issue:
1. **Disable payments temporarily**:
   - Remove buy page link from app
   - Add maintenance message

2. **Check logs**:
   - Vercel: `vercel logs`
   - Supabase: Dashboard → Logs
   - Chargily: Dashboard → Webhooks → Logs

3. **Rollback if needed**:
   - Revert to previous Vercel deployment
   - Keep database as-is (no data loss)

### Chargily Support:
- Email: support@chargily.com
- Dashboard: Help → Contact Support

---

## ✅ Launch Complete!

Once all checklist items are complete:
- [ ] Announce payment feature to users
- [ ] Monitor closely for first week
- [ ] Collect user feedback
- [ ] Iterate and improve

**Congratulations! Your payment system is live! 🎉**

---

## 📚 Additional Resources

- [Chargily API Documentation](https://dev.chargily.com/pay-v2/)
- [Integration Guide](./CHARGILY_INTEGRATION.md)
- [Production Readiness Assessment](./CHARGILY_PRODUCTION_READINESS.md)
- [Security Audit](../db-interface/SECURITY_AUDIT.md)
