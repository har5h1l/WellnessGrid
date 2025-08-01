'use client'

import { HealthDashboard } from '@/components/analytics/health-dashboard'

// Debug page to test analytics features without authentication
export default function DebugAnalyticsPage() {
  console.log('🛠️ [DEBUG] Debug Analytics Page loaded')
  
  // Mock user ID for testing
  const mockUserId = 'debug-user-123'
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
        <h2 className="text-lg font-semibold text-yellow-800">🛠️ Debug Mode</h2>
        <p className="text-yellow-700">Testing analytics dashboard with mock user ID: {mockUserId}</p>
      </div>
      <HealthDashboard userId={mockUserId} />
    </div>
  )
}