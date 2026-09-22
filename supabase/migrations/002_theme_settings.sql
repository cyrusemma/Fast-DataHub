-- Platform-wide default theme (only 1 row, managed by Super Admin)
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform theme
INSERT INTO platform_settings (key, value) 
VALUES ('theme', '{"mode":"light","palette":"default","primaryColor":null,"accentColor":null}')
ON CONFLICT (key) DO NOTHING;

-- Add agent_theme column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS agent_theme JSONB DEFAULT NULL;

-- RLS: only admins can update platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can manage platform settings"
    ON platform_settings FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SUPER_ADMIN', 'NETWORK_ADMIN')
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can read platform settings"
    ON platform_settings FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;
