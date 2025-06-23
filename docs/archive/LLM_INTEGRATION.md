# LLM Integration in WellnessGrid Chat

## 🚀 Overview

The WellnessGrid app now includes an AI-powered chat assistant that uses advanced Language Models to provide personalized health information. The chat is powered by BioGPT and BioBERT models via a **custom Flask backend** running in Google Colab with ngrok tunneling.

## 🏗️ Architecture

```
User Message → Chat Page → /api/ask → Flask Backend (ngrok) → BioGPT/BioBERT → AI Response → Chat UI
```

### Components:
- **API Route**: `app/api/ask/route.ts` - Handles Flask API calls
- **Chat Page**: `app/chat/page.tsx` - Updated to use LLM API
- **Flask Backend**: Custom backend running BioGPT and BioBERT models
- **Mock Data**: Sample health documents for demonstration

## 🔧 Setup Instructions

### 1. Configure Flask Backend URL
Create `.env.local` file:
```env
FLASK_API_URL=http://localhost:5000
```

**Note**: Replace with your actual ngrok URL when the Flask backend is running in Colab.

### 2. Start Development Server
```bash
PORT=3001 npm run dev
```
*Note: Using port 3001 to avoid conflicts with other services*

### 3. Flask Backend Setup
Your Flask backend should expose these endpoints:
- `POST /embed` - BioBERT embedding generation
- `POST /generate` - BioGPT text generation
- `GET /health` - Health check (optional)

## 🧪 Testing

### Test Flask Backend Directly:
```bash
node examples/test-flask-api.js
```

### Test API Integration:
```bash
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type": "application/json" \
  -d '{"query": "What is normal blood pressure?"}'
```

### Test in Browser:
1. Open http://localhost:3001
2. Navigate to Chat page
3. Ask health questions
4. Verify AI responses with sources

## 🎯 Features

### ✅ **Custom Backend Integration**
- Direct integration with Flask backend
- No dependency on external API keys
- Full control over model parameters

### ✅ **Context-Aware Responses**
- Includes user's health conditions in queries
- Personalized advice based on medical history

### ✅ **Source Attribution**
- Shows which documents were used for responses
- Displays similarity scores for transparency

### ✅ **Fallback System**
- Graceful degradation if Flask backend fails
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

## 📊 API Communication

### Flask Backend Expected Endpoints:

#### Embedding Generation: `POST /embed`
**Request:**
```json
{
  "text": "What is diabetes and how to manage it?"
}
```

**Response:**
```json
{
  "embedding": [0.1, 0.2, 0.3, ...] // 768-dimensional vector
}
```

#### Text Generation: `POST /generate`
**Request:**
```json
{
  "query": "What is diabetes?",
  "context": "Document: Understanding Diabetes\nContent: ...",
  "max_tokens": 200,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "answer": "Diabetes is a chronic condition..."
}
```

### Next.js API Response Format:
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
    "mockMode": false
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
- [ ] Multiple Flask backend instances
- [ ] Load balancing across backends
- [ ] Redis caching for frequent queries
- [ ] Rate limiting and usage analytics
- [ ] Model fine-tuning on user data

## 🛠️ Troubleshooting

### Common Issues:

**Connection Refused or 500 Errors**
- Ensure Flask backend is running and accessible
- Check ngrok tunnel is active and URL is correct
- Verify Flask endpoints are responding to requests

**Long Response Times**
- First call to models may take time for loading
- Consider implementing model warming in Flask backend
- Check network connectivity to ngrok tunnel

**Fallback to Mock Responses**
- This happens when Flask backend is unavailable
- Check console logs for specific error messages
- Verify Flask API URL in environment variables

## 📝 Usage Examples

### Environment Configuration:
```bash
# .env.local
FLASK_API_URL=https://your-ngrok-url.ngrok.io
```

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

### Testing Flask Backend:
```bash
# Test embedding endpoint
curl -X POST http://localhost:5000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "What is diabetes?"}'

# Test generation endpoint  
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes?", "context": "Medical context here", "max_tokens": 100, "temperature": 0.7}'
```

## 🔒 Security & Privacy

- No personal health data stored in Flask backend
- Queries processed through secure ngrok tunnel
- All responses include medical disclaimer
- Emergency situations redirect to professional help
- Flask backend should implement proper security measures

## 🚀 Deployment Notes

### For Production:
1. Deploy Flask backend to cloud service (GCP, AWS, Azure)
2. Use proper domain instead of ngrok tunnel
3. Implement authentication and rate limiting
4. Add monitoring and logging
5. Use load balancer for multiple backend instances

---

**⚠️ Medical Disclaimer**: This AI assistant provides general health information only. Always consult with healthcare professionals for medical advice, diagnosis, or treatment. 