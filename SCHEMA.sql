-- Equipment table
CREATE TABLE equipment (
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
CREATE TABLE comments (
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

CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON equipment
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Security Policies for Equipment
CREATE POLICY "Allow authenticated users to read equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete equipment"
  ON equipment FOR DELETE
  TO authenticated
  USING (true);

-- Security Policies for Comments
CREATE POLICY "Allow authenticated users to read comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Status Logs table (periodic condition snapshots)
-- Run this block in Supabase SQL Editor to enable the feature
-- ============================================================
CREATE TABLE status_logs (
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
CREATE POLICY "Allow authenticated users to read status_logs"
  ON status_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert status_logs"
  ON status_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
