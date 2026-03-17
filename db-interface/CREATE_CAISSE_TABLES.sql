-- ============================================================================
-- CAISSE (Financial Tracking) Tables
-- ============================================================================
-- Run this migration in your Supabase SQL Editor
-- Creates: caisse_transactions, caisse_checkouts + RLS + indexes
-- ============================================================================

-- ============================================================================
-- 1. caisse_transactions — Every income or expense entry
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caisse_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category text NOT NULL,
    amount numeric(12, 2) NOT NULL CHECK (amount > 0),
    description text,
    reference_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraint for valid categories
ALTER TABLE public.caisse_transactions
ADD CONSTRAINT caisse_transactions_category_check CHECK (
    (
        type = 'income'
        AND category IN (
            'online',
            'cash',
            'point_de_vente',
            'renewal',
            'other'
        )
    )
    OR (
        type = 'expense'
        AND category IN (
            'rent',
            'server',
            'marketing',
            'salaries',
            'supplies',
            'transport',
            'food',
            'printing',
            'other'
        )
    )
);

-- Add constraint for description max length
ALTER TABLE public.caisse_transactions
ADD CONSTRAINT caisse_transactions_description_length CHECK (
    description IS NULL
    OR char_length(description) <= 500
);

COMMENT ON
TABLE public.caisse_transactions IS 'Manual financial ledger entries (income/expenses) for the owner caisse';

COMMENT ON COLUMN public.caisse_transactions.type IS 'Transaction direction: income or expense';

COMMENT ON COLUMN public.caisse_transactions.category IS 'Income: online, cash, point_de_vente, renewal, other. Expense: rent, server, marketing, salaries, supplies, transport, food, printing, other';

COMMENT ON COLUMN public.caisse_transactions.reference_id IS 'Optional link to online_payment or activation_key ID for tracing';

-- ============================================================================
-- 2. caisse_checkouts — Periodic withdrawal snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caisse_checkouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL DEFAULT now(),
    total_income numeric(12, 2) NOT NULL DEFAULT 0,
    total_expenses numeric(12, 2) NOT NULL DEFAULT 0,
    net_amount numeric(12, 2) NOT NULL DEFAULT 0,
    amount_withdrawn numeric(12, 2) NOT NULL CHECK (amount_withdrawn >= 0),
    notes text,
    is_voided boolean NOT NULL DEFAULT false,
    voided_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
);

COMMENT ON
TABLE public.caisse_checkouts IS 'Periodic cash-out snapshots when the owner withdraws from la caisse';

COMMENT ON COLUMN public.caisse_checkouts.period_start IS 'Start of the checkout period (last checkout date or first transaction)';

COMMENT ON COLUMN public.caisse_checkouts.period_end IS 'End of the checkout period (when this checkout was made)';

COMMENT ON COLUMN public.caisse_checkouts.amount_withdrawn IS 'Actual amount withdrawn (may differ from net_amount)';

COMMENT ON COLUMN public.caisse_checkouts.is_voided IS 'Soft-void flag instead of hard delete';

-- ============================================================================
-- 3. Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_caisse_transactions_created_at ON public.caisse_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_caisse_transactions_type
  ON public.caisse_transactions (type);

CREATE INDEX IF NOT EXISTS idx_caisse_transactions_created_by ON public.caisse_transactions (created_by);

CREATE INDEX IF NOT EXISTS idx_caisse_checkouts_created_at ON public.caisse_checkouts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_caisse_checkouts_created_by ON public.caisse_checkouts (created_by);

-- ============================================================================
-- 4. RLS Policies — Owner only
-- ============================================================================

-- Enable RLS
ALTER TABLE public.caisse_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.caisse_checkouts ENABLE ROW LEVEL SECURITY;

-- caisse_transactions: Owner can do everything
CREATE POLICY "Owner can view caisse transactions" ON public.caisse_transactions FOR
SELECT USING (public.is_owner ());

CREATE POLICY "Owner can insert caisse transactions" ON public.caisse_transactions FOR
INSERT
WITH
    CHECK (
        public.is_owner ()
        AND auth.uid () = created_by
    );

CREATE POLICY "Owner can update caisse transactions" ON public.caisse_transactions FOR
UPDATE USING (public.is_owner ())
WITH
    CHECK (public.is_owner ());

CREATE POLICY "Owner can delete caisse transactions" ON public.caisse_transactions FOR DELETE USING (public.is_owner ());

-- caisse_checkouts: Owner can view, insert, and update (for voiding)
CREATE POLICY "Owner can view caisse checkouts" ON public.caisse_checkouts FOR
SELECT USING (public.is_owner ());

CREATE POLICY "Owner can insert caisse checkouts" ON public.caisse_checkouts FOR
INSERT
WITH
    CHECK (
        public.is_owner ()
        AND auth.uid () = created_by
    );

CREATE POLICY "Owner can update caisse checkouts" ON public.caisse_checkouts FOR
UPDATE USING (public.is_owner ())
WITH
    CHECK (public.is_owner ());

-- ============================================================================
-- 5. Trigger to auto-update updated_at on transactions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_caisse_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_caisse_transaction_updated_at
  BEFORE UPDATE ON public.caisse_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_caisse_transaction_updated_at();

-- ============================================================================
-- Done! Tables ready for use.
-- ============================================================================