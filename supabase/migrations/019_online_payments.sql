-- ============================================================================
-- Migration: Online Payments with Chargily Pay Integration
-- ============================================================================
-- This migration adds support for online payments via Chargily Pay gateway.
-- When a payment is successful, an activation code is auto-generated and
-- linked to the payment for tracking.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Payment Status Enum
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'canceled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_source AS ENUM ('manual', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Create Online Payments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.online_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Chargily identifiers
  checkout_id TEXT UNIQUE NOT NULL,  -- Chargily checkout ID
  invoice_id TEXT,                    -- Chargily invoice ID (after payment)
  
  -- Customer info (from Chargily or user input)
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Payment details
  amount INTEGER NOT NULL,            -- Amount in smallest unit (centimes)
  currency TEXT NOT NULL DEFAULT 'dzd',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,                -- CIB, EDAHABIA, etc.
  
  -- Subscription details
  duration_days INTEGER NOT NULL DEFAULT 365,
  
  -- Links
  activation_key_id UUID REFERENCES public.activation_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- If user exists
  
  -- URLs
  checkout_url TEXT,
  success_url TEXT,
  failure_url TEXT,
  
  -- Metadata and audit
  metadata JSONB,                     -- Custom data passed during checkout creation
  webhook_payload JSONB,              -- Full webhook payload for audit
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Add Payment Reference to Activation Keys
-- ============================================================================
ALTER TABLE public.activation_keys
  ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.online_payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_source payment_source DEFAULT 'manual';

-- ============================================================================
-- STEP 4: Create Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_online_payments_checkout_id ON public.online_payments(checkout_id);
CREATE INDEX IF NOT EXISTS idx_online_payments_customer_email ON public.online_payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_online_payments_status ON public.online_payments(status);
CREATE INDEX IF NOT EXISTS idx_online_payments_created_at ON public.online_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_online_payments_paid_at ON public.online_payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_activation_keys_payment_id ON public.activation_keys(payment_id);
CREATE INDEX IF NOT EXISTS idx_activation_keys_payment_source ON public.activation_keys(payment_source);

-- ============================================================================
-- STEP 5: Create Updated_at Trigger
-- ============================================================================
CREATE TRIGGER update_online_payments_updated_at
  BEFORE UPDATE ON public.online_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: RLS Policies for Online Payments
-- ============================================================================
ALTER TABLE public.online_payments ENABLE ROW LEVEL SECURITY;

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.online_payments FOR SELECT
  USING (is_admin_or_higher());

-- Admins can insert payments (for creating checkouts)
CREATE POLICY "Admins can create payments"
  ON public.online_payments FOR INSERT
  WITH CHECK (is_admin_or_higher());

-- System can update payments (for webhooks - using service role)
CREATE POLICY "System can update payments"
  ON public.online_payments FOR UPDATE
  USING (TRUE);

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.online_payments FOR SELECT
  USING (
    customer_email = (SELECT email FROM public.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- ============================================================================
-- STEP 7: Function to Process Successful Payment
-- ============================================================================
CREATE OR REPLACE FUNCTION process_successful_payment(
  p_checkout_id TEXT,
  p_invoice_id TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_webhook_payload JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_key_code TEXT;
  v_key_id UUID;
  v_result JSONB;
BEGIN
  -- Get the payment record
  SELECT * INTO v_payment
  FROM public.online_payments
  WHERE checkout_id = p_checkout_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Payment not found'
    );
  END IF;
  
  -- Check if already processed
  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Payment already processed',
      'activation_key_id', v_payment.activation_key_id
    );
  END IF;
  
  -- Generate activation code
  -- Format: PAY-{RANDOM8}-{CHECKSUM2}
  v_key_code := 'PAY-' || 
    upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)) ||
    '-' ||
    upper(substring(md5(random()::text) from 1 for 2));
  
  -- Create activation key
  INSERT INTO public.activation_keys (
    key_code,
    duration_days,
    payment_source,
    notes,
    price_paid
  ) VALUES (
    v_key_code,
    v_payment.duration_days,
    'online',
    'Auto-generated from online payment: ' || p_checkout_id,
    v_payment.amount::decimal / 100  -- Convert from centimes
  )
  RETURNING id INTO v_key_id;
  
  -- Update payment record
  UPDATE public.online_payments
  SET 
    status = 'paid',
    invoice_id = p_invoice_id,
    payment_method = p_payment_method,
    webhook_payload = p_webhook_payload,
    activation_key_id = v_key_id,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE checkout_id = p_checkout_id;
  
  -- Update activation key with payment reference
  UPDATE public.activation_keys
  SET payment_id = v_payment.id
  WHERE id = v_key_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Payment processed successfully',
    'activation_key_id', v_key_id,
    'key_code', v_key_code,
    'customer_email', v_payment.customer_email
  );
END;
$$;

-- ============================================================================
-- STEP 8: Function to Create Payment Record
-- ============================================================================
CREATE OR REPLACE FUNCTION create_payment_record(
  p_checkout_id TEXT,
  p_customer_email TEXT,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT 500000,  -- 5000 DZD in centimes
  p_currency TEXT DEFAULT 'dzd',
  p_duration_days INTEGER DEFAULT 365,
  p_checkout_url TEXT DEFAULT NULL,
  p_success_url TEXT DEFAULT NULL,
  p_failure_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  INSERT INTO public.online_payments (
    checkout_id,
    customer_email,
    customer_name,
    customer_phone,
    amount,
    currency,
    duration_days,
    checkout_url,
    success_url,
    failure_url,
    metadata,
    status
  ) VALUES (
    p_checkout_id,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_amount,
    p_currency,
    p_duration_days,
    p_checkout_url,
    p_success_url,
    p_failure_url,
    p_metadata,
    'pending'
  )
  RETURNING id INTO v_payment_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'payment_id', v_payment_id
  );
END;
$$;

-- ============================================================================
-- STEP 9: View for Payment Statistics
-- ============================================================================
CREATE OR REPLACE VIEW public.online_payment_stats AS
SELECT
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'paid') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_payments,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as total_revenue_centimes,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) / 100.0 as total_revenue,
  COUNT(DISTINCT customer_email) FILTER (WHERE status = 'paid') as unique_customers,
  MAX(paid_at) as last_payment_at
FROM public.online_payments;

-- Grant access to the view
GRANT SELECT ON public.online_payment_stats TO authenticated;

-- ============================================================================
-- STEP 10: Comments
-- ============================================================================
COMMENT ON TABLE public.online_payments IS 'Tracks online payments via Chargily Pay gateway';
COMMENT ON COLUMN public.online_payments.checkout_id IS 'Unique Chargily checkout ID';
COMMENT ON COLUMN public.online_payments.amount IS 'Amount in smallest currency unit (centimes for DZD)';
COMMENT ON COLUMN public.online_payments.activation_key_id IS 'Auto-generated activation key after successful payment';
COMMENT ON FUNCTION process_successful_payment IS 'Called by webhook to process successful payment and generate activation key';
COMMENT ON FUNCTION create_payment_record IS 'Creates a pending payment record when checkout is initiated';
