# LLM Integration in WellnessGrid Chat

## 🚀 Overview

The WellnessGrid app now includes an AI-powered chat assistant that uses advanced Language Models to provide personalized health information. The chat is powered by BioGPT and BioGERT models via the Hugging Face Inference API.

## 🏗️ Architecture

```
User Message → Chat Page → /api/ask → Hugging Face API → AI Response → Chat UI
```

### Components:
- **API Route**: `app/api/ask/route.ts` - Handles LLM API calls
- **Chat Page**: `app/chat/page.tsx` - Updated to use LLM API
- **Mock Data**: Sample health documents for demonstration

## 🔧 Setup Instructions

### 1. Start Development Server
```bash
PORT=3001 npm run dev
```
*Note: Using port 3001 to avoid conflicts with other services*

### 2. Environment Variables (Optional)
Create `.env.local` file:
```env
HUGGINGFACE_API_KEY=your_token_here
```

**Without Token**: App runs in demo mode with mock responses
**With Token**: App uses real BioGPT and BioGERT models

### 3. Get Hugging Face Token
1. Visit: https://huggingface.co/settings/tokens
2. Create a new token
3. Add to your `.env.local` file

## 🧪 Testing

### Test API Directly:
```bash
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is normal blood pressure?"}'
```

### Test Chat Integration:
```bash
node examples/test-chat-integration.js
```

### Test in Browser:
1. Open http://localhost:3001
2. Navigate to Chat page
3. Ask health questions
4. Verify AI responses with sources

## 🎯 Features

### ✅ **Context-Aware Responses**
- Includes user's health conditions in queries
- Personalized advice based on medical history

### ✅ **Source Attribution**
- Shows which documents were used for responses
- Displays similarity scores for transparency

### ✅ **Mock Mode Indicator**
- Clear indication when using demo data
- Helps users understand response quality

### ✅ **Fallback System**
- Graceful degradation if API fails
- Local condition-specific responses as backup

### ✅ **Real-time Processing**
- Async response generation
- Loading indicators for better UX

## 🧠 Models Used

### **BioGPT-Large** (`microsoft/BioGPT-Large`)
- Generates medical text responses
- Trained on biomedical literature
- Provides contextual health information

### **BioBERT** (`dmis-lab/biobert-base-cased-v1.1`)
- Creates embeddings for document search
- Medical domain-specific BERT model
- Enables semantic similarity matching

## 📊 API Response Format

```json
{
  "query": "What is normal blood pressure?",
  "answer": "Based on the available health information...",
  "sources": [
    {
      "title": "Understanding Blood Pressure",
      "similarity": "0.754"
    }
  ],
  "metadata": {
    "documentsUsed": 3,
    "processingTime": 1750036240558,
    "mockMode": true
  }
}
```

## 🔮 Future Enhancements

### Planned Features:
- [ ] User-specific document upload
- [ ] Integration with health records
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Custom knowledge base
- [ ] RAG (Retrieval-Augmented Generation) with vector database

### Scalability:
- [ ] Pinecone/Weaviate integration for vector storage
- [ ] Redis caching for frequent queries
- [ ] Rate limiting and usage analytics
- [ ] Model fine-tuning on user data

## 🛠️ Troubleshooting

### Common Issues:

**404 Error on API calls**
- Ensure server is running on port 3001
- Check that API route file exists at `app/api/ask/route.ts`

**Long Response Times or "Error generating answer"**
- First call to Hugging Face may take 30+ seconds (model loading)
- Models need to "warm up" which can cause initial timeouts
- Subsequent calls are much faster
- If you get error messages, try the same query again
- Consider implementing caching for production use

**API Token Issues**
- Verify token is correctly set in `.env.local`
- Check token permissions on Hugging Face
- App works without token in demo mode

## 📝 Usage Examples

### Basic Health Query:
```javascript
const response = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: "What foods should I avoid with diabetes?" 
  })
});
```

### Condition-Specific Query:
```javascript
const response = await fetch('/api/ask', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: "I have asthma. What are early warning signs?" 
  })
});
```

## 🔒 Security & Privacy

- No personal health data is stored
- Queries are processed securely via HTTPS
- Hugging Face API calls are logged for debugging only
- All responses include medical disclaimer
- Emergency situations redirect to professional help

---

**⚠️ Medical Disclaimer**: This AI assistant provides general health information only. Always consult with healthcare professionals for medical advice, diagnosis, or treatment. 