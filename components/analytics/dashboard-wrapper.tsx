'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { EnhancedDashboard } from './enhanced-dashboard'
import { UnifiedAnalyticsData } from '@/lib/services/unified-analytics'
import { LoadingScreen } from '@/components/loading-screen'
import { toast } from 'sonner'

interface DashboardWrapperProps {
  userId: string
}

export function DashboardWrapper({ userId }: DashboardWrapperProps) {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<UnifiedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
  const isFetchingRef = useRef(false) // Prevent concurrent fetches using ref to avoid re-renders

  // Fetch fresh analytics data (defined first to avoid dependency issues)
  const fetchFreshData = useCallback(async (showLoading = true) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Already fetching fresh data, skipping...')
      return
    }

    try {
      isFetchingRef.current = true
      if (showLoading) setLoading(true)
      
      // Use normal request without forceRefresh to avoid rate limiting
      const response = await fetch(`/api/analytics?userId=${userId}&timeRange=30d&includeInsights=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          console.log('Rate limited, using cached data if available')
          // Try to use cached data instead of showing error (client-side only)
          if (typeof window !== 'undefined') {
            try {
              const cached = localStorage.getItem(`analytics_${userId}`)
              if (cached) {
                const { data, timestamp } = JSON.parse(cached)
                console.log('Using localStorage cache due to rate limiting')
                setAnalyticsData(data)
                setLastFetchTime(new Date(timestamp))
                return // Successfully used cache, no error
              }
            } catch (e) {
              console.log('No cache available during rate limit')
            }
          }
          
          // Parse retry information if available
          const errorData = await response.json().catch(() => ({}))
          const retryAfter = errorData.retryAfter || 5
          console.log(`Rate limited, will retry in ${retryAfter} seconds`)
          
          // Don't throw error on initial load, just log it
          if (!showLoading) {
            console.log('Background request rate limited, skipping')
            return
          }
          
          throw new Error(`Loading data, please wait ${retryAfter} seconds...`)
        }
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('Analytics data fetched successfully:', result.data)
        setAnalyticsData(result.data)
        setLastFetchTime(new Date())
        
        // Store in localStorage for quick access (client-side only)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`analytics_${userId}`, JSON.stringify({
              data: result.data,
              timestamp: new Date().toISOString()
            }))
          } catch (e) {
            console.log('Failed to cache analytics in localStorage')
          }
        }
      } else {
        console.error('Invalid analytics response:', result)
        
        // Try to load from localStorage as fallback (client-side only)
        if (typeof window !== 'undefined') {
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
      }
    } catch (error) {
      console.error('Error fetching fresh analytics data:', error)
      
      // Try localStorage as last resort (client-side only)
      if (typeof window !== 'undefined') {
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
      }
      
      if (showLoading && !analyticsData) {
        // Check if it's a rate limiting error
        if (error.message.includes('wait') && error.message.includes('seconds')) {
          // Don't show error toast for rate limiting during initial load
          console.log('Rate limited during initial load, will retry automatically')
        } else {
          // Only show error toast for actual failures
          toast.error('Failed to fetch latest analytics')
        }
      } else if (!showLoading && !analyticsData) {
        // Silent background refresh failed, just log it
        console.log('Background analytics refresh failed, using existing data')
      }
    } finally {
      isFetchingRef.current = false
      if (showLoading) setLoading(false)
    }
  }, [userId])

  // Fetch analytics data (defined after fetchFreshData to use it properly)
  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      console.log('No user ID provided')
      setLoading(false)
      return
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('Already fetching analytics data, skipping...')
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

      isFetchingRef.current = true
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
          
          // If cache is older than 1 hour, fetch fresh data in background with delay
          if (cacheData.metadata?.age_minutes > 60) {
            console.log('Cache is stale, scheduling fresh data fetch in background')
            // Add a small delay to avoid rate limiting
            setTimeout(() => {
              fetchFreshData(false)
            }, 2000) // 2 second delay
          }
          return
        }
      }

      // Handle rate limiting from cache request
      if (cacheResponse.status === 429) {
        console.log('Cache request rate limited, waiting before fresh request')
        // Wait a bit before trying fresh request
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // No cache or cache fetch failed, get fresh data
      await fetchFreshData(true)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      toast.error('Failed to load analytics data')
      setLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [userId, fetchFreshData])

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
  }, [userId, fetchFreshData])

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      // Try to load from localStorage first for instant display (client-side only)
      if (userId && typeof window !== 'undefined') {
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
              
              // Fetch fresh data in background if cache is older than 5 minutes, with delay
              if (age > 5 * 60 * 1000) {
                console.log('localStorage cache is stale, scheduling background refresh')
                setTimeout(() => {
                  fetchFreshData(false)
                }, 1000) // 1 second delay for background refresh
              }
              return
            }
          }
        } catch (e) {
          console.log('No valid localStorage cache')
        }
      }

      // No cache or too old, try API cache first, then fresh
      try {
        await fetchAnalyticsData(false)
      } catch (error) {
        console.log('Initial data load failed, will retry on user interaction')
      }
    }

    loadInitialData()
  }, [userId, fetchAnalyticsData])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchFreshData(false)
      // Only generate insights if we don't have recent ones
      if (!analyticsData?.insights || analyticsData.insights.length === 0) {
        await generateInsights()
      }
    } finally {
      setRefreshing(false)
    }
  }, [fetchFreshData, generateInsights]) // Removed analyticsData dependency to prevent re-creation

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
