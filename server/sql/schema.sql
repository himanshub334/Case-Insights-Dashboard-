CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  imported_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  case_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (length(status) BETWEEN 1 AND 40),
  priority TEXT NOT NULL CHECK (length(priority) BETWEEN 1 AND 20),
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  resolution_hours NUMERIC(12,2),
  satisfaction NUMERIC(3,2) CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
  amount NUMERIC(14,2),
  inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner);
