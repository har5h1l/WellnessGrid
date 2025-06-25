# LLM Integration Setup Guide

## Overview

The WellnessGrid app now includes enhanced AI capabilities using Gemini API for query enhancement and response communication, with OpenRouter as a fallback service. **NEW**: Multi-turn conversation support with persistent chat history stored in Supabase.

## Features

- **Query Enhancement**: User queries are automatically enhanced using Gemini AI for better medical context and precision
- **Response Communication**: Technical medical responses are improved for better user understanding
- **Automatic Fallback**: If Gemini API quota is exceeded, the system automatically falls back to OpenRouter
- **Free Tier Models**: Uses free tier models from both services
- **🆕 Multi-turn Chat**: Conversations maintain context across multiple interactions
- **🆕 Session Management**: Each conversation has a unique session ID for tracking
- **🆕 Chat History**: Previous messages are stored in Supabase and used to enhance responses
- **🆕 Conversation Continuity**: AI references previous discussions for better context

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Gemini API Configuration (Free tier available)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter API Configuration (Fallback service)
# Get your API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Database Setup

### Supabase Messages Table

You need to create the messages table in your Supabase database for chat history:

```sql
-- Run this in your Supabase SQL editor
-- Chat Messages Table for Multi-turn Conversation Support
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_messages_session_created (session_id, created_at DESC),
  INDEX idx_messages_session_role (session_id, role)
);

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
LANGUAGE SQL STABLE
AS $$
  SELECT m.id, m.session_id, m.role, m.content, m.created_at, m.metadata
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
```

## API Key Setup

### Gemini API Setup
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your environment variables
4. **Free tier includes**: 15 requests per minute, 1 million tokens per minute

### OpenRouter API Setup (Optional but Recommended)
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up and create an API key
3. Copy the key and add it to your environment variables
4. **Free models available**: Mistral 7B Instruct, some Llama models

## How It Works

### Enhanced Multi-turn Query Flow
1. **Session Management**: System generates or uses provided session ID
2. **Chat History Retrieval**: Last 5 message pairs retrieved from Supabase
3. **Query Enhancement**: Gemini AI enhances the query considering conversation history
4. **Embedding Generation**: Enhanced query is processed by PubMedBERT via Flask
5. **Document Retrieval**: Similar medical documents are found in Supabase
6. **Response Generation**: BioMistral/BioGPT generates response with chat history context
7. **Response Improvement**: Gemini AI makes the response more user-friendly with conversation continuity
8. **History Storage**: Both user query and AI response are saved to Supabase

### Example Multi-turn Enhancement

**Turn 1:**
- **User**: "I have headaches"
- **Enhanced**: "Patient experiencing headaches - require information about potential causes, symptoms to monitor, differential diagnosis considerations"
- **AI Response**: "Headaches can have various causes..."

**Turn 2:**
- **User**: "What could be causing them?"
- **Enhanced**: "Based on previous discussion about patient's headaches, provide detailed information about potential underlying causes, triggers, and contributing factors for headache conditions"
- **AI Response**: "Given that you mentioned having headaches, let me explain the common causes..."

**Turn 3:**
- **User**: "Are there home remedies?"
- **Enhanced**: "Considering the ongoing headache discussion, provide safe and effective home remedies and self-care strategies for headache management"
- **AI Response**: "For the headaches we've been discussing, here are some effective home remedies..."

## API Usage

### Single Query (Auto-generates session)
```javascript
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "I have a headache"
  })
});
```

### Multi-turn Conversation (Use returned sessionId)
```javascript
// First query
const firstResponse = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "I have a headache"
  })
});
const { sessionId } = await firstResponse.json();

// Follow-up query with session
const followUpResponse = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What could be causing them?",
    sessionId: sessionId
  })
});
```

## API Response Format

The enhanced API now returns additional fields for multi-turn support:

```json
{
  "query": "original user query",
  "enhancedQuery": "AI-enhanced query (if enhancement was successful)",
  "answer": "final user-friendly response",
  "improvedAnswer": "improved response (if improvement was successful)",
  "sources": [...],
  "sessionId": "uuid-session-identifier",
  "metadata": {
    "documentsUsed": 5,
    "totalFound": 10,
    "contextLength": 1500,
    "flaskBackendUsed": true,
    "processingTime": "2024-01-01T12:00:00Z",
    "chatHistoryUsed": true,
    "messagesInHistory": 4,
    "llmEnhancement": {
      "queryEnhanced": true,
      "queryEnhancementService": "gemini",
      "responseImproved": true,
      "responseImprovementService": "gemini",
      "fallbacksUsed": []
    }
  }
}
```

## Models Used

### Gemini API
- **Model**: `gemini-1.5-flash` (free tier)
- **Use Case**: Query enhancement and response improvement with chat history
- **Chat Support**: Native multi-turn conversation support
- **Fallback**: Automatically switches to OpenRouter on quota exceeded

### OpenRouter
- **Model**: `mistralai/mistral-7b-instruct:free`
- **Use Case**: Fallback for both query enhancement and response improvement
- **Chat Support**: Conversation history via message array
- **Cost**: Free tier available

### Flask Backend (Enhanced)
- **PubMedBERT**: `NeuML/pubmedbert-base-embeddings` for medical embeddings
- **BioMistral**: `BioMistral/BioMistral-7B` for medical text generation
- **Chat Support**: Accepts history array and formats for medical context

## Error Handling

The system gracefully handles various failure scenarios:

1. **No API Keys**: System works without LLM enhancement
2. **Gemini Quota Exceeded**: Automatically falls back to OpenRouter
3. **Both Services Fail**: Uses original query/response without enhancement
4. **Network Issues**: Retries once for transient errors
5. **🆕 Database Issues**: Continues without chat history if Supabase fails
6. **🆕 Invalid Session**: Generates new session ID automatically

## Testing the Integration

### Check Service Status
```bash
curl http://localhost:3000/api/ask
```

Expected response includes:
```json
{
  "features": {
    "queryEnhancement": true,
    "responseImprovement": true,
    "fallbackSupport": true,
    "multiTurnChat": true,
    "chatHistory": true,
    "sessionManagement": true
  }
}
```

### Test Multi-turn Chat
```bash
# Run the comprehensive test suite
node tests/test-multi-turn-chat.js
```

### Manual Testing
```bash
# First query
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "I have a headache"}'

# Follow-up query (use sessionId from first response)
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What could be causing them?", "sessionId": "your-session-id"}'
```

## Performance Considerations

- **Query Enhancement**: Adds ~1-2 seconds to processing time
- **Response Improvement**: Adds ~1-2 seconds to processing time
- **🆕 Chat History Retrieval**: Adds ~100-200ms for database query
- **🆕 History Storage**: Adds ~100-200ms for message insertion
- **Total Overhead**: ~2-5 seconds for full LLM enhancement with chat history
- **Fallback Speed**: OpenRouter typically responds within 2-3 seconds

## Troubleshooting

### Common Issues

1. **"Gemini API key not configured"**
   - Check that `GEMINI_API_KEY` is set in your environment
   - Verify the API key is valid

2. **"Quota exceeded" errors**
   - Normal behavior - system will automatically use OpenRouter
   - Consider upgrading to Gemini paid tier for higher limits

3. **🆕 "Chat history not working"**
   - Verify the messages table exists in Supabase
   - Check that the RPC functions are created
   - Ensure Supabase connection is working

4. **🆕 "Session ID not persisting"**
   - Frontend must store and send sessionId in subsequent requests
   - Check that sessionId is being returned in API responses

### Debug Logs

The system provides detailed console logs:
- 🚀 Starting enhanced RAG query
- 📚 Retrieved X messages from chat history
- 🧠 Enhancing query with chat history
- ✅ Query enhanced via: gemini/openrouter
- 🔬 Generating response with BioMistral/BioGPT
- 💬 Improving response communication with chat history
- 💾 Saving conversation to database
- ⏱️ Total processing time

## Security Notes

- API keys are server-side only (not exposed to frontend)
- All requests are rate-limited and monitored
- No user data is stored by Gemini/OpenRouter services
- 🆕 Chat history is stored securely in Supabase with RLS support
- 🆕 Session IDs are UUIDs for security
- Medical responses include appropriate disclaimers

## Chat History Management

### Automatic Cleanup
The system includes utilities for managing chat history:

```javascript
// Clean up messages older than 30 days
await chatService.cleanupOldMessages(30);
```

### Manual History Management
You can query chat history directly:

```javascript
// Get recent messages for a session
const messages = await chatService.getSessionMessages(sessionId, 10);

// Insert a message manually
await chatService.insertMessage(sessionId, 'user', 'Hello', {});
``` 