-- Migration 001: Initial schema creation

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  config JSONB NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]',
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  android_session_id VARCHAR(255),
  ios_session_id VARCHAR(255),
  logs JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('android', 'ios')),
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  referrer VARCHAR(255),
  payload JSONB NOT NULL,
  raw TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON test_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_session_id ON logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_event_name ON logs(event_name);
CREATE INDEX IF NOT EXISTS idx_logs_platform ON logs(platform);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial') ON CONFLICT DO NOTHING;

COMMIT;
