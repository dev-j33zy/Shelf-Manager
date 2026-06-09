-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  control_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  quality TEXT CHECK (quality IN ('New', 'Good', 'Fair', 'Poor', 'Broken')) DEFAULT 'New',
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON equipment
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS) - safe to run multiple times
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Security Policies for Equipment
DROP POLICY IF EXISTS "Allow authenticated users to read equipment" ON equipment;
CREATE POLICY "Allow authenticated users to read equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert equipment" ON equipment;
CREATE POLICY "Allow authenticated users to insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update equipment" ON equipment;
CREATE POLICY "Allow authenticated users to update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete equipment" ON equipment;
CREATE POLICY "Allow authenticated users to delete equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (true);

-- Security Policies for Comments
DROP POLICY IF EXISTS "Allow authenticated users to read comments" ON comments;
CREATE POLICY "Allow authenticated users to read comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert comments" ON comments;
CREATE POLICY "Allow authenticated users to insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Status Logs table (periodic condition snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  quality TEXT CHECK (quality IN ('New', 'Good', 'Fair', 'Poor', 'Broken')) NOT NULL,
  notes TEXT DEFAULT '',
  recorded_by TEXT DEFAULT 'Anonymous',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;

-- Security Policies for Status Logs
DROP POLICY IF EXISTS "Allow authenticated users to read status_logs" ON status_logs;
CREATE POLICY "Allow authenticated users to read status_logs"
  ON status_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert status_logs" ON status_logs;
CREATE POLICY "Allow authenticated users to insert status_logs"
  ON status_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Audit Sessions table (groups scans into an audit event)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  audited_by TEXT DEFAULT 'Anonymous',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

-- Security Policies for Audit Sessions
DROP POLICY IF EXISTS "Allow authenticated users to read audit_sessions" ON audit_sessions;
CREATE POLICY "Allow authenticated users to read audit_sessions"
  ON audit_sessions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert audit_sessions" ON audit_sessions;
CREATE POLICY "Allow authenticated users to insert audit_sessions"
  ON audit_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update audit_sessions" ON audit_sessions;
CREATE POLICY "Allow authenticated users to update audit_sessions"
  ON audit_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete audit_sessions" ON audit_sessions;
CREATE POLICY "Allow authenticated users to delete audit_sessions"
  ON audit_sessions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- Audit Records table (individual scanned items during audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  control_number TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  quality TEXT CHECK (quality IN ('New', 'Good', 'Fair', 'Poor', 'Broken')) NOT NULL,
  notes TEXT DEFAULT '',
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;

-- Security Policies for Audit Records
DROP POLICY IF EXISTS "Allow authenticated users to read audit_records" ON audit_records;
CREATE POLICY "Allow authenticated users to read audit_records"
  ON audit_records FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert audit_records" ON audit_records;
CREATE POLICY "Allow authenticated users to insert audit_records"
  ON audit_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- App Settings table (global settings for all users)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  church_name TEXT NOT NULL DEFAULT 'Property of UCCP Sukat Evangelical Church',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read app_settings" ON app_settings;
CREATE POLICY "Allow authenticated users to read app_settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert app_settings" ON app_settings;
CREATE POLICY "Allow authenticated users to insert app_settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update app_settings" ON app_settings;
CREATE POLICY "Allow authenticated users to update app_settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
