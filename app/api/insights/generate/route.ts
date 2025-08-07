import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HealthInsightsService } from '@/lib/services/health-insights'

// Create admin client
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, insightType = 'on_demand', forceGenerate = true } = body

    console.log(`🧠 Manual insights generation requested for user: ${userId}`)

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, name, email')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    console.log(`✅ Generating insights for user: ${userProfile.name} (${userProfile.email})`)

    // Generate fresh insights
    const startTime = Date.now()
    const insights = await HealthInsightsService.generateHealthInsights(userId, insightType)
    const processingTime = Date.now() - startTime

    console.log(`✅ Insights generated successfully in ${processingTime}ms`)
    console.log(`📊 Insights summary: ${insights.insights?.summary || 'N/A'}`)
    console.log(`📈 Trends: ${insights.insights?.trends?.length || 0}`)
    console.log(`💡 Recommendations: ${insights.insights?.recommendations?.length || 0}`)
    console.log(`⚠️ Concerns: ${insights.insights?.concerns?.length || 0}`)

    return NextResponse.json({
      success: true,
      data: {
        id: insights.id,
        insight_type: insights.insight_type,
        generated_at: insights.generated_at,
        insights: insights.insights,
        metadata: insights.metadata,
        alerts: insights.alerts
      },
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating insights:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Fetch existing insights
    const { data: insights, error } = await supabaseAdmin
      .from('health_insights')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: insights || [],
      count: insights?.length || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching insights:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
