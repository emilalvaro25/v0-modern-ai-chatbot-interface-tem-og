-- Drop the foreign key constraint and change user_id from UUID to TEXT
-- This allows us to use custom user IDs instead of requiring UUID format

-- First, drop the existing foreign key constraint
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

-- Change user_id column type from UUID to TEXT
ALTER TABLE conversations 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Update the index to work with TEXT type
DROP INDEX IF EXISTS idx_conversations_user_id;
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
