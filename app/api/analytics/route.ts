import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { UnifiedAnalyticsService } from '@/lib/services/unified-analytics'

// create a service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeInsights = searchParams.get('includeInsights') === 'true'
    const timeRange = searchParams.get('timeRange') || '30d'
    const cached = searchParams.get('cached') === 'true'
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    let userId = searchParams.get('userId') || null
    
    // add intelligent request deduplication to prevent excessive calls
    const requestKey = `${userId}-${timeRange}-${includeInsights}-${cached}`
    const cacheKey = `analytics_request_${requestKey}`
    
    // check if we have a recent request in memory (simple in-memory cache)
    const now = Date.now()
    const recentRequests = global.recentAnalyticsRequests || new Map()
    const lastRequest = recentRequests.get(cacheKey)
    
    // More intelligent rate limiting:
    // - Allow cached requests more frequently (1 second)
    // - Allow fresh requests less frequently (3 seconds)
    // - Skip rate limiting for force refresh requests
    const rateLimitWindow = forceRefresh ? 0 : (cached ? 1000 : 3000) // 1s for cached, 3s for fresh, 0 for force refresh
    
    if (lastRequest && (now - lastRequest) < rateLimitWindow && !forceRefresh) {
      console.log(`🔄 Preventing duplicate ${cached ? 'cached' : 'fresh'} request within ${rateLimitWindow/1000} seconds`)
      
      // For cached requests, return a more gentle message
      if (cached) {
        return NextResponse.json({
          success: false,
          error: 'Cached data request too recent',
          retryAfter: Math.ceil((rateLimitWindow - (now - lastRequest)) / 1000)
        }, { status: 429 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Request too frequent, please wait a moment',
        retryAfter: Math.ceil((rateLimitWindow - (now - lastRequest)) / 1000)
      }, { status: 429 })
    }
    
    // update request timestamp
    recentRequests.set(cacheKey, now)
    global.recentAnalyticsRequests = recentRequests
    
    // if no userId in query params, try to get from Authorization header
    if (!userId) {
      try {
        const authHeader = request.headers.get('authorization')
        console.log('🔐 Auth header present:', !!authHeader)
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7)
          console.log('🔐 Token length:', token.length)
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          if (user && !error) {
            userId = user.id
            console.log('🔐 Authenticated user:', user.email)
          } else {
            console.log('🔐 Auth error:', error?.message)
          }
        }
      } catch (authError) {
        console.log('Auth failed:', authError.message)
      }
    }
    
    // fallback: for testing purposes, if no auth and specific user email exists
    if (!userId) {
      console.log('🔍 No authenticated user, checking for test user fallback')
      try {
        const { data: testUser, error } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('id', process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913')
          .single()
        
        if (!error && testUser) {
          userId = testUser.id
          console.log('🧪 Using test user for analytics:', userId)
        } else {
          console.log('🧪 Test user not found or error:', error?.message)
        }
      } catch (fallbackError) {
        console.log('🧪 Test user fallback failed:', fallbackError.message)
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    try {
      console.log('🔍 Getting unified analytics data for user:', userId)
      
      // use single unified service for all analytics data
      const analyticsData = await UnifiedAnalyticsService.getUnifiedAnalyticsData(
        userId, 
        timeRange, 
        { 
          forceRefresh, 
          includeInsights, 
          cached 
        }
      )

      // return metadata for cached requests
      if (cached) {
    return NextResponse.json({
      success: true,
      data: analyticsData,
          metadata: {
            age_minutes: 1, // always fresh with unified service
            cached: true
          },
          timestamp: new Date().toISOString()
        })
      }

      console.log('✅ Unified analytics data generated successfully')

      return NextResponse.json({
        success: true,
        data: analyticsData,
        source: 'unified',
      timestamp: new Date().toISOString(),
      user_authenticated: !!userId,
      insights_available: analyticsData.insights?.length > 0
    })
    } catch (error) {
      console.error('Failed to get analytics data:', error.message)
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch analytics data',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, insight_type = 'daily' } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 400 })
    }

    console.log(`🔧 POST: ${action} for user ${userId}`)

    if (action === 'generate_insights') {
      // generate health insights
      try {
        const { HealthInsightsService } = await import('@/lib/services/health-insights')
        const insight = await HealthInsightsService.generateHealthInsights(userId, insight_type)
        
        // clear cache to ensure fresh data after insights generation
        UnifiedAnalyticsService.clearCache(userId)
        
        return NextResponse.json({
          success: true,
          insight,
          message: 'Insights generated successfully'
        })
      } catch (error) {
        console.error('Failed to generate insights:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to generate insights'
        }, { status: 500 })
      }
    } else if (action === 'refresh_wellness_score') {
      // force refresh wellness score
      try {
        const { WellnessScoreService } = await import('@/lib/services/wellness-score')
        const freshScore = await WellnessScoreService.calculateWellnessScore(userId, '7d', true)
        
        // clear cache to ensure fresh data
        UnifiedAnalyticsService.clearCache(userId)
        
        return NextResponse.json({
          success: true,
          wellness_score: freshScore,
          message: 'Wellness score refreshed successfully'
        })
      } catch (error) {
        console.error('Failed to refresh wellness score:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to refresh wellness score'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('POST analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}