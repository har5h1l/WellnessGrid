import { useCallback } from 'react'

/**
 * Hook for triggering real-time analytics refresh
 * This will refresh dashboard data whenever actions are performed
 */
export function useAnalyticsRefresh() {
  const refreshAnalytics = useCallback(async () => {
    try {
      // Get current user ID from localStorage or context
      const userId = localStorage.getItem('currentUserId') || '69478d34-90bd-476f-b47a-7d099c1cb913'
      
      // Force refresh analytics data
      const response = await fetch(`/api/analytics/?userId=${userId}&timeRange=30d&includeInsights=true&forceRefresh=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        console.log('🔄 Analytics refreshed successfully')
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('analyticsRefreshed', {
          detail: { timestamp: new Date().toISOString() }
        }))
        
        return true
      } else {
        console.warn('⚠️ Failed to refresh analytics:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Error refreshing analytics:', error)
      return false
    }
  }, [])

  const refreshDashboard = useCallback(async () => {
    try {
      // Force refresh the dashboard page
      const response = await fetch('/dashboard?forceRefresh=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        console.log('🔄 Dashboard refreshed successfully')
        
        // Dispatch custom event to notify dashboard components
        window.dispatchEvent(new CustomEvent('dashboardRefreshed', {
          detail: { timestamp: new Date().toISOString() }
        }))
        
        return true
      } else {
        console.warn('⚠️ Failed to refresh dashboard:', response.status)
        return false
      }
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error)
      return false
    }
  }, [])

  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all data...')
    
    const analyticsSuccess = await refreshAnalytics()
    const dashboardSuccess = await refreshDashboard()
    
    if (analyticsSuccess && dashboardSuccess) {
      console.log('✅ All data refreshed successfully')
      
      // Dispatch global refresh event
      window.dispatchEvent(new CustomEvent('dataRefreshed', {
        detail: { 
          timestamp: new Date().toISOString(),
          type: 'full_refresh'
        }
      }))
      
      return true
    } else {
      console.warn('⚠️ Some data refresh operations failed')
      return false
    }
  }, [refreshAnalytics, refreshDashboard])

  return {
    refreshAnalytics,
    refreshDashboard,
    refreshAll
  }
}
