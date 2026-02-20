-- ============================================================================
-- Migration: Dynamic Subscription Plans
-- ============================================================================
-- Replaces the hardcoded single plan with a flexible table where the owner
-- can create, edit, toggle, and delete subscription plans.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create subscription_plans table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL, -- e.g. "2 Mois", "1 An"
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price INTEGER NOT NULL CHECK (price > 0), -- Amount in DZD (whole dinars)
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans (is_active);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON public.subscription_plans (sort_order);

-- ============================================================================
-- STEP 3: Updated_at trigger
-- ============================================================================
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: RLS Policies
-- ============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read active plans (the buy page needs this)
CREATE POLICY "Anyone can read subscription plans" ON public.subscription_plans FOR
SELECT USING (true);

-- Only owners can insert
CREATE POLICY "Owners can create plans" ON public.subscription_plans FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE
                users.id = auth.uid ()
                AND users.role = 'owner'
        )
    );

-- Only owners can update
CREATE POLICY "Owners can update plans" ON public.subscription_plans FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE
            users.id = auth.uid ()
            AND users.role = 'owner'
    )
);

-- Only owners can delete
CREATE POLICY "Owners can delete plans" ON public.subscription_plans FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE
            users.id = auth.uid ()
            AND users.role = 'owner'
    )
);

-- ============================================================================
-- STEP 5: Seed initial plans
-- ============================================================================
INSERT INTO
    public.subscription_plans (
        name,
        duration_days,
        price,
        is_active,
        sort_order,
        is_featured,
        description
    )
VALUES (
        '2 Mois',
        60,
        500,
        true,
        1,
        false,
        'Accès pendant 2 mois'
    ),
    (
        '1 An',
        365,
        1000,
        true,
        2,
        true,
        'Accès pendant 1 an — Meilleure offre'
    ) ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: Comments
-- ============================================================================
COMMENT ON
TABLE public.subscription_plans IS 'Dynamic subscription plans configurable by the owner from the admin settings page';

COMMENT ON COLUMN public.subscription_plans.duration_days IS 'Number of days the subscription lasts (owner sets freely)';

COMMENT ON COLUMN public.subscription_plans.price IS 'Price in DZD (whole dinars, not centimes)';

COMMENT ON COLUMN public.subscription_plans.is_active IS 'Whether this plan is shown on the buy page';

COMMENT ON COLUMN public.subscription_plans.is_featured IS 'Whether to show a highlight badge on the buy page';