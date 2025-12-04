-- ============================================================================
-- Migration: Extended Activation Keys System
-- ============================================================================
-- This migration extends the activation_keys table to support:
-- 1. Year targeting (1, 2, 3)
-- 2. Faculty tracking
-- 3. Point de vente (sales point) tracking
-- 4. Expiration dates for codes
-- 5. Batch generation tracking
-- 6. Analytics and dashboard support
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Sales Points Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sales_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,  -- Short code like 'ALG01', 'ORA02'
  name TEXT NOT NULL,
  location TEXT,  -- City/Region
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate DECIMAL(5,2) DEFAULT 0,  -- Percentage
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create Faculties Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.faculties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,  -- Short code like 'MA', 'PC', 'DA'
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  specialities TEXT[] DEFAULT ARRAY['Médecine', 'Pharmacie', 'Dentaire'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Extend Activation Keys Table
-- ============================================================================

-- Add new columns to activation_keys
ALTER TABLE public.activation_keys
  ADD COLUMN IF NOT EXISTS year year_level,
  ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sales_point_id UUID REFERENCES public.sales_points(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS generation_params JSONB;  -- Store generation parameters for audit

-- ============================================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_activation_keys_year ON public.activation_keys(year);
CREATE INDEX IF NOT EXISTS idx_activation_keys_faculty ON public.activation_keys(faculty_id);
CREATE INDEX IF NOT EXISTS idx_activation_keys_sales_point ON public.activation_keys(sales_point_id);
CREATE INDEX IF NOT EXISTS idx_activation_keys_batch ON public.activation_keys(batch_id);
CREATE INDEX IF NOT EXISTS idx_activation_keys_expires ON public.activation_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_keys_is_used ON public.activation_keys(is_used);
CREATE INDEX IF NOT EXISTS idx_activation_keys_created_at ON public.activation_keys(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_points_code ON public.sales_points(code);
CREATE INDEX IF NOT EXISTS idx_sales_points_is_active ON public.sales_points(is_active);

CREATE INDEX IF NOT EXISTS idx_faculties_code ON public.faculties(code);
CREATE INDEX IF NOT EXISTS idx_faculties_is_active ON public.faculties(is_active);

-- ============================================================================
-- STEP 5: Insert Default Faculties (Algerian Medical Schools)
-- ============================================================================
INSERT INTO public.faculties (code, name, city, specialities) VALUES
  ('MA', 'Faculté de Médecine d''Alger', 'Alger', ARRAY['Médecine', 'Pharmacie', 'Dentaire']),
  ('MO', 'Faculté de Médecine d''Oran', 'Oran', ARRAY['Médecine', 'Pharmacie', 'Dentaire']),
  ('MC', 'Faculté de Médecine de Constantine', 'Constantine', ARRAY['Médecine', 'Pharmacie', 'Dentaire']),
  ('MB', 'Faculté de Médecine de Blida', 'Blida', ARRAY['Médecine']),
  ('MT', 'Faculté de Médecine de Tlemcen', 'Tlemcen', ARRAY['Médecine', 'Pharmacie', 'Dentaire']),
  ('MS', 'Faculté de Médecine de Sétif', 'Sétif', ARRAY['Médecine']),
  ('MAN', 'Faculté de Médecine d''Annaba', 'Annaba', ARRAY['Médecine', 'Pharmacie', 'Dentaire']),
  ('MBT', 'Faculté de Médecine de Batna', 'Batna', ARRAY['Médecine']),
  ('MBJ', 'Faculté de Médecine de Béjaïa', 'Béjaïa', ARRAY['Médecine']),
  ('MSK', 'Faculté de Médecine de Sidi Bel Abbès', 'Sidi Bel Abbès', ARRAY['Médecine']),
  ('MMO', 'Faculté de Médecine de Mostaganem', 'Mostaganem', ARRAY['Médecine']),
  ('MTZ', 'Faculté de Médecine de Tizi Ouzou', 'Tizi Ouzou', ARRAY['Médecine'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 6: Create Updated_at Trigger for New Tables
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sales_points_updated_at ON public.sales_points;
CREATE TRIGGER update_sales_points_updated_at
  BEFORE UPDATE ON public.sales_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculties_updated_at ON public.faculties;
CREATE TRIGGER update_faculties_updated_at
  BEFORE UPDATE ON public.faculties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 7: RLS Policies for New Tables
-- ============================================================================

-- Enable RLS
ALTER TABLE public.sales_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

-- Sales Points: Only owner can manage
DROP POLICY IF EXISTS "Owner can manage sales points" ON public.sales_points;
CREATE POLICY "Owner can manage sales points"
  ON public.sales_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Faculties: Everyone can view, only owner can modify
DROP POLICY IF EXISTS "Everyone can view faculties" ON public.faculties;
CREATE POLICY "Everyone can view faculties"
  ON public.faculties FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Owner can modify faculties" ON public.faculties;
CREATE POLICY "Owner can modify faculties"
  ON public.faculties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- STEP 7b: Note about Users RLS
-- ============================================================================
-- The existing RLS policies in rls-policies.sql already handle user access:
-- - "Users can view own profile" - allows users to see their own row
-- - "Admins can view all users" - allows admins/owners to see all users
-- 
-- We don't need to add additional policies here.
-- If you're having issues viewing user data, ensure rls-policies.sql was applied.
-- ============================================================================

-- ============================================================================
-- STEP 7c: Update activation_keys policies
-- ============================================================================

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can create keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins can view all keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can view unused keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can create keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can view all keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can update keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner can delete keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Owner full access to activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Admins can manage activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "Users can view activation keys" ON public.activation_keys;
DROP POLICY IF EXISTS "System can update keys" ON public.activation_keys;
DROP POLICY IF EXISTS "System can update keys on activation" ON public.activation_keys;

-- Owner can do everything with activation keys
CREATE POLICY "Owner full access to activation keys"
  ON public.activation_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Admins can view and create keys
CREATE POLICY "Admins can manage activation keys"
  ON public.activation_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Users can view unused keys (to activate) or their own used keys
CREATE POLICY "Users can view activation keys"
  ON public.activation_keys FOR SELECT
  USING (
    is_used = FALSE 
    OR used_by = auth.uid()
  );

-- ============================================================================
-- STEP 8: Analytics Views
-- ============================================================================

-- View for sales point performance
CREATE OR REPLACE VIEW public.sales_point_stats AS
SELECT 
  sp.id,
  sp.code,
  sp.name,
  sp.location,
  COUNT(ak.id) AS total_codes,
  COUNT(CASE WHEN ak.is_used THEN 1 END) AS used_codes,
  COUNT(CASE WHEN NOT ak.is_used AND (ak.expires_at IS NULL OR ak.expires_at > NOW()) THEN 1 END) AS active_codes,
  COUNT(CASE WHEN ak.expires_at < NOW() AND NOT ak.is_used THEN 1 END) AS expired_codes,
  COALESCE(SUM(ak.price_paid), 0) AS total_revenue,
  MAX(ak.used_at) AS last_sale_at
FROM public.sales_points sp
LEFT JOIN public.activation_keys ak ON ak.sales_point_id = sp.id
GROUP BY sp.id, sp.code, sp.name, sp.location;

-- View for faculty distribution
CREATE OR REPLACE VIEW public.faculty_stats AS
SELECT 
  f.id,
  f.code,
  f.name,
  f.city,
  COUNT(ak.id) AS total_codes,
  COUNT(CASE WHEN ak.is_used THEN 1 END) AS used_codes,
  COUNT(CASE WHEN ak.year = '1' THEN 1 END) AS year_1_codes,
  COUNT(CASE WHEN ak.year = '2' THEN 1 END) AS year_2_codes,
  COUNT(CASE WHEN ak.year = '3' THEN 1 END) AS year_3_codes
FROM public.faculties f
LEFT JOIN public.activation_keys ak ON ak.faculty_id = f.id
GROUP BY f.id, f.code, f.name, f.city;

-- ============================================================================
-- STEP 9: Create view for activation keys with user info
-- ============================================================================

-- This view joins activation_keys with users to show who used each code
-- Used by the db-interface dashboard to display user information
CREATE OR REPLACE VIEW public.activation_keys_with_users AS
SELECT 
  ak.*,
  u.email AS user_email,
  u.full_name AS user_full_name,
  u.speciality AS user_speciality,
  u.year_of_study AS user_year_of_study,
  u.region AS user_region,
  f.name AS faculty_name,
  f.city AS faculty_city,
  sp.name AS sales_point_name,
  sp.location AS sales_point_location
FROM public.activation_keys ak
LEFT JOIN public.users u ON ak.used_by = u.id
LEFT JOIN public.faculties f ON ak.faculty_id = f.id
LEFT JOIN public.sales_points sp ON ak.sales_point_id = sp.id;

-- Grant access to the view
GRANT SELECT ON public.activation_keys_with_users TO authenticated;

-- ============================================================================
-- STEP 10: Ensure System can update keys when activated
-- ============================================================================

-- This policy allows the activate_subscription function to update keys
DROP POLICY IF EXISTS "System can update keys" ON public.activation_keys;
CREATE POLICY "System can update keys on activation"
  ON public.activation_keys FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- DONE
-- ============================================================================
SELECT '✅ Extended activation keys schema created successfully' AS status;

-- ============================================================================
-- NOTES FOR DB-INTERFACE:
-- ============================================================================
-- The db-interface fetches activation keys and then separately fetches
-- user data for used codes. This is because:
-- 1. RLS policies may restrict direct joins
-- 2. Supabase PostgREST FK naming can be unpredictable
-- 
-- The activation_keys_with_users view can be used as an alternative
-- if direct queries are needed.
-- ============================================================================
