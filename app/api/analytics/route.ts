import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HealthAnalyticsService } from '@/lib/services/health-analytics'

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

    // Try to get user ID from Authorization header (from frontend) or return mock data
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
      console.log('Auth failed, will use mock data:', authError.message)
    }

    // Try to get real data using the new analytics service if we have a user
    let analyticsData = null
    if (userId) {
      try {
        console.log(`🔍 Getting analytics for user ${userId} (${timeRange})`)
        analyticsData = await HealthAnalyticsService.getAnalyticsData(userId, timeRange)
        
        // Add insights if requested
        if (includeInsights && analyticsData.insights.length === 0) {
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
            
            if (!queryError && existingInsights && existingInsights.length > 0) {
              console.log(`✅ Found ${existingInsights.length} insights in database`)
              analyticsData.insights = existingInsights.map(insight => ({
                id: insight.id,
                insight_type: insight.insight_type,
                generated_at: insight.generated_at,
                insights: insight.insights
              }))
            } else {
              console.log('💭 No insights found in database, using mock insight')
              analyticsData.insights = [getMockInsight()]
            }
          } catch (insightError) {
            console.log('Failed to get insights from database:', insightError.message)
            analyticsData.insights = [getMockInsight()]
          }
        }
        
        console.log('✅ Real analytics data generated successfully')
      } catch (error) {
        console.log('Failed to get real analytics data, using mock data:', error.message)
      }
    }

    // Fall back to mock data if no user or real data fails
    if (!analyticsData) {
      analyticsData = getMockAnalyticsData(includeInsights)
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      source: userId && analyticsData.data_points > 0 ? 'real' : 'mock',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    // Always fall back to mock data on any error
    return NextResponse.json({
      success: true,
      data: getMockAnalyticsData(false),
      source: 'mock_fallback',
      timestamp: new Date().toISOString()
    })
  }
}

function getMockAnalyticsData(includeInsights: boolean) {
  return {
    trends: [
      { metric_name: 'glucose', trend_direction: 'stable', value: 120, confidence: 0.8, data_points: 15 },
      { metric_name: 'mood', trend_direction: 'improving', value: 7, confidence: 0.9, data_points: 12 },
      { metric_name: 'sleep', trend_direction: 'good', value: 7.5, confidence: 0.85, data_points: 18 }
    ],
    correlations: [
      { metric_1: 'sleep', metric_2: 'mood', correlation: 0.7, significance: 0.05, data_points: 25 }
    ],
    health_score: {
      overall_score: 78,
      trend: 'improving',
      component_scores: {
        glucose: 85,
        mood: 75,
        sleep: 80
      }
    },
    insights: includeInsights ? [getMockInsight()] : [],
    alerts: [],
    goals: [
      {
        goal_id: 'glucose-consistency',
        goal_name: 'Daily glucose tracking',
        target_value: 30,
        current_value: 15,
        progress_percentage: 50,
        status: 'on_track'
      }
    ],
    streaks: [
      { metric_name: 'exercise', current_streak: 5, best_streak: 12 }
    ],
    data_points: 25
  }
}

function getMockInsight() {
  return {
    id: 'insight_1',
    insight_type: 'weekly',
    generated_at: new Date().toISOString(),
    insights: {
      summary: 'Your health metrics show positive trends this week with consistent sleep and mood improvements.',
      trends: [
        {
          metric: 'mood',
          direction: 'improving',
          description: 'Your mood ratings have increased by 15% over the past week',
          confidence: 0.9
        },
        {
          metric: 'sleep',
          direction: 'stable',
          description: 'You\'re maintaining consistent 7-8 hours of sleep per night',
          confidence: 0.85
        },
        {
          metric: 'glucose',
          direction: 'stable',
          description: 'Blood glucose levels remain within healthy ranges',
          confidence: 0.8
        }
      ],
      recommendations: [
        {
          category: 'exercise',
          priority: 'medium',
          action: 'Increase morning walks to 30 minutes to boost mood further',
          rationale: 'Exercise correlates with improved mood in your data'
        },
        {
          category: 'sleep',
          priority: 'low',
          action: 'Continue current sleep schedule',
          rationale: 'Your sleep patterns are optimal and supporting good health'
        },
        {
          category: 'nutrition',
          priority: 'high',
          action: 'Monitor post-meal glucose spikes after carb-heavy meals',
          rationale: 'Some variability detected in afternoon glucose readings'
        }
      ],
      achievements: [
        {
          type: 'Sleep Consistency',
          description: 'Maintained 7+ hours of sleep for 6 consecutive days'
        },
        {
          type: 'Mood Stability',
          description: 'No mood ratings below 5 this week - great emotional balance!'
        }
      ],
      correlations: [
        {
          finding: 'Better sleep quality strongly correlates with higher mood ratings',
          strength: 'strong',
          actionable: 'Continue prioritizing sleep hygiene'
        }
      ]
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { insightType = 'on_demand' } = body
    
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

    // Try to get real insights from database first
    if (userId) {
      try {
        console.log(`🧠 Getting insights for user ${userId}`)
        
        // Query existing insights from database with debugging using admin client
        console.log(`🔍 Querying insights for user: ${userId}`)
        const { data: existingInsights, error: queryError } = await supabaseAdmin
          .from('health_insights')
          .select('*')
          .eq('user_id', userId)
          .order('generated_at', { ascending: false })
          .limit(1)
        
        console.log('📊 Query result:', { 
          error: queryError, 
          insightsCount: existingInsights?.length || 0,
          firstInsight: existingInsights?.[0]?.id 
        })
        
        if (!queryError && existingInsights && existingInsights.length > 0) {
          console.log('✅ Found existing insights in database')
          const insight = existingInsights[0]
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
        
        console.log('💭 No existing insights found, using mock data for now')
      } catch (error) {
        console.log('Failed to get real insights, using mock data:', error.message)
      }
    }
    
    // Fall back to mock insights
    const mockInsights = getMockInsight()
    mockInsights.insight_type = insightType
    mockInsights.insights.summary = `Fresh AI analysis of your health data reveals ${insightType === 'on_demand' ? 'immediate' : 'recent'} patterns and opportunities for improvement.`

    return NextResponse.json({
      success: true,
      insights: mockInsights,
      source: 'mock',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}