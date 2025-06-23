# Tests

This directory contains test files for the WellnessGrid application.

## 📁 Files

- `test-ask-api.ts` - Tests for the `/api/ask` endpoint
- `test-chat-integration.js` - Integration tests for chat functionality
- `test-flask-api.js` - Flask API endpoint tests (archived)
- `test-supabase.ts` - Supabase database connection tests

## 🚀 Usage

### API Tests
```bash
# Test the ask API endpoint
npx ts-node tests/test-ask-api.ts

# Test chat integration
node tests/test-chat-integration.js

# Test Supabase connection
npx ts-node tests/test-supabase.ts
```

### Flask API Tests (Archived)
```bash
node tests/test-flask-api.js
```

## 📝 Notes

- Make sure your environment variables are configured before running tests
- Some tests require a running development server
- Run `python scripts/embed_documents.py` first to populate the medical database
- Flask API tests are archived but kept for reference 