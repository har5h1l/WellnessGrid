-- Chat Messages Table for Multi-turn Conversation Support
-- Stores conversation history for each session

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional metadata fields
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for efficient querying
  INDEX idx_messages_session_created (session_id, created_at DESC),
  INDEX idx_messages_session_role (session_id, role)
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users (adjust based on your auth setup)
-- This is a basic policy - modify based on your authentication requirements
CREATE POLICY "Users can manage their own messages" ON messages
  FOR ALL USING (true); -- Adjust this based on your auth setup

-- Function to get recent messages for a session
CREATE OR REPLACE FUNCTION get_session_messages(
  p_session_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  role TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    m.id,
    m.session_id,
    m.role,
    m.content,
    m.created_at,
    m.metadata
  FROM messages m
  WHERE m.session_id = p_session_id
  ORDER BY m.created_at DESC
  LIMIT p_limit;
$$;

-- Function to insert a new message
CREATE OR REPLACE FUNCTION insert_message(
  p_session_id TEXT,
  p_role TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE SQL
AS $$
  INSERT INTO messages (session_id, role, content, metadata)
  VALUES (p_session_id, p_role, p_content, p_metadata)
  RETURNING id;
$$; 