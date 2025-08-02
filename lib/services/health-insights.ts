import { supabase } from '@/lib/supabase'
import { DatabaseService, TrackingEntry } from '@/lib/database'
import { HealthInsight, UserAlert, HealthScore } from '@/lib/database/types'
import { LLMService } from '@/lib/llm-services'
import { HealthAnalyticsService } from './health-analytics'

interface LLMResponse {
  success: boolean
  content: string
  service?: string
  error?: string
}

export class HealthInsightsService {
  private static llmService = new LLMService()

  /**
   * Automatically trigger insights generation when new tracking data is added
   */
  static async checkAndGenerateInsights(userId: string, newEntry: TrackingEntry): Promise<void> {
    console.log(`🤖 Auto-checking insights for user ${userId} after new ${newEntry.tool_id} entry`)
    
    try {
      // Get recent tracking data to analyze patterns
      const recentEntries = await DatabaseService.getRecentTrackingEntries(userId, 7) // Last 7 days
      
      // Check if insights should be triggered
      const shouldGenerate = await this.shouldGenerateInsights(userId, newEntry, recentEntries)
      
      if (shouldGenerate.generate) {
        console.log(`✨ Triggering ${shouldGenerate.type} insights: ${shouldGenerate.reason}`)
        await this.generateHealthInsights(userId, shouldGenerate.type)
      } else {
        console.log(`⏸️ No insights needed: ${shouldGenerate.reason}`)
      }
    } catch (error) {
      console.error('Error in auto insights generation:', error)
    }
  }

  /**
   * Determine if insights should be generated based on new tracking data
   */
  private static async shouldGenerateInsights(
    userId: string, 
    newEntry: TrackingEntry, 
    recentEntries: TrackingEntry[]
  ): Promise<{generate: boolean, type: 'daily' | 'weekly' | 'triggered', reason: string}> {
    
    // Check for last insights
    const lastInsight = await this.getLastInsight(userId)
    const now = new Date()
    const daysSinceLastInsight = lastInsight ? 
      Math.floor((now.getTime() - new Date(lastInsight.generated_at).getTime()) / (1000 * 60 * 60 * 24)) : 
      999
    
    // Trigger conditions
    const triggers = {
      // Daily insights if no insights in 24 hours and good data
      daily: daysSinceLastInsight >= 1 && recentEntries.length >= 3,
      
      // Weekly insights if no insights in 7 days
      weekly: daysSinceLastInsight >= 7,
      
      // Triggered insights for important patterns
      triggered: this.detectImportantPatterns(newEntry, recentEntries)
    }

    // Priority: triggered > daily > weekly
    if (triggers.triggered) {
      return { generate: true, type: 'triggered', reason: 'Important health pattern detected' }
    } else if (triggers.daily) {
      return { generate: true, type: 'daily', reason: `${daysSinceLastInsight} days since last insights, sufficient data available` }
    } else if (triggers.weekly) {
      return { generate: true, type: 'weekly', reason: `${daysSinceLastInsight} days since last insights` }
    }
    
    return { generate: false, type: 'daily', reason: `Recent insights exist (${daysSinceLastInsight}d ago), not enough new data` }
  }

  /**
   * Detect important patterns that should trigger immediate insights
   */
  private static detectImportantPatterns(newEntry: TrackingEntry, recentEntries: TrackingEntry[]): boolean {
    const toolId = newEntry.tool_id
    const newData = newEntry.data as any
    
    // Filter entries for the same tool
    const sameToolEntries = recentEntries.filter(entry => entry.tool_id === toolId)
    
    if (sameToolEntries.length < 3) return false // Need some history
    
    // Tool-specific pattern detection
    switch (toolId) {
      case 'glucose-tracker':
        return this.detectGlucosePatterns(newData, sameToolEntries)
      case 'mood-tracker':
        return this.detectMoodPatterns(newData, sameToolEntries)
      case 'sleep-tracker':
        return this.detectSleepPatterns(newData, sameToolEntries)
      case 'vital-signs-tracker':
        return this.detectVitalSignsPatterns(newData, sameToolEntries)
      default:
        return false
    }
  }

  private static detectGlucosePatterns(newData: any, history: TrackingEntry[]): boolean {
    const newGlucose = newData.glucose || newData.value
    if (!newGlucose) return false
    
    const recentValues = history.slice(-5).map(e => (e.data as any).glucose || (e.data as any).value).filter(Boolean)
    
    // Trigger if outside normal range
    if (newGlucose < 70 || newGlucose > 180) return true
    
    // Trigger if significant trend change
    if (recentValues.length >= 3) {
      const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
      const deviation = Math.abs(newGlucose - avg)
      return deviation > 30 // 30+ mg/dL deviation
    }
    
    return false
  }

  private static detectMoodPatterns(newData: any, history: TrackingEntry[]): boolean {
    const newMood = newData.mood || newData.score
    if (!newMood) return false
    
    const recentScores = history.slice(-5).map(e => (e.data as any).mood || (e.data as any).score).filter(Boolean)
    
    // Trigger for very low mood
    if (newMood <= 3) return true
    
    // Trigger for significant mood changes
    if (recentScores.length >= 3) {
      const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      const change = Math.abs(newMood - avg)
      return change >= 3 // 3+ point change
    }
    
    return false
  }

  private static detectSleepPatterns(newData: any, history: TrackingEntry[]): boolean {
    const newSleep = newData.hours || newData.duration
    if (!newSleep) return false
    
    // Trigger for very poor sleep
    if (newSleep < 5 || newSleep > 10) return true
    
    const recentHours = history.slice(-3).map(e => (e.data as any).hours || (e.data as any).duration).filter(Boolean)
    
    // Trigger for sleep pattern disruption
    if (recentHours.length >= 2) {
      const avg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length
      const change = Math.abs(newSleep - avg)
      return change >= 2 // 2+ hour change
    }
    
    return false
  }

  private static detectVitalSignsPatterns(newData: any, history: TrackingEntry[]): boolean {
    // Check blood pressure if available
    if (newData.systolic && newData.diastolic) {
      const sys = newData.systolic
      const dia = newData.diastolic
      
      // Trigger for concerning BP readings
      if (sys >= 140 || dia >= 90 || sys <= 90 || dia <= 60) return true
    }
    
    // Check heart rate
    if (newData.heartRate) {
      const hr = newData.heartRate
      if (hr >= 100 || hr <= 50) return true
    }
    
    return false
  }

  /**
   * Get the last insight for a user
   */
  private static async getLastInsight(userId: string): Promise<HealthInsight | null> {
    try {
      const { data, error } = await supabase
        .from('health_insights')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching last insight:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error in getLastInsight:', error)
      return null
    }
  }

  /**
   * Generate comprehensive health insights for a user
   */
  static async generateHealthInsights(
    userId: string, 
    insightType: 'daily' | 'weekly' | 'monthly' | 'triggered' | 'on_demand' = 'weekly'
  ): Promise<HealthInsight> {
    console.log(`🧠 Generating ${insightType} health insights for user ${userId}`)
    
    const startTime = Date.now()
    
    // Get user data
    const [userProfile, userConditions, trackingData, previousInsights] = await Promise.all([
      DatabaseService.getUserProfile(userId),
              DatabaseService.getUserHealthConditions(userId),
      this.getRecentTrackingData(userId, insightType),
      this.getPreviousInsights(userId, insightType)
    ])

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    if (trackingData.length === 0) {
      console.log('⚠️ No tracking data found for insights generation')
      return this.createEmptyInsight(userId, insightType)
    }

    // Structure data for LLM analysis
    const structuredData = this.structureDataForAnalysis(trackingData, userConditions, userProfile)
    
    // Generate insights using LLM
    const insightsResponse = await this.generateInsightsWithLLM(structuredData, userConditions, previousInsights)
    
    // Parse and validate LLM response
    const parsedInsights = this.parseInsightsResponse(insightsResponse)
    
    // Generate alerts based on data analysis
    const alerts = await this.generateAlerts(userId, trackingData, userConditions)
    
    // Create health insight object
    const healthInsight: HealthInsight = {
      user_id: userId,
      insight_type: insightType,
      insights: parsedInsights,
      alerts: alerts,
      metadata: {
        processing_time_ms: Date.now() - startTime,
        data_points_analyzed: trackingData.length,
        llm_service_used: insightsResponse.service,
        confidence_score: this.calculateConfidenceScore(trackingData, parsedInsights)
      },
      generated_at: new Date().toISOString()
    }

    // Save to database
    const savedInsight = await this.saveHealthInsight(healthInsight)
    
    console.log(`✅ Health insights generated in ${Date.now() - startTime}ms`)
    return savedInsight
  }

  /**
   * Generate insights using the existing LLM service
   */
  private static async generateInsightsWithLLM(
    structuredData: any, 
    userConditions: any[], 
    previousInsights: HealthInsight[]
  ): Promise<LLMResponse> {
    const prompt = this.createInsightsPrompt(structuredData, userConditions, previousInsights)
    
    try {
      // Use the existing LLM service's enhanceQuery method
      const response = await this.llmService.enhanceQuery(prompt, [])
      
      return {
        success: response.success,
        content: response.content,
        service: response.service,
        error: response.error
      }
    } catch (error) {
      console.error('Error generating insights with LLM:', error)
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create structured prompt for LLM analysis
   */
  private static createInsightsPrompt(
    structuredData: any, 
    userConditions: any[], 
    previousInsights: HealthInsight[]
  ): string {
    const conditionsText = userConditions.map(c => `${c.name} (${c.severity})`).join(', ')
    const previousInsightsText = previousInsights.length > 0 
      ? `Previous insights to consider: ${JSON.stringify(previousInsights.slice(0, 2), null, 2)}`
      : 'No previous insights available.'

    return `
You are a medical AI assistant analyzing health tracking data to provide personalized insights and recommendations.

PATIENT CONTEXT:
- Health Conditions: ${conditionsText || 'None reported'}
- Data Period: ${structuredData.period}
- Total Data Points: ${structuredData.totalEntries}

TRACKING DATA SUMMARY:
${JSON.stringify(structuredData.summary, null, 2)}

DETAILED METRICS:
${JSON.stringify(structuredData.metrics, null, 2)}

${previousInsightsText}

TASK: Analyze this health data and provide comprehensive insights in the following JSON format:

{
  "trends": [
    {
      "metric": "string (e.g., 'glucose_level', 'sleep_quality')",
      "direction": "improving" | "declining" | "stable",
      "confidence": 0.0-1.0,
      "description": "Clear explanation of the trend"
    }
  ],
  "concerns": [
    {
      "type": "string (e.g., 'glucose_control', 'sleep_pattern')",
      "severity": "low" | "medium" | "high",
      "description": "Description of the concern",
      "recommendations": ["actionable recommendation 1", "recommendation 2"]
    }
  ],
  "recommendations": [
    {
      "category": "string (e.g., 'nutrition', 'exercise', 'medication')",
      "action": "Specific actionable recommendation",
      "priority": "low" | "medium" | "high",
      "rationale": "Explanation of why this recommendation is important"
    }
  ],
  "achievements": [
    {
      "type": "string (e.g., 'consistency', 'improvement')",
      "description": "Positive achievement to celebrate",
      "metric_improvement": 0.0-100.0
    }
  ]
}

IMPORTANT GUIDELINES:
1. Focus on actionable insights based on the actual data
2. Consider the user's specific health conditions
3. Be encouraging but realistic
4. Prioritize safety - flag concerning patterns
5. Provide specific, measurable recommendations
6. Reference previous insights to show progress
7. CRITICAL: Return ONLY valid JSON with no additional text, explanations, or markdown formatting

ANALYZE THE DATA AND PROVIDE INSIGHTS AS VALID JSON:
`
  }

  /**
   * Parse LLM response into structured insights
   */
  private static parseInsightsResponse(response: LLMResponse): any {
    if (!response.success || !response.content) {
      console.warn('LLM response unsuccessful or empty, using fallback')
      return this.getDefaultInsights()
    }

    try {
      // Multiple strategies to extract and parse JSON
      
      // Strategy 1: Look for complete JSON blocks with balanced braces
      const jsonPatterns = [
        /```json\s*(\{[\s\S]*?\})\s*```/g, // Markdown JSON blocks
        /```\s*(\{[\s\S]*?\})\s*```/g,     // Markdown blocks without language
        /(\{[\s\S]*?\})/g                   // Any JSON-like structure
      ]
      
      let parsedInsights = null
      
      for (const pattern of jsonPatterns) {
        const matches = [...response.content.matchAll(pattern)]
        
        for (const match of matches) {
          const jsonCandidate = match[1] || match[0]
          
          try {
            // Attempt to balance braces if needed
            const balancedJson = this.balanceJsonBraces(jsonCandidate)
            parsedInsights = JSON.parse(balancedJson)
            
            // Validate structure
            if (this.validateInsightsStructure(parsedInsights)) {
              console.log('✅ Successfully parsed LLM insights')
              return parsedInsights
            }
          } catch (parseError) {
            // Continue to next candidate
            continue
          }
        }
      }
      
      // Strategy 2: Try to parse the entire response as JSON
      try {
        parsedInsights = JSON.parse(response.content)
        if (this.validateInsightsStructure(parsedInsights)) {
          return parsedInsights
        }
      } catch (directParseError) {
        // Continue to fallback
      }
      
      console.warn('No valid JSON found in LLM response, using fallback')
      console.log('LLM Response preview:', response.content.substring(0, 200) + '...')
      return this.getDefaultInsights()
      
    } catch (error) {
      console.error('Error parsing insights response:', error)
      console.log('Response content:', response.content?.substring(0, 500))
      return this.getDefaultInsights()
    }
  }

  /**
   * Attempt to balance JSON braces for malformed JSON
   */
  private static balanceJsonBraces(jsonStr: string): string {
    let openBraces = 0
    let lastValidIndex = 0
    
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') {
        openBraces++
      } else if (jsonStr[i] === '}') {
        openBraces--
        if (openBraces === 0) {
          lastValidIndex = i
        }
      }
    }
    
    // If braces are balanced, return as is
    if (openBraces === 0) {
      return jsonStr
    }
    
    // Try to cut at last valid closing brace
    if (lastValidIndex > 0) {
      return jsonStr.substring(0, lastValidIndex + 1)
    }
    
    // Add missing closing braces
    return jsonStr + '}'.repeat(openBraces)
  }

  /**
   * Validate insights structure
   */
  private static validateInsightsStructure(insights: any): boolean {
    return !!(
      insights &&
      typeof insights === 'object' &&
      (insights.trends || insights.recommendations || insights.concerns || insights.summary)
    )
  }

  /**
   * Generate alerts based on data analysis
   */
  private static async generateAlerts(
    userId: string, 
    trackingData: TrackingEntry[], 
    userConditions: any[]
  ): Promise<any[]> {
    const alerts: any[] = []
    
    // Group data by tool type
    const groupedData = this.groupDataByTool(trackingData)
    
    // Check glucose levels for diabetic users
    if (userConditions.some(c => c.condition_id.includes('diabetes'))) {
      const glucoseAlerts = this.checkGlucoseAlerts(groupedData['glucose-tracker'] || [])
      alerts.push(...glucoseAlerts)
    }

    // Check medication adherence
    const medicationAlerts = this.checkMedicationAlerts(groupedData['medication-reminder'] || [])
    alerts.push(...medicationAlerts)

    // Check vital signs
    const vitalSignsAlerts = this.checkVitalSignsAlerts(groupedData['vital-signs-tracker'] || [])
    alerts.push(...vitalSignsAlerts)

    // Check sleep patterns
    const sleepAlerts = this.checkSleepAlerts(groupedData['sleep-tracker'] || [])
    alerts.push(...sleepAlerts)

    return alerts
  }

  /**
   * Check glucose level alerts
   */
  private static checkGlucoseAlerts(glucoseEntries: TrackingEntry[]): any[] {
    const alerts: any[] = []
    
    if (glucoseEntries.length === 0) return alerts

    const recentEntries = glucoseEntries
      .filter(entry => new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(entry => parseFloat(entry.data.glucose_level))
      .filter(level => !isNaN(level))

    // Check for consistently high glucose
    const highReadings = recentEntries.filter(level => level > 180)
    if (highReadings.length > 2) {
      alerts.push({
        type: 'glucose_high',
        severity: 'urgent' as const,
        message: `${highReadings.length} high glucose readings (>180 mg/dL) in the past week`,
        action_required: 'Consider contacting your healthcare provider'
      })
    }

    // Check for very low glucose
    const lowReadings = recentEntries.filter(level => level < 70)
    if (lowReadings.length > 0) {
      alerts.push({
        type: 'glucose_low',
        severity: 'critical' as const,
        message: `${lowReadings.length} low glucose readings (<70 mg/dL) detected`,
        action_required: 'Monitor closely and treat hypoglycemia as needed'
      })
    }

    return alerts
  }

  /**
   * Check medication adherence alerts
   */
  private static checkMedicationAlerts(medicationEntries: TrackingEntry[]): any[] {
    const alerts: any[] = []
    
    if (medicationEntries.length === 0) return alerts

    const recentEntries = medicationEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const missedDoses = recentEntries.filter(entry => entry.data.taken === false)
    const adherenceRate = ((recentEntries.length - missedDoses.length) / recentEntries.length) * 100

    if (adherenceRate < 80) {
      alerts.push({
        type: 'medication_adherence',
        severity: 'warning' as const,
        message: `Medication adherence is ${adherenceRate.toFixed(1)}% (${missedDoses.length} missed doses)`,
        action_required: 'Review medication schedule and set reminders'
      })
    }

    return alerts
  }

  /**
   * Check vital signs alerts
   */
  private static checkVitalSignsAlerts(vitalEntries: TrackingEntry[]): any[] {
    const alerts: any[] = []
    
    if (vitalEntries.length === 0) return alerts

    const recentEntries = vitalEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    for (const entry of recentEntries) {
      const systolic = parseFloat(entry.data.blood_pressure_systolic)
      const diastolic = parseFloat(entry.data.blood_pressure_diastolic)
      const heartRate = parseFloat(entry.data.heart_rate)

      // Check blood pressure
      if (systolic > 140 || diastolic > 90) {
        alerts.push({
          type: 'blood_pressure_high',
          severity: 'warning' as const,
          message: `High blood pressure reading: ${systolic}/${diastolic} mmHg`,
          action_required: 'Monitor blood pressure and consult healthcare provider if persistently high'
        })
      }

      // Check heart rate
      if (heartRate > 100) {
        alerts.push({
          type: 'heart_rate_high',
          severity: 'info' as const,
          message: `Elevated heart rate: ${heartRate} bpm`,
          action_required: 'Monitor heart rate and note any symptoms'
        })
      }
    }

    return alerts
  }

  /**
   * Check sleep pattern alerts
   */
  private static checkSleepAlerts(sleepEntries: TrackingEntry[]): any[] {
    const alerts: any[] = []
    
    if (sleepEntries.length === 0) return alerts

    const recentEntries = sleepEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const avgSleep = recentEntries.reduce((sum, entry) => 
      sum + parseFloat(entry.data.hours_slept || 0), 0
    ) / recentEntries.length

    if (avgSleep < 6) {
      alerts.push({
        type: 'sleep_insufficient',
        severity: 'warning' as const,
        message: `Average sleep duration is ${avgSleep.toFixed(1)} hours (recommended: 7-9 hours)`,
        action_required: 'Improve sleep hygiene and consider consulting a healthcare provider'
      })
    }

    return alerts
  }

  /**
   * Helper methods
   */
  private static async getRecentTrackingData(userId: string, insightType: string): Promise<TrackingEntry[]> {
    const days = this.getAnalysisPeriod(insightType)
    return await DatabaseService.getTrackingEntries(userId, undefined, 500)
  }

  private static getAnalysisPeriod(insightType: string): number {
    switch (insightType) {
      case 'daily': return 1
      case 'weekly': return 7
      case 'monthly': return 30
      default: return 7
    }
  }

  private static async getPreviousInsights(userId: string, insightType: string): Promise<HealthInsight[]> {
    try {
      const { data, error } = await supabase
        .from('health_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('insight_type', insightType)
        .order('generated_at', { ascending: false })
        .limit(2)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching previous insights:', error)
      return []
    }
  }

  private static structureDataForAnalysis(
    trackingData: TrackingEntry[], 
    userConditions: any[], 
    userProfile: any
  ): any {
    const summary = this.createDataSummary(trackingData)
    const metrics = this.extractDetailedMetrics(trackingData)
    
    return {
      period: this.calculateDataPeriod(trackingData),
      totalEntries: trackingData.length,
      summary,
      metrics,
      userProfile: {
        age: userProfile.age,
        conditions: userConditions.map(c => c.name)
      }
    }
  }

  private static createDataSummary(trackingData: TrackingEntry[]): any {
    const toolSummary: Record<string, any> = {}
    
    for (const entry of trackingData) {
      if (!toolSummary[entry.tool_id]) {
        toolSummary[entry.tool_id] = { count: 0, latest: null }
      }
      toolSummary[entry.tool_id].count++
      if (!toolSummary[entry.tool_id].latest || 
          new Date(entry.timestamp) > new Date(toolSummary[entry.tool_id].latest)) {
        toolSummary[entry.tool_id].latest = entry.timestamp
      }
    }
    
    return toolSummary
  }

  private static extractDetailedMetrics(trackingData: TrackingEntry[]): any {
    return HealthAnalyticsService.getAnalyticsData('temp', '30d') // Would be refactored to extract just metrics
  }

  private static calculateDataPeriod(trackingData: TrackingEntry[]): string {
    if (trackingData.length === 0) return '0 days'
    
    const timestamps = trackingData.map(entry => new Date(entry.timestamp).getTime())
    const earliestTime = Math.min(...timestamps)
    const latestTime = Math.max(...timestamps)
    const daysDiff = Math.ceil((latestTime - earliestTime) / (1000 * 60 * 60 * 24))
    
    return `${daysDiff} days`
  }

  private static calculateConfidenceScore(trackingData: TrackingEntry[], insights: any): number {
    // Base confidence on data quantity and recency
    const dataPoints = trackingData.length
    const recentData = trackingData.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    let confidence = 0.5 // Base confidence
    
    // Increase confidence based on data quantity
    if (dataPoints > 50) confidence += 0.2
    else if (dataPoints > 20) confidence += 0.1
    
    // Increase confidence based on recent data
    if (recentData > 10) confidence += 0.2
    else if (recentData > 5) confidence += 0.1
    
    // Decrease confidence if insights are sparse
    if (!insights.trends || insights.trends.length === 0) confidence -= 0.2
    
    return Math.max(0.1, Math.min(0.9, confidence))
  }

  private static groupDataByTool(trackingData: TrackingEntry[]): Record<string, TrackingEntry[]> {
    return trackingData.reduce((groups, entry) => {
      if (!groups[entry.tool_id]) {
        groups[entry.tool_id] = []
      }
      groups[entry.tool_id].push(entry)
      return groups
    }, {} as Record<string, TrackingEntry[]>)
  }

  private static getDefaultInsights(): any {
    return {
      trends: [],
      concerns: [],
      recommendations: [
        {
          category: 'general',
          action: 'Continue consistent health tracking to gather more data for analysis',
          priority: 'medium',
          rationale: 'More data will enable better personalized insights'
        }
      ],
      achievements: []
    }
  }

  private static createEmptyInsight(userId: string, insightType: string): HealthInsight {
    return {
      user_id: userId,
      insight_type: insightType,
      insights: this.getDefaultInsights(),
      alerts: [],
      metadata: {
        processing_time_ms: 0,
        data_points_analyzed: 0,
        confidence_score: 0.1
      },
      generated_at: new Date().toISOString()
    }
  }

  private static async saveHealthInsight(insight: HealthInsight): Promise<HealthInsight> {
    const { data, error } = await supabase
      .from('health_insights')
      .insert(insight)
      .select()
      .single()

    if (error) {
      console.error('Error saving health insight:', error)
      throw error
    }

    return data
  }
}