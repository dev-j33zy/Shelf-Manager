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
