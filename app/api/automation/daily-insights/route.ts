import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { HealthInsightsService } from '@/lib/services/health-insights'
import { WellnessScoreService } from '@/lib/services/wellness-score'
import { AlertService } from '@/lib/services/alert-service'
import { createServerClient } from '@/lib/supabase-server'

interface ProcessingResult {
  userId: string
  success: boolean
  insights?: any
  healthScore?: any
  alerts?: any[]
  error?: string
  processingTime?: number
}

export async function POST(request: NextRequest) {
  try {
    // Verify automation secret
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.AUTOMATION_SECRET_KEY
    
    if (!authHeader || !secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized automation request' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      insight_type = 'daily',
      score_period = '7d',
      batch_size = 10,
      user_limit = null 
    } = body

    console.log(`🤖 Automation: Processing ${insight_type} insights with ${score_period} scoring period`)

    // Get users to process (active users from last 30 days)
    const supabase = await createServerClient()
    let query = supabase
      .from('user_profiles')
      .select('id, email')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })

    if (user_limit) {
      query = query.limit(user_limit)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active users found to process',
        processed: 0,
        errors: 0
      })
    }

    console.log(`📊 Processing ${users.length} users in batches of ${batch_size}`)

    // Process users in batches
    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    }

    for (let i = 0; i < users.length; i += batch_size) {
      const batch = users.slice(i, i + batch_size)
      
      const batchPromises = batch.map(user => 
        processUserInsights(user.id, insight_type, score_period)
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        const user = batch[index]
        if (result.status === 'fulfilled') {
          results.processed++
          results.details.push({
            user_id: user.id,
            status: 'success',
            ...result.value
          })
        } else {
          results.errors++
          results.details.push({
            user_id: user.id,
            status: 'error',
            error: result.reason?.message || 'Unknown error'
          })
        }
      })

      // Small delay between batches to avoid overwhelming the system
      if (i + batch_size < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Automation completed: ${results.processed} users processed, ${results.errors} errors`,
      ...results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Automation API error:', error)
    return NextResponse.json(
      { 
        error: 'Automation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processUserInsights(
  userId: string, 
  insightType: string, 
  scorePeriod: string
): Promise<ProcessingResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🔄 Processing user ${userId}`)
    
    // Process insights, health score, and alerts in parallel
    const [insights, healthScore, alerts] = await Promise.allSettled([
      HealthInsightsService.generateHealthInsights(userId, insightType as any),
      WellnessScoreService.calculateWellnessScore(userId, scorePeriod),
      AlertService.checkUserAlerts(userId)
    ])

    const result: ProcessingResult = {
      userId,
      success: true,
      processingTime: Date.now() - startTime
    }

    // Handle insights result
    if (insights.status === 'fulfilled') {
      result.insights = {
        id: insights.value.id,
        insight_type: insights.value.insight_type,
        trends_count: insights.value.insights.trends?.length || 0,
        recommendations_count: insights.value.insights.recommendations?.length || 0,
        concerns_count: insights.value.insights.concerns?.length || 0
      }
    } else {
      console.warn(`⚠️ Insights failed for user ${userId}:`, insights.reason)
    }

    // Handle health score result
    if (healthScore.status === 'fulfilled') {
      result.healthScore = {
        overall_score: healthScore.value.overall_score,
        trend: healthScore.value.trend,
        components: Object.keys(healthScore.value.component_scores).length
      }
    } else {
      console.warn(`⚠️ Health score failed for user ${userId}:`, healthScore.reason)
    }

    // Handle alerts result
    if (alerts.status === 'fulfilled') {
      result.alerts = alerts.value.map(alert => ({
        type: alert.alert_type,
        severity: alert.severity,
        title: alert.title
      }))
    } else {
      console.warn(`⚠️ Alerts failed for user ${userId}:`, alerts.reason)
    }

    console.log(`✅ User ${userId} processed in ${result.processingTime}ms`)
    return result

  } catch (error) {
    console.error(`❌ Error processing user ${userId}:`, error)
    return {
      userId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    }
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'daily-insights-automation',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}