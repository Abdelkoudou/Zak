-- ============================================================================
-- Migration: Admin Payments
-- ============================================================================
-- This migration adds support for tracking payments to admins and calculating
-- what is owed based on contributions since the last payment.
-- ============================================================================

-- Step 1: Create admin_payments table
CREATE TABLE IF NOT EXISTS public.admin_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS on admin_payments
ALTER TABLE public.admin_payments ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
-- Owners can do everything
CREATE POLICY "Owners can view all payments" ON public.admin_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners can insert payments" ON public.admin_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'owner')
  );

-- Admins can view their own payments
CREATE POLICY "Admins can view their own payments" ON public.admin_payments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Step 4: Create function to get payable stats
-- This calculates metrics *since the last payment* for each admin
CREATE OR REPLACE FUNCTION public.get_admin_payable_stats()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  last_payment_date TIMESTAMPTZ,
  payable_questions BIGINT,
  payable_resources BIGINT,
  total_payable_contributions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH last_payments AS (
    SELECT 
      ap.user_id,
      MAX(ap.payment_date) as last_payment_at
    FROM public.admin_payments ap
    GROUP BY ap.user_id
  )
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    lp.last_payment_at as last_payment_date,
    -- Count questions created AFTER the last payment date (or all time if no payment)
    COALESCE(q.new_question_count, 0) as payable_questions,
    -- Count resources created AFTER the last payment date (or all time if no payment)
    COALESCE(r.new_resource_count, 0) as payable_resources,
    COALESCE(q.new_question_count, 0) + COALESCE(r.new_resource_count, 0) as total_payable_contributions
  FROM public.users u
  LEFT JOIN last_payments lp ON u.id = lp.user_id
  LEFT JOIN (
    SELECT 
      q_sub.created_by,
      COUNT(*) as new_question_count
    FROM public.questions q_sub
    LEFT JOIN last_payments lp_sub ON q_sub.created_by = lp_sub.user_id
    WHERE q_sub.created_by IS NOT NULL
      -- If there is a last payment, only count items newer than it.
      -- If no last payment (lp_sub.last_payment_at IS NULL), count everything.
      AND (lp_sub.last_payment_at IS NULL OR q_sub.created_at > lp_sub.last_payment_at)
    GROUP BY q_sub.created_by
  ) q ON u.id = q.created_by
  LEFT JOIN (
    SELECT 
      r_sub.created_by,
      COUNT(*) as new_resource_count
    FROM public.course_resources r_sub
    LEFT JOIN last_payments lp_sub ON r_sub.created_by = lp_sub.user_id
    WHERE r_sub.created_by IS NOT NULL
      AND (lp_sub.last_payment_at IS NULL OR r_sub.created_at > lp_sub.last_payment_at)
    GROUP BY r_sub.created_by
  ) r ON u.id = r.created_by
  WHERE u.role IN ('admin', 'manager', 'owner')
  -- Only show admins who have contributed or been paid before (optional, but cleaner)
    AND (q.new_question_count > 0 OR r.new_resource_count > 0 OR lp.last_payment_at IS NOT NULL)
  ORDER BY lp.last_payment_at ASC NULLS FIRST, total_payable_contributions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant permissions
GRANT SELECT, INSERT ON public.admin_payments TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payable_stats TO authenticated;

-- Step 6: Documentation
COMMENT ON TABLE public.admin_payments IS 'Tracks payments made to admins for their contributions';
COMMENT ON FUNCTION public.get_admin_payable_stats IS 'Returns contribution statistics calculated since the last registered payment for each admin';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Admin Payments migration ready.';
  RAISE NOTICE 'Created: table admin_payments, function get_admin_payable_stats';
END $$;
