// Demo API Client for WellnessGrid
// Connects to Next.js API routes (no separate backend needed)

const API_URL = ''; // Empty string = relative URLs

class DemoAPI {
    private baseUrl: string;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
    }

    private async fetchAPI(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    async getProfile() {
        return this.fetchAPI('/api/profile');
    }

    async getDashboard() {
        return this.fetchAPI('/api/dashboard');
    }

    async getAnalytics() {
        return this.fetchAPI('/api/analytics');
    }

    async getHealthRecords() {
        return this.fetchAPI('/api/health-records');
    }

    async chat(query: string, sessionId?: string) {
        return this.fetchAPI('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                query,
                sessionId: sessionId || `demo-${Date.now()}`,
            }),
        });
    }

    async track(toolId: string, value: any, notes?: string) {
        return this.fetchAPI('/api/track', {
            method: 'POST',
            body: JSON.stringify({
                toolId,
                value,
                notes,
            }),
        });
    }

    async getInsights() {
        return this.fetchAPI('/api/insights');
    }

    async getTrends(metric: string) {
        return this.fetchAPI(`/api/trends/${metric}`);
    }

    async healthCheck() {
        return this.fetchAPI('/health');
    }
}

export const demoAPI = new DemoAPI();

