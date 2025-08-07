import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HealthAnalyticsService } from '@/lib/services/health-analytics'
import { HomepageIntegrationService } from '@/lib/services/homepage-integration'

// Create a service role client for server-side operations
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
    let userId = searchParams.get('userId') || null
    
    // If no userId in query params, try to get from Authorization header
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
    
    // Fallback: For testing purposes, if no auth and specific user email exists
    if (!userId) {
      console.log('🔍 No authenticated user, checking for test user fallback')
      try {
        const { data: testUser, error } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('id', '69478d34-90bd-476f-b47a-7d099c1cb913')
          .single()
        
        if (!error && testUser) {
          userId = testUser.id
          console.log('🧪 Using test user for analytics:', userId)
        }
      } catch (fallbackError) {
        console.log('🧪 Test user fallback failed:', fallbackError.message)
      }
    }

    // Check cache first if requested
    if (cached && userId) {
      try {
        console.log('📦 Checking cache for user:', userId)
        const { data: cachedData, error } = await supabaseAdmin
          .from('analytics_cache')
          .select('*')
          .eq('user_id', userId)
          .eq('cache_key', `analytics_${timeRange}`)
          .gte('expires_at', new Date().toISOString())
          .single()
        
        if (!error && cachedData && cachedData.cache_data) {
          console.log('✅ Using cached analytics data')
          const ageMinutes = Math.floor((Date.now() - new Date(cachedData.created_at).getTime()) / (1000 * 60))
          return NextResponse.json({
            success: true,
            data: cachedData.cache_data,
            source: 'cache',
            metadata: {
              cached_at: cachedData.created_at,
              age_minutes: ageMinutes
            }
          })
        }
      } catch (cacheError) {
        console.log('Cache lookup failed:', cacheError.message)
      }
    }
    
    // Try to get real data using the new analytics service if we have a user
    let analyticsData = null
    if (userId) {
      try {
        console.log(`🔍 Getting analytics for user ${userId} (${timeRange})`)
        analyticsData = await HealthAnalyticsService.getAnalyticsData(userId, timeRange)
        
        // Use dashboard service for consistency across entire app
        try {
          const dashboardData = await HomepageIntegrationService.getDashboardData(userId)
          
          // Use dashboard data as primary source for consistency
          analyticsData.today_stats = dashboardData.todayStats
          analyticsData.health_score = {
            overall_score: dashboardData.wellnessScore.overall_score,
            trend: dashboardData.wellnessScore.trend,
            component_scores: dashboardData.wellnessScore.component_scores
          }
          
          // Also use dashboard insights for consistency
          if (dashboardData.healthInsights && dashboardData.healthInsights.length > 0) {
            analyticsData.insights = dashboardData.healthInsights
          }
          
          console.log('📊 Using dashboard data as primary source for consistency')
          console.log('🔄 Health score:', analyticsData.health_score.overall_score)
        } catch (dashboardError) {
          console.log('Dashboard data unavailable, using analytics only:', dashboardError.message)
        }
        
        // Add insights if requested
        if (includeInsights) {
          try {
            // Query existing insights from database with debugging using admin client
            console.log(`🔍 GET: Querying insights for user: ${userId}`)
            const { data: existingInsights, error: queryError } = await supabaseAdmin
              .from('health_insights')
              .select('*')
              .eq('user_id', userId)
              .order('generated_at', { ascending: false })
              .limit(3)
            
            console.log('📊 GET Query result:', { 
              error: queryError, 
              insightsCount: existingInsights?.length || 0,
              insights: existingInsights?.map(i => ({ id: i.id, type: i.insight_type, summary: i.insights?.summary }))
            })
            
            // Check if we have recent insights (within 24 hours) like homepage does
            let useExistingInsights = false
            if (!queryError && existingInsights && existingInsights.length > 0) {
              const latestInsight = existingInsights[0]
              const generatedAt = new Date(latestInsight.generated_at)
              const hoursSinceGenerated = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
              
              if (hoursSinceGenerated < 24) {
                console.log(`✅ Using existing insights from database (${hoursSinceGenerated.toFixed(1)}h old)`)
                analyticsData.insights = existingInsights.map(insight => ({
                  id: insight.id,
                  insight_type: insight.insight_type,
                  generated_at: insight.generated_at,
                  insights: insight.insights
                }))
                useExistingInsights = true
              }
            }
            
            if (!useExistingInsights) {
              // Check if we have sufficient data for insights generation
              const hasTrackingData = analyticsData.data_points > 0
              const hasDashboardData = analyticsData.health_score && analyticsData.today_stats
              
              if (hasTrackingData || hasDashboardData) {
                // Auto-generate insights from available data
                console.log(`🤖 Auto-generating insights from ${hasTrackingData ? 'tracking' : 'dashboard'} data`)
                try {
                  const { HealthInsightsService } = await import('@/lib/services/health-insights')
                  const newInsights = await HealthInsightsService.generateHealthInsights(userId)
                  if (newInsights && newInsights.insights) {
                    analyticsData.insights = [newInsights]
                    console.log('✅ Auto-generated insights successfully')
                  } else {
                    analyticsData.insights = []
                    console.log('⚠️ Insights generation returned no data')
                  }
                } catch (genError) {
                  console.error('Failed to auto-generate insights:', genError)
                  analyticsData.insights = []
                }
              } else {
                console.log('⚠️ No sufficient data for insights generation (no tracking data or dashboard data)')
                // Use existing insights as fallback even if old
                if (!queryError && existingInsights && existingInsights.length > 0) {
                  console.log('📊 Using old insights as fallback')
                  analyticsData.insights = existingInsights.map(insight => ({
                    id: insight.id,
                    insight_type: insight.insight_type,
                    generated_at: insight.generated_at,
                    insights: insight.insights
                  }))
                } else {
                  analyticsData.insights = []
                }
              }
            } else {
              // Using existing recent insights
              console.log('✅ Using recent insights from database')
            }
          } catch (insightError) {
            console.error('Failed to get insights from database:', insightError.message)
            analyticsData.insights = []
          }
        }
        
        // Health score already set from dashboard data above for consistency
        
        console.log('✅ Real analytics data generated successfully')
      } catch (error) {
        console.error('Failed to get real analytics data:', error.message)
        throw error
      }
    }

    // Only use real data - no mock fallbacks
    if (!analyticsData) {
      return NextResponse.json({
        success: false,
        error: 'No user authenticated or data unavailable',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      source: userId && analyticsData.data_points > 0 ? 'real' : 'mock',
      timestamp: new Date().toISOString(),
      user_authenticated: !!userId,
      insights_available: analyticsData.insights?.length > 0
    })
  } catch (error) {
    console.error('Analytics API error:', error)
            // Return error if no authenticated user
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// All data comes from real Supabase sources - no mock/synthetic data

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { insightType = 'on_demand', forceGenerate = false } = body
    
    // Get user ID from Authorization header
    let userId = null
    try {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (user && !error) {
          userId = user.id
        }
      }
    } catch (authError) {
      console.log('Auth failed for insight generation:', authError.message)
    }

    // Try to generate real insights from user data
    if (userId) {
      try {
        console.log(`🧠 Generating insights for user ${userId}`)
        
        // Check if we should use existing insights or generate new ones
        if (!forceGenerate) {
          // Check for recent insights (within the last 6 hours for on_demand)
          const hoursThreshold = insightType === 'on_demand' ? 6 : 24
          const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)
          
          console.log(`🔍 Checking for recent insights newer than: ${cutoffTime.toISOString()}`)
          const { data: recentInsights, error: queryError } = await supabaseAdmin
          .from('health_insights')
          .select('*')
          .eq('user_id', userId)
            .gte('generated_at', cutoffTime.toISOString())
          .order('generated_at', { ascending: false })
          .limit(1)
        
          if (!queryError && recentInsights && recentInsights.length > 0) {
            console.log('✅ Found recent insights in database')
            const insight = recentInsights[0]
          return NextResponse.json({
            success: true,
            insights: {
              id: insight.id,
              insight_type: insight.insight_type,
              generated_at: insight.generated_at,
              insights: insight.insights
            },
            source: 'database',
              timestamp: new Date().toISOString()
            })
          }
        }
        
        // Generate new insights from real user data
        console.log('🔄 Generating fresh insights from user data...')
        const { HealthInsightsService } = await import('@/lib/services/health-insights')
        
        try {
          const newInsight = await HealthInsightsService.generateHealthInsights(userId, insightType)
          
          console.log('✅ Successfully generated new insights')
          return NextResponse.json({
            success: true,
            insights: {
              id: newInsight.id || 'generated',
              insight_type: newInsight.insight_type,
              generated_at: newInsight.generated_at,
              insights: newInsight.insights
            },
            source: 'generated',
            timestamp: new Date().toISOString()
          })
        } catch (insightError) {
          console.log('Failed to generate insights, trying basic approach:', insightError.message)
          
          // If insights generation fails, try to create a simple one
          const basicInsight = {
            id: 'basic_' + Date.now(),
            insight_type: insightType,
            generated_at: new Date().toISOString(),
            insights: {
              summary: 'Health insights are being prepared. Please complete your profile setup for more personalized analysis.',
              trends: [],
              recommendations: [
                'Complete your profile setup for personalized insights',
                'Start tracking your health metrics regularly',
                'Visit the tracking page to log health data'
              ],
              achievements: [],
              correlations: []
            }
          }
          
          return NextResponse.json({
            success: true,
            insights: basicInsight,
            source: 'basic_generated',
            timestamp: new Date().toISOString()
          })
        }
        
      } catch (error) {
        console.log('Failed to generate real insights:', error.message)
        
        // Try to get any existing insights as fallback
        try {
          const { data: anyInsights, error: fallbackError } = await supabaseAdmin
            .from('health_insights')
            .select('*')
            .eq('user_id', userId)
            .order('generated_at', { ascending: false })
            .limit(1)
          
          if (!fallbackError && anyInsights && anyInsights.length > 0) {
            console.log('📋 Using fallback insights from database')
            const insight = anyInsights[0]
            return NextResponse.json({
              success: true,
              insights: {
                id: insight.id,
                insight_type: insight.insight_type,
                generated_at: insight.generated_at,
                insights: insight.insights
              },
              source: 'database_fallback',
              timestamp: new Date().toISOString()
            })
          }
        } catch (fallbackError) {
          console.log('Fallback insights also failed:', fallbackError.message)
        }
      }
    }
    
    // No user authenticated or data available
    return NextResponse.json({
      success: false,
      error: 'No user authenticated or insufficient data for insights generation',
      timestamp: new Date().toISOString()
    }, { status: 401 })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}