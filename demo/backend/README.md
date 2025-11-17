# WellnessGrid Demo Backend

This is a lightweight mock API server for the WellnessGrid demo. It uses hardcoded data and does not connect to any real databases or external services.

## Purpose

This demo backend is designed for:
- Hack Club CAC certification
- Showcasing the WellnessGrid concept
- Demonstration to judges and stakeholders
- **NOT for production use**

## Features

- ✅ Mock health data responses
- ✅ Simulated AI chat with keyword matching
- ✅ Realistic API delays (500-1500ms)
- ✅ No external dependencies or API keys required
- ✅ Easy deployment to any Node.js hosting platform

## Installation

```bash
cd demo/backend
npm install
```

## Running Locally

```bash
npm start
```

The server will start on `http://localhost:5001`

## Available Endpoints

### GET /health
Health check endpoint

### GET /api/profile
Returns mock user profile data

### GET /api/dashboard
Returns dashboard metrics and recent entries

### GET /api/analytics
Returns health insights and trends

### GET /api/health-records
Returns sample health records

### POST /api/chat
Chat with the mock AI assistant

**Request Body:**
```json
{
    "query": "How is my glucose doing?",
    "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
    "success": true,
    "answer": "Your recent glucose reading of 110 mg/dL...",
    "metadata": {
        "sessionId": "demo-session",
        "timestamp": "2024-11-17T10:30:00.000Z",
        "mode": "demo"
    }
}
```

### POST /api/track
Simulate saving a tracking entry (not persisted)

**Request Body:**
```json
{
    "toolId": "glucose",
    "value": 120,
    "notes": "Before lunch"
}
```

### GET /api/insights
Returns health insights

### GET /api/trends/:metric
Returns trend data for a specific metric (glucose, sleep, mood)

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `demo/backend` directory: `vercel`
3. Follow the prompts

### Railway

1. Install Railway CLI or use the web interface
2. Deploy directly from this directory
3. Set environment variable `PORT` (Railway sets this automatically)

### Heroku

1. Create a new Heroku app
2. Deploy from this directory
3. The app will automatically use the correct port

## Environment Variables

No environment variables required! This is a fully self-contained demo.

## Data Source

All data comes from `mock-data.json` in this directory. You can modify this file to change the demo data.

## Notes

- This server does NOT connect to any database
- No data is persisted between sessions
- All responses are pre-written or selected based on simple keyword matching
- Designed for demonstration purposes only
- No authentication or security features (not needed for demo)

## Testing the API

You can test the API using curl:

```bash
# Health check
curl http://localhost:5001/health

# Get dashboard data
curl http://localhost:5001/api/dashboard

# Chat with AI
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "How is my diabetes management?"}'
```

## Support

This is a demo project for CAC/Hack Club certification. For questions about the full WellnessGrid system, see the main README in the project root.

