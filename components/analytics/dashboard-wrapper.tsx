'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { EnhancedDashboard } from './enhanced-dashboard'
import { AnalyticsData } from '@/lib/database/types'
import { LoadingScreen } from '@/components/loading-screen'
import { toast } from 'sonner'

interface DashboardWrapperProps {
  userId: string
}

export function DashboardWrapper({ userId }: DashboardWrapperProps) {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      console.log('No user ID provided')
      setLoading(false)
      return
    }

    try {
      // Check if we have recent data (less than 5 minutes old)
      if (!forceRefresh && lastFetchTime && analyticsData) {
        const timeDiff = Date.now() - lastFetchTime.getTime()
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
          console.log('Using cached analytics data')
          setLoading(false)
          return
        }
      }

      console.log('Fetching analytics data for user:', userId)
      
      // Try to get cached insights first
      const cacheResponse = await fetch(`/api/analytics?userId=${userId}&cached=true`)
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json()
        if (cacheData.success && cacheData.data) {
          console.log('Using cached analytics data from API')
          setAnalyticsData(cacheData.data)
          setLastFetchTime(new Date())
          setLoading(false)
          
          // If cache is older than 1 hour, fetch fresh data in background
          if (cacheData.metadata?.age_minutes > 60) {
            console.log('Cache is stale, fetching fresh data in background')
            fetchFreshData(false)
          }
          return
        }
      }

      // No cache or cache fetch failed, get fresh data
      await fetchFreshData(true)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
      setLoading(false)
    }
  }, [userId, analyticsData, lastFetchTime])

  // Fetch fresh analytics data
  const fetchFreshData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const response = await fetch(`/api/analytics?userId=${userId}&timeRange=30d&includeInsights=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('Analytics data fetched successfully:', result.data)
        setAnalyticsData(result.data)
        setLastFetchTime(new Date())
        
        // Store in localStorage for quick access
        try {
          localStorage.setItem(`analytics_${userId}`, JSON.stringify({
            data: result.data,
            timestamp: new Date().toISOString()
          }))
        } catch (e) {
          console.log('Failed to cache analytics in localStorage')
        }
      } else {
        console.error('Invalid analytics response:', result)
        
        // Try to load from localStorage as fallback
        try {
          const cached = localStorage.getItem(`analytics_${userId}`)
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            console.log('Using localStorage fallback data from:', timestamp)
            setAnalyticsData(data)
            setLastFetchTime(new Date(timestamp))
          }
        } catch (e) {
          console.log('No localStorage fallback available')
        }
      }
    } catch (error) {
      console.error('Error fetching fresh analytics data:', error)
      
      // Try localStorage as last resort
      try {
        const cached = localStorage.getItem(`analytics_${userId}`)
        if (cached) {
          const { data } = JSON.parse(cached)
          console.log('Using localStorage fallback after error')
          setAnalyticsData(data)
        }
      } catch (e) {
        console.log('Failed to load fallback data')
      }
      
      if (showLoading) {
        toast.error('Failed to fetch latest analytics')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Generate new insights
  const generateInsights = useCallback(async () => {
    if (!userId) return

    try {
      setRefreshing(true)
      console.log('Generating new insights for user:', userId)

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'generate_insights',
          insight_type: 'on_demand'
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('Insights generated successfully')
        toast.success('New insights generated!')
        
        // Fetch the updated analytics data
        await fetchFreshData(false)
      } else {
        throw new Error(result.error || 'Failed to generate insights')
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      toast.error('Failed to generate insights')
    } finally {
      setRefreshing(false)
    }
  }, [userId])

  // Initial data fetch
  useEffect(() => {
    // Try to load from localStorage first for instant display
    if (userId) {
      try {
        const cached = localStorage.getItem(`analytics_${userId}`)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const age = Date.now() - new Date(timestamp).getTime()
          
          // Use cache if less than 1 hour old
          if (age < 60 * 60 * 1000) {
            console.log('Loading initial data from localStorage')
            setAnalyticsData(data)
            setLastFetchTime(new Date(timestamp))
            setLoading(false)
            
            // Fetch fresh data in background if cache is older than 5 minutes
            if (age > 5 * 60 * 1000) {
              fetchFreshData(false)
            }
            return
          }
        }
      } catch (e) {
        console.log('No valid localStorage cache')
      }
    }

    // No cache or too old, fetch fresh
    fetchAnalyticsData(false)
  }, [userId, fetchAnalyticsData])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchFreshData(false)
    await generateInsights()
    setRefreshing(false)
  }, [generateInsights])

  // Navigation helper function
  const handleNavigation = useCallback((path: string) => {
    try {
      console.log('Navigating to:', path)
      router.push(path)
    } catch (error) {
      console.error('Navigation error:', error)
      toast.error('Navigation failed. Please try again.')
      // Fallback to window.location for external/problematic routes
      window.location.href = path
    }
  }, [router])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <EnhancedDashboard 
      analyticsData={analyticsData}
      userId={userId}
      onRefresh={handleRefresh}
      onNavigate={handleNavigation}
      loading={refreshing}
    />
  )
}
