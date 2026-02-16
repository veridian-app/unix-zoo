-- ============================================
-- Unix Zoo — Supabase Tables Setup
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mdfakmubzeufepdaheru/sql/new

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  name text NOT NULL,
  animal text NOT NULL,
  coins integer DEFAULT 50,
  pet_hunger integer DEFAULT 80,
  pet_happiness integer DEFAULT 80,
  pet_owned_food jsonb DEFAULT '[]'::jsonb,
  pet_owned_accessories jsonb DEFAULT '[]'::jsonb,
  pet_equipped_hat text,
  pet_equipped_accessory text,
  pet_last_fed_at timestamptz
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  objective_id text,
  assigned_to text NOT NULL REFERENCES members(id),
  assigned_by text NOT NULL REFERENCES members(id),
  deadline timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  completed_at timestamptz,
  estimated_hours real,
  tracked_time_seconds integer DEFAULT 0,
  tracking_started_at timestamptz,
  locked boolean DEFAULT false,
  moved_deadline boolean DEFAULT false
);

-- Objectives table
CREATE TABLE IF NOT EXISTS objectives (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  deadline timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by text NOT NULL REFERENCES members(id),
  assigned_to text NOT NULL REFERENCES members(id),
  task_ids jsonb DEFAULT '[]'::jsonb,
  completed boolean DEFAULT false,
  completed_at timestamptz
);

-- Weekly records table
CREATE TABLE IF NOT EXISTS weekly_records (
  id text PRIMARY KEY,
  week_start timestamptz NOT NULL,
  week_end timestamptz NOT NULL,
  closed_at timestamptz DEFAULT now(),
  member_stats jsonb NOT NULL,
  top_performer text REFERENCES members(id),
  team_completion_rate integer DEFAULT 0
);

-- RLS policies (allow all - team app, no auth)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for objectives" ON objectives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for weekly_records" ON weekly_records FOR ALL USING (true) WITH CHECK (true);

-- Seed team members
INSERT INTO members (id, name, animal, coins) VALUES
  ('pedro', 'Pedro', 'dolphin', 50),
  ('nahuel', 'Nahuel', 'tiger', 50),
  ('firu', 'Firu', 'monkey', 50),
  ('adri', 'Adri', 'squirrel', 50),
  ('marta', 'Marta', 'koala', 50),
  ('xuso', 'Xuso', 'giraffe', 50),
  ('elena', 'Elena', 'lioness', 50),
  ('lorena', 'Lorena', 'leopard', 50),
  ('sara', 'Sara', 'cat', 50),
  ('lucas', 'Lucas', 'kangaroo', 50)
ON CONFLICT (id) DO NOTHING;
