// WellnessGrid Demo Backend Server
// This is a mock API server for demonstration purposes only
// It uses hardcoded data and does not connect to real services

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

// load mock data
const mockDataPath = path.join(__dirname, 'mock-data.json');
let mockData = {};

try {
    const rawData = fs.readFileSync(mockDataPath, 'utf8');
    mockData = JSON.parse(rawData);
    console.log('✅ Mock data loaded successfully');
} catch (error) {
    console.error('❌ Error loading mock data:', error.message);
    process.exit(1);
}

// helper function to simulate API delay
const simulateDelay = () => {
    return new Promise(resolve => {
        const delay = Math.random() * 1000 + 500; // 500-1500ms
        setTimeout(resolve, delay);
    });
};

// helper function to find matching chat response
const findChatResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    const keywords = mockData.chatResponses.keywords;
    
    // check for keywords in query
    for (const [keyword, responses] of Object.entries(keywords)) {
        if (lowerQuery.includes(keyword)) {
            // return a random response from the matching category
            const randomIndex = Math.floor(Math.random() * responses.length);
            return responses[randomIndex];
        }
    }
    
    // return a random fallback response
    const fallbacks = mockData.chatResponses.fallback;
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return fallbacks[randomIndex];
};

// routes

// health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'WellnessGrid Demo API is running',
        mode: 'demo',
        timestamp: new Date().toISOString()
    });
});

// get user profile
app.get('/api/profile', async (req, res) => {
    await simulateDelay();
    res.json({
        success: true,
        data: mockData.userProfile
    });
});

// get dashboard data
app.get('/api/dashboard', async (req, res) => {
    await simulateDelay();
    res.json({
        success: true,
        data: mockData.dashboardData
    });
});

// get analytics data
app.get('/api/analytics', async (req, res) => {
    await simulateDelay();
    res.json({
        success: true,
        data: mockData.analytics
    });
});

// get health records
app.get('/api/health-records', async (req, res) => {
    await simulateDelay();
    res.json({
        success: true,
        data: mockData.healthRecords
    });
});

// chat endpoint - main AI interaction
app.post('/api/chat', async (req, res) => {
    await simulateDelay();
    
    const { query, sessionId } = req.body;
    
    if (!query) {
        return res.status(400).json({
            success: false,
            error: 'Query is required'
        });
    }
    
    try {
        const answer = findChatResponse(query);
        
        res.json({
            success: true,
            answer: answer,
            metadata: {
                sessionId: sessionId || 'demo-session',
                timestamp: new Date().toISOString(),
                mode: 'demo',
                note: 'This is a simulated response from the demo system'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error generating response',
            message: error.message
        });
    }
});

// tracking entry - simulate saving data
app.post('/api/track', async (req, res) => {
    await simulateDelay();
    
    const { toolId, value, notes } = req.body;
    
    if (!toolId || value === undefined) {
        return res.status(400).json({
            success: false,
            error: 'toolId and value are required'
        });
    }
    
    // simulate successful save
    res.json({
        success: true,
        data: {
            id: `entry-${Date.now()}`,
            toolId,
            value,
            notes: notes || '',
            timestamp: new Date().toISOString()
        },
        message: 'Entry saved successfully (demo mode - not persisted)'
    });
});

// get insights
app.get('/api/insights', async (req, res) => {
    await simulateDelay();
    res.json({
        success: true,
        data: mockData.analytics.insights
    });
});

// get trends for specific metric
app.get('/api/trends/:metric', async (req, res) => {
    await simulateDelay();
    
    const { metric } = req.params;
    const trendData = mockData.analytics.trends[metric];
    
    if (!trendData) {
        return res.status(404).json({
            success: false,
            error: `Trend data not found for metric: ${metric}`
        });
    }
    
    res.json({
        success: true,
        data: trendData
    });
});

// catch-all for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'This is a demo API with limited endpoints',
        availableEndpoints: [
            'GET /health',
            'GET /api/profile',
            'GET /api/dashboard',
            'GET /api/analytics',
            'GET /api/health-records',
            'POST /api/chat',
            'POST /api/track',
            'GET /api/insights',
            'GET /api/trends/:metric'
        ]
    });
});

// error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║        🏥 WellnessGrid Demo API Server             ║
║                                                    ║
║        Status: Running                             ║
║        Port: ${PORT}                                    ║
║        Mode: Demo (Mock Data)                      ║
║                                                    ║
║        http://localhost:${PORT}                        ║
║                                                    ║
╚════════════════════════════════════════════════════╝
    `);
    console.log('📝 Available endpoints:');
    console.log('   GET  /health');
    console.log('   GET  /api/profile');
    console.log('   GET  /api/dashboard');
    console.log('   GET  /api/analytics');
    console.log('   GET  /api/health-records');
    console.log('   POST /api/chat');
    console.log('   POST /api/track');
    console.log('   GET  /api/insights');
    console.log('   GET  /api/trends/:metric');
    console.log('\n🚀 Demo server is ready for requests!\n');
});

