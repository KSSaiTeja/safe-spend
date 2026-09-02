-- SUPABASE / POSTGRESQL FREE DATABASE SCHEMA FOR SAFESPEND
-- Copy and paste this script into Supabase SQL Editor (https://supabase.com)

CREATE TABLE IF NOT EXISTS spends (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  card_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expected_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'expected',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public Policies for seamless API access
ALTER TABLE spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access spends" ON spends FOR ALL USING (true);
CREATE POLICY "Public full access incomes" ON incomes FOR ALL USING (true);
