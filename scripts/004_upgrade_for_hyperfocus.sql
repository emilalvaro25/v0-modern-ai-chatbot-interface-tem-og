-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add role constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'ey_tester', 'admin'));
  END IF;
END $$;

-- Update sessions table structure
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create voice_sessions table first (before indexes)
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcript TEXT,
  duration_ms INTEGER,
  language VARCHAR(10) DEFAULT 'en-US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create llm_benchmarks table
CREATE TABLE IF NOT EXISTS llm_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  latency_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  energy_usage_mwh DECIMAL(10, 4),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create system_monitoring table
CREATE TABLE IF NOT EXISTS system_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('healthy', 'degraded', 'down')),
  cpu_usage DECIMAL(5, 2),
  memory_usage DECIMAL(5, 2),
  response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) CHECK (status IN ('success', 'failure', 'warning')),
  details JSONB DEFAULT '{}'::jsonb
);

-- Create encryption_keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id VARCHAR(100) UNIQUE NOT NULL,
  algorithm VARCHAR(50) NOT NULL,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_conversation_id ON voice_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_llm_benchmarks_model ON llm_benchmarks(model);
CREATE INDEX IF NOT EXISTS idx_llm_benchmarks_user_id ON llm_benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_benchmarks_timestamp ON llm_benchmarks(request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_timestamp ON system_monitoring(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_service ON system_monitoring(service_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_updated_at();

-- Create function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Insert admin user (password: Admin@2025!)
INSERT INTO users (email, password_hash, name, role, organization, is_active)
VALUES (
  'admin@hyperfocus.ai',
  '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm',
  'System Administrator',
  'admin',
  'HyperFocus',
  true
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organization = EXCLUDED.organization,
  is_active = EXCLUDED.is_active;

-- Insert EY tester accounts (password: EYTest@2025!)
INSERT INTO users (email, password_hash, name, role, organization, is_active)
VALUES 
  ('ey.tester1@ey.com', '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm', 'EY Tester 1', 'ey_tester', 'Ernst & Young', true),
  ('ey.tester2@ey.com', '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm', 'EY Tester 2', 'ey_tester', 'Ernst & Young', true),
  ('ey.tester3@ey.com', '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm', 'EY Tester 3', 'ey_tester', 'Ernst & Young', true),
  ('ey.tester4@ey.com', '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm', 'EY Tester 4', 'ey_tester', 'Ernst & Young', true),
  ('ey.tester5@ey.com', '$2a$10$rX1YhC.vGJ9UjqZjwG5bHOqZgZwFH3mK0lZ.N3jHy2qVPxPqZQXYm', 'EY Tester 5', 'ey_tester', 'Ernst & Young', true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  organization = EXCLUDED.organization,
  is_active = EXCLUDED.is_active;
