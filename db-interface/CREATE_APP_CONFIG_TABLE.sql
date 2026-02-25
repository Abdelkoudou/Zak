-- Create app_config table for dynamic settings
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Policy: Read access for everyone (or authenticated users)
CREATE POLICY "Allow read access for all users" ON app_config FOR SELECT USING (true);

-- Policy: Update access for owners only
CREATE POLICY "Allow update for owners" ON app_config FOR UPDATE USING (
  exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.role = 'owner'
  )
);

-- Policy: Insert access for owners only
CREATE POLICY "Allow insert for owners" ON app_config FOR INSERT WITH CHECK (
  exists (
    select 1 from public.users 
    where users.id = auth.uid() and users.role = 'owner'
  )
);

-- Insert initial value for 1 year subscription
INSERT INTO app_config (key, value, description) 
VALUES ('chargily_price_365', '1000', 'Price for 1 year subscription in DZD') 
ON CONFLICT (key) DO NOTHING;
