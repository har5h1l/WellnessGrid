import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { DatabaseService, TrackingEntry } from '@/lib/database'

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
   * Create basic insights when user profile is missing but tracking data exists
   */
  private static async createBasicInsightFromData(
    userId: string, 
    insightType: string, 
    trackingData: any[]
  ): Promise<HealthInsight> {
    console.log(`🔧 Creating basic insights from ${trackingData.length} tracking entries`)
    
    // Analyze tracking data without user profile context
    const basicAnalysis = this.analyzeTrackingDataBasic(trackingData)
    
    const basicInsight: HealthInsight = {
      user_id: userId,
      insight_type: insightType,
      insights: {
        summary: `Based on your recent health tracking data, here's what we observed from ${trackingData.length} entries.`,
        trends: basicAnalysis.trends,
        recommendations: [
          "Complete your profile setup to get more personalized insights",
          "Continue tracking your health metrics regularly",
          "Consider adding more health conditions to your profile for better analysis"
        ],
        achievements: basicAnalysis.achievements,
        correlations: []
      },
      alerts: [],
      metadata: {
        processing_time_ms: 100,
        data_points_analyzed: trackingData.length,
        llm_service_used: 'basic_analysis',
        confidence_score: 0.6
      },
      generated_at: new Date().toISOString()
    }

    // Save to database
    return await this.saveHealthInsight(basicInsight)
  }

  /**
   * Perform basic analysis of tracking data without user profile
   */
  private static analyzeTrackingDataBasic(trackingData: any[]) {
    const trends: any[] = []
    const achievements: any[] = []
    
    // Group by tool type
    const grouped = trackingData.reduce((acc, entry) => {
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, any[]>)

    // Basic trend analysis for each tool
    Object.entries(grouped).forEach(([toolId, entries]) => {
      if (entries.length >= 2) {
        trends.push({
          metric: toolId.replace('-tracker', '').replace('_', ' '),
          direction: 'stable',
          description: `You've tracked ${entries.length} ${toolId.replace('-tracker', '')} entries recently`,
          confidence: 0.7
        })
      }
    })

    // Basic achievements
    if (trackingData.length >= 5) {
      achievements.push({
        type: 'Tracking Consistency',
        description: `Great job! You've logged ${trackingData.length} health entries recently`
      })
    }

    return { trends, achievements }
  }

  /**
   * Get user profile using admin client for server-side access
   */
  private static async getUserProfileAdmin(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error)
      return null
    }
    return data
  }

  /**
   * Get user health conditions using admin client
   */
  private static async getUserHealthConditionsAdmin(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('health_conditions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user conditions:', error)
      return []
    }
    return data || []
  }

  /**
   * Get the last insight for a user
   */
private static async getLastInsight(userId: string): Promise<HealthInsight | null> {
    try {
      const { data, error } = await supabaseAdmin
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
    
    // Get user data using admin client for server-side access
    const [userProfile, userConditions, trackingData, previousInsights] = await Promise.all([
      this.getUserProfileAdmin(userId),
      this.getUserHealthConditionsAdmin(userId),
      this.getRecentTrackingData(userId, insightType),
      this.getPreviousInsights(userId, insightType)
    ])

    console.log(`📊 Data availability check:`)
    console.log(`  - User profile: ${userProfile ? '✅' : '❌'}`)
    console.log(`  - Health conditions: ${userConditions ? userConditions.length : 0}`)
    console.log(`  - Tracking data: ${trackingData.length} entries`)
    console.log(`  - Previous insights: ${previousInsights.length}`)

    // More intelligent data threshold checking
    const hasMinimumData = trackingData.length >= 3 // At least 3 tracking entries
    const hasRecentData = trackingData.some(entry => {
      const entryDate = new Date(entry.timestamp)
      const daysSinceEntry = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceEntry <= 3 // At least one entry in last 3 days
    })

    console.log(`📊 Data quality check:`)
    console.log(`  - Minimum data (≥3 entries): ${hasMinimumData ? '✅' : '❌'}`)
    console.log(`  - Recent data (≤3 days): ${hasRecentData ? '✅' : '❌'}`)

    // If we have sufficient tracking data, generate insights even without complete profile
    if (!hasMinimumData || !hasRecentData) {
      console.log('⚠️ Insufficient or outdated tracking data for meaningful insights')
      return this.createDataInsufficientInsight(userId, insightType, trackingData.length, userProfile)
    }

    // If no user profile but we have good tracking data, create insights from data only
    if (!userProfile) {
      console.log('⚠️ User profile not found, but have sufficient tracking data - generating basic insights')
      return this.createBasicInsightFromData(userId, insightType, trackingData)
    }

    // Structure data for LLM analysis
    const structuredData = this.structureDataForAnalysis(trackingData, userConditions, userProfile, userId)
    
    // Enhanced logging for debugging
    console.log(`📊 Structured data for LLM:`, JSON.stringify(structuredData, null, 2))
    console.log(`👤 User conditions count: ${userConditions?.length || 0}`)
    console.log(`🏥 User profile available: ${!!userProfile}`)
    
    // Generate insights using LLM with enhanced error handling
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
    const prompt = await this.createInsightsPrompt(structuredData, userConditions, previousInsights)
    
    try {
      // Use the LLM service's generateStructuredResponse method for JSON generation
      const response = await this.llmService.generateStructuredResponse(prompt, [])
      
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
  private static async createInsightsPrompt(
    structuredData: any, 
    userConditions: any[], 
    previousInsights: HealthInsight[]
  ): Promise<string> {
    const conditionsText = userConditions.map(c => `${c.name} (${c.severity})`).join(', ')
    const previousInsightsText = previousInsights.length > 0 
      ? `Previous insights to consider: ${JSON.stringify(previousInsights.slice(0, 2), null, 2)}`
      : 'No previous insights available.'

    // Calculate wellness score components for LLM context
    const wellnessScore = await this.calculateWellnessScoreForLLM(structuredData, userConditions)

    return `
You are a medical AI assistant analyzing health tracking data to provide personalized insights and recommendations.

PATIENT CONTEXT:
- Health Conditions: ${conditionsText || 'None reported'}
- Data Period: ${structuredData.period}
- Total Data Points: ${structuredData.totalEntries}

WELLNESS SCORE ANALYSIS:
${JSON.stringify(wellnessScore, null, 2)}

TRACKING DATA SUMMARY:
${JSON.stringify(structuredData.summary, null, 2)}

DETAILED METRICS:
${JSON.stringify(structuredData.metrics, null, 2)}

${previousInsightsText}

TASK: Analyze this health data and provide comprehensive insights in the following JSON format:

{
  "summary": "2-3 sentence summary of overall health status and key findings from the data analysis",
  "trends": [
    {
      "metric": "string (e.g., 'glucose_level', 'sleep_quality', 'mood', 'exercise')",
      "direction": "improving" | "declining" | "stable",
      "confidence": 0.0-1.0,
      "description": "Clear, specific explanation of the trend with data points or patterns observed"
    }
  ],
  "concerns": [
    {
      "type": "string (e.g., 'glucose_control', 'sleep_pattern', 'medication_adherence')",
      "severity": "low" | "medium" | "high",
      "description": "Detailed description of the health concern based on data patterns",
      "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2"]
    }
  ],
  "recommendations": [
    "Specific, actionable recommendation based on the data (e.g., 'Consider logging blood glucose before and after meals to identify patterns', 'Aim for 7-8 hours of sleep based on your recent sleep data showing improved mood')"
  ],
  "priority_actions": [
    {
      "title": "Short title for priority action (e.g., 'Monitor blood sugar trends', 'Improve sleep consistency')",
      "description": "Brief explanation of why this is important based on data",
      "priority": "high" | "medium" | "low",
      "action_button": "Action text (e.g., 'Track Glucose', 'View Sleep Tips', 'Set Reminder')",
      "category": "glucose" | "mood" | "sleep" | "exercise" | "medication" | "general"
    }
  ],
  "achievements": [
    {
      "type": "string (e.g., 'consistency', 'improvement', 'milestone')",
      "description": "Positive achievement to celebrate with specific metrics when possible",
      "metric_improvement": 0.0-100.0
    }
  ],
  "correlations": [
    {
      "factor1": "health metric name",
      "factor2": "health metric name",
      "correlation": -1.0 to 1.0,
      "strength": "weak" | "moderate" | "strong",
      "finding": "Description of what the correlation means",
      "actionable": "Practical advice based on this correlation"
    }
  ]
}

IMPORTANT GUIDELINES:
1. Focus on actionable insights based on the actual data provided - avoid generic advice
2. Consider the user's specific health conditions and tailor insights accordingly
3. Be encouraging but realistic - celebrate progress while identifying areas for improvement
4. Prioritize safety - flag concerning patterns that may need medical attention
5. Provide specific, measurable recommendations with clear rationales
6. Reference previous insights to show progress and continuity when available
7. Look for meaningful correlations between different health metrics
8. Quantify improvements or declines with specific data points when possible
9. CRITICAL: Return ONLY valid JSON with no additional text, explanations, or markdown formatting
10. Ensure all fields are properly filled with real analysis, not placeholder text

ANALYZE THE DATA AND PROVIDE INSIGHTS AS VALID JSON:
`
  }

  /**
   * Calculate wellness score components for LLM context
   */
  private static async calculateWellnessScoreForLLM(structuredData: any, userConditions: any[]): Promise<any> {
    try {
      // Import WellnessScoreService dynamically to avoid circular dependencies
      const { WellnessScoreService } = await import('./wellness-score')
      
      // Calculate component scores based on tracking data
      const componentScores: Record<string, number> = {}
      
      // Calculate glucose score
      if (structuredData.metrics.glucose) {
        const glucoseEntries = structuredData.metrics.glucose.entries || []
        componentScores.glucose = this.calculateComponentScore(glucoseEntries, 'glucose')
      }
      
      // Calculate sleep score
      if (structuredData.metrics.sleep) {
        const sleepEntries = structuredData.metrics.sleep.entries || []
        componentScores.sleep = this.calculateComponentScore(sleepEntries, 'sleep')
      }
      
      // Calculate exercise score
      if (structuredData.metrics.exercise) {
        const exerciseEntries = structuredData.metrics.exercise.entries || []
        componentScores.exercise = this.calculateComponentScore(exerciseEntries, 'exercise')
      }
      
      // Calculate mood score
      if (structuredData.metrics.mood) {
        const moodEntries = structuredData.metrics.mood.entries || []
        componentScores.mood = this.calculateComponentScore(moodEntries, 'mood')
      }
      
      // Calculate overall score
      const overallScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0) / Object.keys(componentScores).length
      
      return {
        overall_score: Math.round(overallScore * 10) / 10,
        component_scores: componentScores,
        analysis: {
          strengths: Object.entries(componentScores).filter(([_, score]) => score >= 70).map(([name, _]) => name),
          areas_for_improvement: Object.entries(componentScores).filter(([_, score]) => score < 50).map(([name, _]) => name),
          balanced_areas: Object.entries(componentScores).filter(([_, score]) => score >= 50 && score < 70).map(([name, _]) => name)
        }
      }
    } catch (error) {
      console.error('Error calculating wellness score for LLM:', error)
      return {
        overall_score: 50,
        component_scores: {},
        analysis: { strengths: [], areas_for_improvement: [], balanced_areas: [] }
      }
    }
  }

  /**
   * Calculate individual component score
   */
  private static calculateComponentScore(entries: any[], componentType: string): number {
    if (entries.length === 0) return 50 // Default score for no data
    
    switch (componentType) {
      case 'glucose':
        return this.calculateGlucoseComponentScore(entries)
      case 'sleep':
        return this.calculateSleepComponentScore(entries)
      case 'exercise':
        return this.calculateExerciseComponentScore(entries)
      case 'mood':
        return this.calculateMoodComponentScore(entries)
      default:
        return 50
    }
  }

  private static calculateGlucoseComponentScore(entries: any[]): number {
    const levels = entries.map(e => e.glucose_level || e.value).filter(l => l && !isNaN(l))
    if (levels.length === 0) return 50
    
    const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length
    const inRange = levels.filter(level => level >= 70 && level <= 140).length / levels.length
    
    return Math.min(100, Math.max(0, (inRange * 80) + (avgLevel < 200 ? 20 : 0)))
  }

  private static calculateSleepComponentScore(entries: any[]): number {
    const hours = entries.map(e => e.hours_slept || e.value).filter(h => h && !isNaN(h))
    if (hours.length === 0) return 50
    
    const avgHours = hours.reduce((sum, h) => sum + h, 0) / hours.length
    const goodSleep = hours.filter(h => h >= 7 && h <= 9).length / hours.length
    
    return Math.min(100, Math.max(0, (goodSleep * 80) + (avgHours >= 6 ? 20 : 0)))
  }

  private static calculateExerciseComponentScore(entries: any[]): number {
    if (entries.length === 0) return 50
    
    const totalMinutes = entries.reduce((sum, entry) => {
      const duration = parseFloat(entry.exercise_duration || entry.duration || 0)
      return sum + (isNaN(duration) ? 0 : duration)
    }, 0)
    
    const avgMinutesPerDay = totalMinutes / Math.max(1, entries.length)
    const targetMinutes = 22 // 150 minutes per week
    
    return Math.min(100, Math.max(0, (avgMinutesPerDay / targetMinutes) * 100))
  }

  private static calculateMoodComponentScore(entries: any[]): number {
    const ratings = entries.map(e => e.mood_rating || e.value).filter(r => r && !isNaN(r))
    if (ratings.length === 0) return 50
    
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    return Math.min(100, Math.max(0, (avgRating / 5) * 100))
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
    if (!insights || typeof insights !== 'object') {
      return false
    }
    
    // Ensure it has the expected top-level structure with at least summary and recommendations
    const hasRequiredFields = insights.hasOwnProperty('summary') && insights.hasOwnProperty('recommendations')
    
    // Check if it has the expected array fields
    const hasValidArrayFields = (
      Array.isArray(insights.trends) &&
      Array.isArray(insights.recommendations) &&
      Array.isArray(insights.achievements) &&
      Array.isArray(insights.correlations)
    )
    
    // Allow concerns to be optional or array
    const hasValidConcerns = !insights.concerns || Array.isArray(insights.concerns)
    
    return hasRequiredFields && hasValidArrayFields && hasValidConcerns
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
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabaseAdmin
      .from('tracking_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(500)
    
    if (error) {
      console.error('Error fetching tracking data:', error)
      return []
    }
    
    return data || []
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
      const { data, error } = await supabaseAdmin
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
    userProfile: any,
    userId: string
  ): any {
    const summary = this.createDataSummary(trackingData)
    const metrics = this.extractDetailedMetrics(trackingData)
    
    return {
      userId,
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
    // Extract metrics directly from tracking data without calling analytics service
    const metrics: any = {}
    
    // Group entries by tool type for analysis
    const grouped = trackingData.reduce((acc, entry) => {
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, TrackingEntry[]>)
    
    // Extract specific metrics for each tool type
    Object.entries(grouped).forEach(([toolId, entries]) => {
      switch (toolId) {
        case 'glucose-tracker':
          metrics.glucose = this.extractGlucoseMetrics(entries)
          break
        case 'mood-tracker':
          metrics.mood = this.extractMoodMetrics(entries)
          break
        case 'sleep-tracker':
          metrics.sleep = this.extractSleepMetrics(entries)
          break
        case 'symptom-tracker':
          metrics.symptoms = this.extractSymptomMetrics(entries)
          break
        case 'medication-tracker':
          metrics.medication = this.extractMedicationMetrics(entries)
          break
        default:
          metrics[toolId] = { count: entries.length, recent_entries: entries.slice(0, 5) }
      }
    })
    
    return metrics
  }

  private static extractGlucoseMetrics(entries: TrackingEntry[]) {
    const values = entries.map(e => e.data?.glucose).filter(v => v != null)
    return {
      count: entries.length,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
      recent_trend: values.slice(-5)
    }
  }

  private static extractMoodMetrics(entries: TrackingEntry[]) {
    const values = entries.map(e => e.data?.mood || e.data?.rating).filter(v => v != null)
    return {
      count: entries.length,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      recent_trend: values.slice(-5)
    }
  }

  private static extractSleepMetrics(entries: TrackingEntry[]) {
    const values = entries.map(e => e.data?.hours || e.data?.duration).filter(v => v != null)
    return {
      count: entries.length,
      average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
      recent_trend: values.slice(-5)
    }
  }

  private static extractSymptomMetrics(entries: TrackingEntry[]) {
    const symptoms = entries.map(e => e.data?.symptom).filter(s => s)
    const severities = entries.map(e => e.data?.severity).filter(s => s != null)
    return {
      count: entries.length,
      unique_symptoms: [...new Set(symptoms)],
      average_severity: severities.length ? severities.reduce((a, b) => a + b, 0) / severities.length : null,
      most_common: symptoms.length ? symptoms.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      ) : null
    }
  }

  private static extractMedicationMetrics(entries: TrackingEntry[]) {
    const medications = entries.map(e => e.data?.medication).filter(m => m)
    const adherence = entries.map(e => e.data?.taken).filter(t => t != null)
    return {
      count: entries.length,
      unique_medications: [...new Set(medications)],
      adherence_rate: adherence.length ? adherence.filter(Boolean).length / adherence.length : null,
      recent_adherence: adherence.slice(-10)
    }
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
      summary: 'Insufficient data available for detailed health analysis. Continue tracking your health metrics regularly for more personalized insights.',
      trends: [],
      concerns: [],
      recommendations: [
        'Continue consistent health tracking to gather more data for analysis',
        'Complete your profile setup for more personalized insights',
        'Add health conditions to your profile for targeted recommendations'
      ],
      priority_actions: [
        {
          title: 'Start tracking your health',
          description: 'Begin logging your daily health metrics to generate insights',
          priority: 'high',
          action_button: 'Start Tracking',
          category: 'general'
        },
        {
          title: 'Complete your profile',
          description: 'Add health conditions for personalized recommendations',
          priority: 'medium',
          action_button: 'Update Profile',
          category: 'general'
        }
      ],
      achievements: [],
      correlations: []
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
      generated_at: new Date().toISOString(),
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Create more specific insight when data is insufficient but explain what's missing
   */
  private static createDataInsufficientInsight(
    userId: string, 
    insightType: string, 
    dataPointsCount: number, 
    userProfile: any
  ): HealthInsight {
    const missingElements = []
    
    if (!userProfile) {
      missingElements.push('complete profile setup')
    }
    
    if (dataPointsCount === 0) {
      missingElements.push('health tracking data')
    } else if (dataPointsCount < 3) {
      missingElements.push('sufficient tracking data (need at least 3 entries)')
    }
    
    const suggestions = []
    if (!userProfile) {
      suggestions.push('Complete your profile setup in Settings')
    }
    if (dataPointsCount < 3) {
      suggestions.push('Track your health metrics for at least 3 days')
      suggestions.push('Use the recommended tracking tools on your dashboard')
    }
    
    const insights = {
      summary: `Need more data for personalized insights. Currently missing: ${missingElements.join(', ')}.`,
      trends: [],
      concerns: [],
      recommendations: suggestions.length > 0 ? suggestions : [
        'Continue consistent health tracking to gather more data for analysis',
        'Complete your profile setup for more personalized insights',
        'Add health conditions to your profile for targeted recommendations'
      ],
      priority_actions: [
        {
          title: 'Start tracking consistently',
          description: 'Track your health metrics daily to build a comprehensive health picture',
          category: 'tracking'
        }
      ],
      achievements: [],
      correlations: []
    }

    return {
      user_id: userId,
      insight_type: insightType,
      insights,
      alerts: [],
      metadata: {
        processing_time_ms: 0,
        data_points_analyzed: dataPointsCount,
        confidence_score: 0.2,
        missing_elements: missingElements
      },
      generated_at: new Date().toISOString(),
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Create insights from tracking data without full profile
   */
  private static createBasicInsightFromData(
    userId: string, 
    insightType: string, 
    trackingData: TrackingEntry[]
  ): HealthInsight {
    const toolGroups = this.groupByTool(trackingData)
    const insights = {
      summary: `Based on your ${trackingData.length} tracking entries across ${Object.keys(toolGroups).length} health metrics.`,
      trends: [],
      concerns: [],
      recommendations: [],
      achievements: [],
      correlations: []
    }

    // Analyze each tool's data
    Object.entries(toolGroups).forEach(([toolId, entries]) => {
      const toolName = toolId.replace('-tracker', '').replace('_', ' ')
      
      if (toolId.includes('mood')) {
        const moodScores = entries.map(e => e.data?.mood || e.data?.mood_rating || 5)
        const avgMood = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
        
        if (avgMood >= 7) {
          insights.achievements.push(`Maintaining good mood levels (average: ${avgMood.toFixed(1)}/10)`)
        } else if (avgMood < 5) {
          insights.concerns.push(`Mood levels below average (${avgMood.toFixed(1)}/10) - consider support resources`)
          insights.recommendations.push('Consider talking to someone about your mood patterns')
        }
        
        insights.trends.push({
          metric: 'mood',
          direction: moodScores[0] > moodScores[moodScores.length - 1] ? 'improving' : 'stable',
          description: `Mood tracking shows ${entries.length} entries with average score ${avgMood.toFixed(1)}`
        })
      }
      
      if (toolId.includes('glucose')) {
        const glucoseValues = entries.map(e => e.data?.glucose_level || e.data?.glucose || 120)
        const avgGlucose = glucoseValues.reduce((sum, val) => sum + val, 0) / glucoseValues.length
        
        if (avgGlucose > 140) {
          insights.concerns.push(`Glucose levels elevated (average: ${avgGlucose.toFixed(0)} mg/dL)`)
          insights.recommendations.push('Monitor glucose levels more frequently and consult healthcare provider')
        } else if (avgGlucose < 70) {
          insights.concerns.push(`Glucose levels low (average: ${avgGlucose.toFixed(0)} mg/dL)`)
          insights.recommendations.push('Be aware of hypoglycemia symptoms')
        } else {
          insights.achievements.push(`Glucose levels well controlled (average: ${avgGlucose.toFixed(0)} mg/dL)`)
        }
      }
      
      // Add general recommendation based on tracking consistency
      if (entries.length >= 5) {
        insights.achievements.push(`Consistent tracking of ${toolName} (${entries.length} entries)`)
      }
    })

    // Add general recommendations
    if (insights.recommendations.length === 0) {
      insights.recommendations.push('Continue tracking to identify health patterns')
      insights.recommendations.push('Add more health metrics for comprehensive insights')
    }

    return {
      user_id: userId,
      insight_type: insightType,
      insights,
      alerts: [],
      metadata: {
        processing_time_ms: 50,
        data_points_analyzed: trackingData.length,
        confidence_score: 0.6,
        analysis_type: 'basic_data_only'
      },
      generated_at: new Date().toISOString(),
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  private static async saveHealthInsight(insight: HealthInsight): Promise<HealthInsight> {
    const { data, error } = await supabaseAdmin
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