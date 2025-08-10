import { HealthAnalyticsService } from './health-analytics'
import { supabase } from '@/lib/supabase'

export interface HealthContextData {
  analytics_summary: string
  recent_trends: string[]
  health_score_context: string
  active_concerns: string[]
  tracking_patterns: string
  personalized_context: string
}

export class HealthContextService {
  /**
   * Generate comprehensive health context for RAG system
   */
  static async generateHealthContext(userId: string): Promise<HealthContextData | null> {
    try {
      console.log(`🏥 Generating health context for user ${userId}`)
      
      // Get user's analytics data
      const analyticsData = await HealthAnalyticsService.getAnalyticsData(userId, '30d')
      
      // Get user profile for additional context
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('conditions, medications, demographics')
        .eq('id', userId)
        .single()

      // Get recent tracking entries for patterns
      const { data: recentEntries } = await supabase
        .from('tracking_entries')
        .select('tool_id, data, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50)

      // Generate context sections
      const analyticsSummary = this.generateAnalyticsSummary(analyticsData)
      const recentTrends = this.extractRecentTrends(analyticsData.trends)
      const healthScoreContext = this.generateHealthScoreContext(analyticsData.health_score)
      const activeConcerns = this.identifyActiveConcerns(analyticsData, userProfile?.conditions || [])
      const trackingPatterns = this.analyzeTrackingPatterns(recentEntries || [])
      const personalizedContext = this.generatePersonalizedContext(userProfile, analyticsData)

      const healthContext: HealthContextData = {
        analytics_summary: analyticsSummary,
        recent_trends: recentTrends,
        health_score_context: healthScoreContext,
        active_concerns: activeConcerns,
        tracking_patterns: trackingPatterns,
        personalized_context: personalizedContext
      }

      console.log('✅ Health context generated successfully')
      return healthContext

    } catch (error) {
      console.error('❌ Failed to generate health context:', error)
      return null
    }
  }

  /**
   * Format health context for RAG prompts
   */
  static formatForRAGPrompt(healthContext: HealthContextData): string {
    const sections = [
      `PATIENT HEALTH SUMMARY:\n${healthContext.analytics_summary}`,
      `RECENT HEALTH TRENDS:\n${healthContext.recent_trends.join('\n')}`,
      `HEALTH SCORE CONTEXT:\n${healthContext.health_score_context}`,
      `ACTIVE HEALTH CONCERNS:\n${healthContext.active_concerns.join('\n')}`,
      `TRACKING PATTERNS:\n${healthContext.tracking_patterns}`,
      `PERSONALIZED CONTEXT:\n${healthContext.personalized_context}`
    ]

    return sections.filter(section => !section.endsWith(':\n')).join('\n\n')
  }

  private static generateAnalyticsSummary(analyticsData: any): string {
    const { health_score, trends, data_points } = analyticsData
    
    const scoreText = health_score 
                  ? `Health score: ${health_score.overall_score.toFixed(1)}/100 (${health_score.trend})`
      : 'Health score: Not available'
    
    const trendCount = trends?.length || 0
    const dataPointsText = data_points > 0 
      ? `Based on ${data_points} data points over the last 30 days`
      : 'Limited recent tracking data available'
    
    return `${scoreText}. Currently tracking ${trendCount} health metrics. ${dataPointsText}.`
  }

  private static extractRecentTrends(trends: any[]): string[] {
    if (!trends || trends.length === 0) {
      return ['No recent health trends available']
    }

    return trends.map(trend => {
      const metric = trend.metric_name
      const direction = trend.trend_direction
      const value = trend.value
      const confidence = Math.round((trend.confidence || 0) * 100)
      
      return `${metric}: ${direction} (current: ${value}, confidence: ${confidence}%)`
    })
  }

  private static generateHealthScoreContext(healthScore: any): string {
    if (!healthScore) {
      return 'Health score data not available'
    }

    const score = healthScore.overall_score
    const trend = healthScore.trend
    const components = healthScore.component_scores || {}
    
    const scoreCategory = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'needs attention'
    const componentText = Object.entries(components)
      .map(([metric, score]) => `${metric}: ${score}/100`)
      .join(', ')
    
    return `Overall health score is ${score}/100 (${scoreCategory}, trending ${trend}). Component scores: ${componentText || 'not available'}.`
  }

  private static identifyActiveConcerns(analyticsData: any, userConditions: string[]): string[] {
    const concerns: string[] = []
    
    // Add user-reported conditions
    if (userConditions.length > 0) {
      concerns.push(`Known conditions: ${userConditions.join(', ')}`)
    }

    // Check trends for concerning patterns
    if (analyticsData.trends) {
      analyticsData.trends.forEach((trend: any) => {
        if (trend.trend_direction === 'concerning' || trend.trend_direction === 'declining') {
          concerns.push(`${trend.metric_name} showing ${trend.trend_direction} trend`)
        }
      })
    }

    // Check health score for low values
    if (analyticsData.health_score?.overall_score < 50) {
      concerns.push('Overall health score indicates need for attention')
    }

    return concerns.length > 0 ? concerns : ['No active health concerns identified']
  }

  private static analyzeTrackingPatterns(recentEntries: any[]): string {
    if (recentEntries.length === 0) {
      return 'No recent tracking activity'
    }

    const toolCounts = recentEntries.reduce((acc, entry) => {
      acc[entry.tool_id] = (acc[entry.tool_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostTracked = Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tool, count]) => `${tool.replace('-tracker', '')}: ${count} entries`)

    const daysSinceLastEntry = Math.floor(
      (Date.now() - new Date(recentEntries[0].timestamp).getTime()) / (1000 * 60 * 60 * 24)
    )

    return `Most tracked metrics in last 7 days: ${mostTracked.join(', ')}. Last tracking activity: ${daysSinceLastEntry} day(s) ago.`
  }

  private static generatePersonalizedContext(userProfile: any, analyticsData: any): string {
    const contextParts: string[] = []

    // Demographics context
    if (userProfile?.demographics) {
      const demo = userProfile.demographics
      if (demo.age) contextParts.push(`Age: ${demo.age}`)
      if (demo.gender) contextParts.push(`Gender: ${demo.gender}`)
    }

    // Medication context
    if (userProfile?.medications && userProfile.medications.length > 0) {
      contextParts.push(`Current medications: ${userProfile.medications.join(', ')}`)
    }

    // Data availability context
    const dataQuality = analyticsData.data_points > 20 ? 'comprehensive' : 
                       analyticsData.data_points > 5 ? 'moderate' : 'limited'
    contextParts.push(`Data availability: ${dataQuality} (${analyticsData.data_points} data points)`)

    return contextParts.length > 0 ? contextParts.join('. ') : 'Basic profile information available'
  }

  /**
   * Get condensed health summary for chat context
   */
  static async getCondensedHealthSummary(userId: string): Promise<string> {
    try {
      const healthContext = await this.generateHealthContext(userId)
      if (!healthContext) {
        return 'No recent health data available for this user.'
      }

      // Create a condensed summary for chat context
      const summary = [
        healthContext.analytics_summary,
        healthContext.active_concerns.length > 1 ? `Active concerns: ${healthContext.active_concerns.slice(0, 2).join('; ')}` : null,
        healthContext.recent_trends.length > 1 ? `Key trends: ${healthContext.recent_trends.slice(0, 2).join('; ')}` : null
      ].filter(Boolean).join(' ')

      return summary

    } catch (error) {
      console.error('Failed to get condensed health summary:', error)
      return 'Unable to retrieve current health summary.'
    }
  }
} 