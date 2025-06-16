# Flask Backend Setup for WellnessGrid

## 🚀 Overview

This guide helps you set up the WellnessGrid React app to work with a custom Flask backend running BioGPT and BioBERT models instead of direct Hugging Face API calls.

## 📋 Prerequisites

- Node.js and npm installed
- Access to a Flask backend with BioGPT and BioBERT models
- ngrok tunnel (if running Flask in Google Colab)

## 🔧 Environment Configuration

### 1. Create Environment File

Create a `.env.local` file in your project root:

```bash
# Flask Backend API URL
FLASK_API_URL=http://localhost:5000

# For ngrok tunnel (when running in Colab):
# FLASK_API_URL=https://your-ngrok-id.ngrok.io
```

### 2. Flask Backend Requirements

Your Flask backend must expose these endpoints:

#### Embedding Generation: `POST /embed`
```python
@app.route('/embed', methods=['POST'])
def generate_embedding():
    data = request.json
    text = data.get('text')
    
    # Generate BioBERT embedding (768-dimensional vector)
    embedding = your_biobert_model.encode(text)
    
    return jsonify({
        'embedding': embedding.tolist()
    })
```

#### Text Generation: `POST /generate`
```python
@app.route('/generate', methods=['POST'])
def generate_text():
    data = request.json
    query = data.get('query')
    context = data.get('context')
    max_tokens = data.get('max_tokens', 200)
    temperature = data.get('temperature', 0.7)
    
    # Generate BioGPT response
    response = your_biogpt_model.generate(
        prompt=f"{context}\n\nQuestion: {query}\nAnswer:",
        max_length=max_tokens,
        temperature=temperature
    )
    
    return jsonify({
        'answer': response
    })
```

#### Health Check: `GET /health` (Optional)
```python
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models': {
            'biogpt': 'loaded',
            'biobert': 'loaded'
        }
    })
```

## 🧪 Testing

### 1. Test Flask Backend Directly

Use the provided test script:

```bash
# Install dependencies if needed
npm install node-fetch@2

# Test Flask endpoints
node examples/test-flask-api.js
```

### 2. Test Integration

Start the Next.js app and test the integration:

```bash
# Start development server
PORT=3001 npm run dev

# Test API endpoint
curl -X POST http://localhost:3001/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What is diabetes?"}'
```

### 3. Test in Browser

1. Open http://localhost:3001
2. Navigate to Chat page
3. Ask health-related questions
4. Verify responses and source attribution

## 🔍 Expected API Responses

### Successful Response
```json
{
  "query": "What is diabetes?",
  "answer": "Diabetes is a chronic condition that affects how your body processes blood sugar (glucose)...",
  "sources": [
    {
      "title": "Understanding Blood Pressure",
      "similarity": "0.754"
    }
  ],
  "metadata": {
    "documentsUsed": 3,
    "processingTime": 1699123456789,
    "mockMode": false
  }
}
```

### Fallback Response (when Flask backend is unavailable)
```json
{
  "query": "What is diabetes?",
  "answer": "Based on the available health information, here's what I can tell you about diabetes...",
  "sources": [...],
  "metadata": {
    "documentsUsed": 3,
    "processingTime": 1699123456789,
    "mockMode": false
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

**Connection Refused (ECONNREFUSED)**
- Check if Flask backend is running
- Verify the FLASK_API_URL in .env.local
- Test Flask endpoints directly with curl

**500 Internal Server Error**
- Check Flask backend logs for errors
- Ensure models are properly loaded
- Verify request/response format matches expected schema

**Slow Response Times**
- Models may need warming up on first request
- Consider implementing model caching in Flask
- Check network latency to Flask backend

**Mock Responses Instead of AI**
- Indicates Flask backend is not responding
- Check console logs for specific error messages
- Verify Flask endpoints return expected JSON format

### Debug Commands

```bash
# Test Flask backend connectivity
curl -X GET http://localhost:5000/health

# Test embedding endpoint
curl -X POST http://localhost:5000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "test query"}'

# Test generation endpoint
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "context": "test context", "max_tokens": 50}'

# Check Next.js API logs
# Look for "Calling Flask API..." messages in terminal
```

## 🚀 Production Deployment

### Recommendations

1. **Deploy Flask Backend to Cloud**
   - Use Google Cloud Run, AWS ECS, or Azure Container Instances
   - Ensure proper resource allocation for model inference

2. **Security**
   - Implement API authentication
   - Use HTTPS for all communications
   - Add rate limiting and request validation

3. **Monitoring**
   - Add logging for all requests/responses
   - Monitor model inference times
   - Set up alerts for backend failures

4. **Scaling**
   - Use load balancer for multiple Flask instances
   - Implement model caching (Redis)
   - Consider GPU resources for faster inference

## 📝 Example .env.local

```bash
# Development (local Flask)
FLASK_API_URL=http://localhost:5000

# Production (cloud deployment)
FLASK_API_URL=https://your-flask-api.cloudrun.app

# Colab + ngrok
FLASK_API_URL=https://abc123.ngrok.io

# Optional: Other services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

**Note**: Remember to never commit your `.env.local` file to version control. It's already included in `.gitignore`. 