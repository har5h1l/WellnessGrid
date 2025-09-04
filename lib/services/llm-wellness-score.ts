import { createClient } from '@supabase/supabase-js'
import { HealthScore, TrackingEntry } from '@/lib/database/types'

// Create admin client for server-side operations
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

interface LLMWellnessScoreRequest {
  userId: string
  scorePeriod: string
  trackingData: TrackingEntry[]
  userProfile: any
  userConditions: any[]
  previousScores?: HealthScore[]
}

interface LLMWellnessScoreResponse {
  overall_score: number
  component_scores: Record<string, number>
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  reasoning: string
  recommendations: string[]
  confidence: number
}

export class LLMWellnessScoreService {
  
  /**
   * Calculate wellness score using LLM for more nuanced analysis
   */
  static async calculateWellnessScore(
    userId: string, 
    scorePeriod: string = '7d'
  ): Promise<HealthScore> {
    console.log(`🧠 Calculating LLM-based wellness score for user ${userId} (${scorePeriod})`)
    
    try {
      // Get user data
      const [userProfile, userConditions, trackingData, previousScores] = await Promise.all([
        this.getUserProfileAdmin(userId),
        this.getUserHealthConditionsAdmin(userId), 
        this.getRecentTrackingData(userId, scorePeriod),
        this.getPreviousScores(userId, scorePeriod)
      ])

      if (!userProfile) {
        throw new Error('User profile not found')
      }

      // Prepare data for LLM analysis
      const request: LLMWellnessScoreRequest = {
        userId,
        scorePeriod,
        trackingData,
        userProfile,
        userConditions,
        previousScores
      }

      // Generate wellness score using LLM
      const llmResponse = await this.generateWellnessScoreWithLLM(request)
      
      // Create health score object
      const healthScore: HealthScore = {
        user_id: userId,
        overall_score: Math.round(llmResponse.overall_score * 100) / 100,
        component_scores: llmResponse.component_scores,
        trend: llmResponse.trend,
        score_period: scorePeriod,
        calculated_at: new Date().toISOString()
      }

      // Save to database
      await this.saveHealthScore(healthScore)
      
      console.log(`✅ LLM Wellness score calculated: ${healthScore.overall_score}/100`)
      console.log(`🧠 Reasoning: ${llmResponse.reasoning}`)
      console.log(`💡 Recommendations: ${llmResponse.recommendations.join(', ')}`)
      
      return healthScore

    } catch (error) {
      console.error('Error calculating LLM wellness score:', error)
      throw error
    }
  }

  /**
   * Generate wellness score using LLM
   */
  private static async generateWellnessScoreWithLLM(request: LLMWellnessScoreRequest): Promise<LLMWellnessScoreResponse> {
    try {
      // Structure the data for LLM analysis
      const structuredData = this.structureDataForLLM(request)
      
      // Create prompt for LLM
      const prompt = this.createWellnessScorePrompt(structuredData)
      
      // Use direct LLM services instead of the ask API (which requires Flask backend)
      console.log('🧠 Calling direct LLM services for wellness score calculation...')
      
      const { llmService } = await import('@/lib/llm-services')
      const llmResponse = await llmService.generateStructuredResponse(prompt)
      
      if (!llmResponse.success) {
        throw new Error(`LLM service error: ${llmResponse.error}`)
      }

      console.log('🧠 LLM Response received:', llmResponse.content)
      
      // Parse LLM response
      return this.parseLLMResponse(llmResponse.content)
      
    } catch (error) {
      console.error('Error generating wellness score with LLM:', error)
      // Fallback to rule-based calculation
      return this.fallbackCalculation(request)
    }
  }

  /**
   * Structure data for LLM analysis
   */
  private static structureDataForLLM(request: LLMWellnessScoreRequest) {
    const { trackingData, userProfile, userConditions, previousScores } = request
    
    // Group tracking data by tool
    const groupedData = trackingData.reduce((acc, entry) => {
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, TrackingEntry[]>)

    // Calculate basic metrics
    const metrics = {
      glucose: this.calculateGlucoseMetrics(groupedData['glucose-tracker'] || []),
      sleep: this.calculateSleepMetrics(groupedData['sleep-tracker'] || []),
      mood: this.calculateMoodMetrics(groupedData['mood-tracker'] || []),
      exercise: this.calculateExerciseMetrics(groupedData['exercise-tracker'] || []),
      medication: this.calculateMedicationMetrics(groupedData['medication-tracker'] || []),
      symptoms: this.calculateSymptomMetrics(groupedData['symptom-tracker'] || [])
    }

    return {
      userProfile: {
        age: userProfile.age,
        gender: userProfile.gender,
        conditions: userConditions.map(c => c.condition_name),
        wellness_score: userProfile.wellness_score
      },
      metrics,
      previousScores: previousScores?.slice(0, 3) || [],
      dataCompleteness: this.calculateDataCompleteness(groupedData),
      trends: this.calculateTrends(groupedData)
    }
  }

  /**
   * Create prompt for LLM wellness score calculation
   */
  private static createWellnessScorePrompt(structuredData: any): string {
    return `You are an expert health analyst. Analyze the following health data and calculate a comprehensive wellness score from 0-100.

USER PROFILE:
- Age: ${structuredData.userProfile.age}
- Gender: ${structuredData.userProfile.gender}
- Health Conditions: ${structuredData.userProfile.conditions.join(', ') || 'None'}
- Previous Wellness Score: ${structuredData.userProfile.wellness_score || 'N/A'}

HEALTH METRICS (Last 7 days):
${this.formatMetricsForPrompt(structuredData.metrics)}

DATA COMPLETENESS: ${structuredData.dataCompleteness}%
TRENDS: ${JSON.stringify(structuredData.trends, null, 2)}

PREVIOUS SCORES: ${structuredData.previousScores.map(s => s.overall_score).join(', ') || 'None'}

TASK:
1. Analyze the health data comprehensively
2. Calculate a wellness score from 0-100 considering:
   - Data quality and completeness
   - Health condition severity and management
   - Lifestyle factors (sleep, exercise, mood)
   - Medication adherence
   - Symptom frequency and severity
   - Trends and patterns
3. Determine if the trend is improving, stable, or declining
4. Provide reasoning for your assessment
5. Suggest 3-5 actionable recommendations

RESPONSE FORMAT (JSON):
{
  "overall_score": 75.5,
  "trend": "improving",
  "reasoning": "Detailed explanation of score calculation...",
  "recommendations": [
    "Increase exercise frequency to 5 days per week",
    "Improve sleep hygiene for better quality",
    "Monitor glucose levels more consistently"
  ],
  "confidence": 0.85
}

Consider the user's health conditions when calculating scores. Be realistic but encouraging. Focus on actionable insights.`
  }

  /**
   * Parse LLM response
   */
  private static parseLLMResponse(response: string): LLMWellnessScoreResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          overall_score: Math.max(0, Math.min(100, parsed.overall_score || 50)),
          component_scores: parsed.component_scores || {},
          trend: parsed.trend || 'stable',
          reasoning: parsed.reasoning || 'Analysis completed',
          recommendations: parsed.recommendations || [],
          confidence: parsed.confidence || 0.7
        }
      }
      
      // Fallback parsing
      return this.fallbackResponse(response)
    } catch (error) {
      console.error('Error parsing LLM response:', error)
      return this.fallbackResponse(response)
    }
  }

  /**
   * Fallback calculation if LLM fails
   */
  private static fallbackCalculation(request: LLMWellnessScoreRequest): LLMWellnessScoreResponse {
    const { trackingData, userProfile } = request
    
    // Group tracking data by tool
    const groupedData = trackingData.reduce((acc, entry) => {
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, TrackingEntry[]>)
    
          // Calculate overall score based on data completeness and quality
      let overallScore = 75 // Base score
      
      // Adjust based on data completeness
      const dataCompleteness = this.calculateDataCompleteness(groupedData)
      if (dataCompleteness > 80) overallScore += 10
      else if (dataCompleteness < 30) overallScore -= 10
      
      // Adjust based on tracking consistency
      const totalEntries = Object.values(groupedData).reduce((sum, entries) => sum + entries.length, 0)
      if (totalEntries >= 20) overallScore += 5
      else if (totalEntries < 5) overallScore -= 5
    
    return {
      overall_score: Math.max(0, Math.min(100, overallScore)),
      component_scores: {},
      trend: 'stable',
      reasoning: 'Fallback calculation used due to LLM unavailability. Based on available tracking data.',
      recommendations: [
        'Continue tracking your health metrics consistently',
        'Aim for 30 minutes of exercise daily',
        'Maintain 7-8 hours of sleep per night',
        'Monitor mood and stress levels regularly'
      ],
      confidence: 0.6
    }
  }

  /**
   * Fallback response parsing
   */
  private static fallbackResponse(response: string): LLMWellnessScoreResponse {
    // Extract score from text if possible
    const scoreMatch = response.match(/(\d+(?:\.\d+)?)/)
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 75
    
    return {
      overall_score: Math.max(0, Math.min(100, score)),
      component_scores: { overall: score },
      trend: 'stable',
      reasoning: 'LLM analysis completed with fallback parsing',
      recommendations: [
        'Continue monitoring health metrics',
        'Maintain healthy lifestyle habits',
        'Schedule regular health checkups'
      ],
      confidence: 0.6
    }
  }

  // Helper methods for data analysis
  private static calculateGlucoseMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { average: null, range: null, consistency: 0 }
    
    const values = entries.map(e => parseFloat(e.data.glucose_level || e.data.value || 0)).filter(v => !isNaN(v))
    if (values.length === 0) return { average: null, range: null, consistency: 0 }
    
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const range = Math.max(...values) - Math.min(...values)
    const consistency = values.length / 7 // Daily tracking rate
    
    return { average, range, consistency }
  }

  private static calculateSleepMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { average_hours: null, quality: null, consistency: 0 }
    
    const hours = entries.map(e => parseFloat(e.data.duration || e.data.hours || 0)).filter(h => !isNaN(h))
    const quality = entries.map(e => e.data.quality).filter(q => q)
    
    const average_hours = hours.length > 0 ? hours.reduce((a, b) => a + b, 0) / hours.length : null
    const avg_quality = quality.length > 0 ? quality.length : 0
    const consistency = entries.length / 7
    
    return { average_hours, quality: avg_quality, consistency }
  }

  private static calculateMoodMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { average_energy: null, average_stress: null, consistency: 0 }
    
    const energy = entries.map(e => parseFloat(e.data.energy || 0)).filter(e => !isNaN(e))
    const stress = entries.map(e => parseFloat(e.data.stress || 0)).filter(s => !isNaN(s))
    
    const average_energy = energy.length > 0 ? energy.reduce((a, b) => a + b, 0) / energy.length : null
    const average_stress = stress.length > 0 ? stress.reduce((a, b) => a + b, 0) / stress.length : null
    const consistency = entries.length / 7
    
    return { average_energy, average_stress, consistency }
  }

  private static calculateExerciseMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { total_minutes: 0, average_per_day: 0, consistency: 0 }
    
    const minutes = entries.map(e => parseFloat(e.data.duration || 0)).filter(m => !isNaN(m))
    const total_minutes = minutes.reduce((a, b) => a + b, 0)
    const average_per_day = total_minutes / 7
    const consistency = entries.length / 7
    
    return { total_minutes, average_per_day, consistency }
  }

  private static calculateMedicationMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { adherence: 0, consistency: 0 }
    
    const taken = entries.filter(e => e.data.taken === true || e.data.taken === 'true').length
    const adherence = entries.length > 0 ? (taken / entries.length) * 100 : 0
    const consistency = entries.length / 7
    
    return { adherence, consistency }
  }

  private static calculateSymptomMetrics(entries: TrackingEntry[]) {
    if (entries.length === 0) return { frequency: 0, average_severity: 0 }
    
    const severity = entries.map(e => parseFloat(e.data.severity || 0)).filter(s => !isNaN(s))
    const frequency = entries.length
    const average_severity = severity.length > 0 ? severity.reduce((a, b) => a + b, 0) / severity.length : 0
    
    return { frequency, average_severity }
  }

  private static calculateDataCompleteness(groupedData: Record<string, TrackingEntry[]>): number {
    const tools = Object.keys(groupedData)
    const totalEntries = Object.values(groupedData).reduce((sum, entries) => sum + entries.length, 0)
    const expectedEntries = tools.length * 7 // 7 days of data
    
    return Math.min(100, (totalEntries / expectedEntries) * 100)
  }

  private static calculateTrends(groupedData: Record<string, TrackingEntry[]>): Record<string, string> {
    const trends: Record<string, string> = {}
    
    // Simple trend calculation based on data patterns
    Object.entries(groupedData).forEach(([tool, entries]) => {
      if (entries.length >= 3) {
        // Calculate simple trend based on recent vs older entries
        const recent = entries.slice(0, 2)
        const older = entries.slice(-2)
        
        const recentAvg = this.getAverageValue(recent)
        const olderAvg = this.getAverageValue(older)
        
        if (recentAvg > olderAvg * 1.1) trends[tool] = 'improving'
        else if (recentAvg < olderAvg * 0.9) trends[tool] = 'declining'
        else trends[tool] = 'stable'
      } else {
        trends[tool] = 'insufficient_data'
      }
    })
    
    return trends
  }

  private static getAverageValue(entries: TrackingEntry[]): number {
    const values = entries.map(e => {
      const val = e.data.value || e.data.duration || e.data.energy || e.data.glucose_level || 0
      return parseFloat(val) || 0
    }).filter(v => !isNaN(v))
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  private static formatMetricsForPrompt(metrics: any): string {
    return Object.entries(metrics).map(([key, value]) => {
      return `${key.toUpperCase()}: ${JSON.stringify(value, null, 2)}`
    }).join('\n')
  }

  // Database helper methods
  private static async getRecentTrackingData(userId: string, scorePeriod: string): Promise<TrackingEntry[]> {
    const days = this.parseDayRange(scorePeriod)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    try {
      const { data, error } = await supabaseAdmin
        .from('tracking_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching tracking data:', error)
      return []
    }
  }

  private static async getUserProfileAdmin(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  private static async getUserHealthConditionsAdmin(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('health_conditions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching health conditions:', error)
      return []
    }
  }

  private static async getPreviousScores(userId: string, scorePeriod: string): Promise<HealthScore[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('score_period', scorePeriod)
        .order('calculated_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching previous scores:', error)
      return []
    }
  }

  private static async saveHealthScore(healthScore: HealthScore): Promise<void> {
    try {
      // First, delete any existing scores for this user and period to avoid constraint conflicts
      await supabaseAdmin
        .from('health_scores')
        .delete()
        .eq('user_id', healthScore.user_id)
        .eq('score_period', healthScore.score_period)
      
      // Then insert the new score
      const { error } = await supabaseAdmin
        .from('health_scores')
        .insert(healthScore)

      if (error) throw error
      console.log('💾 LLM Health score saved to database (replaced existing)')
      
      // Also update the user profile wellness score for consistency
      try {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .update({ wellness_score: Math.round(healthScore.overall_score) })
          .eq('id', healthScore.user_id)
        
        if (profileError) {
          console.warn('Failed to update user profile wellness score:', profileError)
        } else {
          console.log('💾 User profile wellness score updated to:', Math.round(healthScore.overall_score))
        }
      } catch (profileError) {
        console.warn('Failed to update user profile wellness score:', profileError)
      }
      
    } catch (error) {
      console.error('Error saving health score:', error)
    }
  }

  private static parseDayRange(scorePeriod: string): number {
    switch (scorePeriod) {
      case '1d': return 1
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      default: return 7
    }
  }
}
