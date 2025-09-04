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
import {
  HealthTrend,
  CorrelationData,
  GoalProgress,
  StreakData,
  AnalyticsData,
  AnalyticsCache,
  HealthScore
} from '@/lib/database/types'

import { WellnessScoreService } from './wellness-score'
import { AlertService } from './alert-service'

export class HealthAnalyticsService {
  static async getAnalyticsData(userId: string, timeRange: string = '30d'): Promise<AnalyticsData> {
    try {
      
      // Check cache first
      const cached = await this.getCachedAnalytics(userId, timeRange)
      if (cached) {
        return cached
      }

      // Calculate date range
      const days = parseInt(timeRange.replace('d', '')) || 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get tracking entries using admin client for server-side access
      const { data: trackingEntries, error } = await supabaseAdmin
        .from('tracking_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error

      const entries = trackingEntries || []

      // Calculate all analytics components in parallel
      const [trends, correlations, goals, streaks] = await Promise.all([
        this.calculateAdvancedTrends(entries, timeRange),
        this.calculateCorrelations(entries),
        this.calculateGoalProgress(userId, entries),
        this.calculateStreaks(userId, entries)
      ])

      // Calculate health score using LLM-based wellness score service for consistency
      const healthScore = await WellnessScoreService.calculateWellnessScore(userId, '7d', false)

      const analyticsData: AnalyticsData = {
        trends,
        correlations,
        health_score: healthScore,
        insights: [], // Will be populated by insights service
        alerts: [], // Will be populated by alert service
        goals,
        streaks,
        data_points: entries.length
      }

      // Re-enable caching with UUID fix
      await this.cacheAnalytics(userId, timeRange, analyticsData)

      return analyticsData
    } catch (error) {
      console.error('HealthAnalyticsService error:', error)
      throw error
    }
  }

  private static async calculateAdvancedTrends(entries: TrackingEntry[], timeRange: string): Promise<HealthTrend[]> {
    const trends: HealthTrend[] = []
    
    // Group entries by tool type
    const grouped = entries.reduce((acc, entry) => {
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, TrackingEntry[]>)

    // Dynamically calculate trends for all available tracking tools
    const toolTrendCalculators: Record<string, (entries: TrackingEntry[]) => HealthTrend | null> = {
      'glucose-tracker': this.calculateGlucoseTrend,
      'mood-tracker': this.calculateMoodTrend,
      'sleep-tracker': this.calculateSleepTrend,
      'exercise-tracker': this.calculateExerciseTrend,
      'medication-tracker': this.calculateMedicationTrend,
      'symptom-tracker': this.calculateSymptomTrend,
      'nutrition-tracker': this.calculateNutritionTrend,
      'weight-tracker': this.calculateWeightTrend,
      'blood-pressure-tracker': this.calculateBloodPressureTrend,
      'heart-rate-tracker': this.calculateHeartRateTrend
    }

    // Calculate trends for all available tools
    for (const [toolId, entries] of Object.entries(grouped)) {
      const calculator = toolTrendCalculators[toolId]
      if (calculator && entries.length >= 2) {
        const trend = calculator.call(this, entries)
        if (trend) trends.push(trend)
      }
    }

    return trends
  }

  private static calculateGlucoseTrend(entries: TrackingEntry[]): HealthTrend | null {
    const levels = entries
      .map(e => e.data?.glucose_level)
      .filter(l => l && !isNaN(l))
      .map(l => Number(l))

    if (levels.length < 2) return null

    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(levels)
    const avgLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length
    const variance = this.calculateVariance(levels)
    
    // Determine trend direction and health implications
    let trendDirection: string
    let confidence = Math.min(0.95, Math.max(0.6, levels.length / 30))

    if (avgLevel > 140) {
      trendDirection = trend > 0 ? 'concerning' : 'improving'
    } else if (avgLevel < 70) {
      trendDirection = trend < 0 ? 'concerning' : 'improving'
    } else if (Math.abs(trend) < 0.5) {
      trendDirection = 'stable'
    } else {
      trendDirection = trend > 0 ? 'increasing' : 'decreasing'
    }

    return {
      date: new Date().toISOString(),
      value: Math.round(avgLevel),
      tool_id: 'glucose-tracker',
      metric: 'glucose_level'
    }
  }

  private static calculateMoodTrend(entries: TrackingEntry[]): HealthTrend | null {
    const ratings = entries
      .map(e => e.data?.mood_rating)
      .filter(r => r && !isNaN(r))
      .map(r => Number(r))

    if (ratings.length < 2) return null

    const trend = this.calculateLinearTrend(ratings)
    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    const confidence = Math.min(0.9, Math.max(0.7, ratings.length / 20))

    let trendDirection: string
    if (avgRating >= 7) {
      trendDirection = trend > 0.1 ? 'improving' : 'stable'
    } else if (avgRating <= 4) {
      trendDirection = trend < -0.1 ? 'declining' : trend > 0.1 ? 'improving' : 'stable'
    } else {
      if (Math.abs(trend) < 0.1) trendDirection = 'stable'
      else trendDirection = trend > 0 ? 'improving' : 'declining'
    }

    return {
      date: new Date().toISOString(),
      value: Math.round(avgRating * 10) / 10,
      tool_id: 'mood-tracker',
      metric: 'mood_rating'
    }
  }

  private static calculateSleepTrend(entries: TrackingEntry[]): HealthTrend | null {
    const hours = entries
      .map(e => e.data?.hours_slept)
      .filter(h => h && !isNaN(h))
      .map(h => Number(h))

    if (hours.length < 2) return null

    const trend = this.calculateLinearTrend(hours)
    const avgHours = hours.reduce((sum, h) => sum + h, 0) / hours.length
    const confidence = Math.min(0.85, Math.max(0.7, hours.length / 14))

    let trendDirection: string
    if (avgHours >= 7.5) {
      trendDirection = 'good'
    } else if (avgHours <= 5.5) {
      trendDirection = 'concerning'
    } else {
      if (Math.abs(trend) < 0.1) trendDirection = 'stable'
      else trendDirection = trend > 0 ? 'improving' : 'declining'
    }

    return {
      date: new Date().toISOString(),
      value: Math.round(avgHours * 10) / 10,
      tool_id: 'sleep-tracker',
      metric: 'hours_slept'
    }
  }

  private static calculateExerciseTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length === 0) return null

    // Calculate weekly frequency
    const weeksSpanned = Math.max(1, Math.ceil(entries.length / 7))
    const weeklyFrequency = entries.length / weeksSpanned
    const confidence = Math.min(0.8, Math.max(0.6, entries.length / 10))

    let trendDirection: string
    if (weeklyFrequency >= 4) {
      trendDirection = 'excellent'
    } else if (weeklyFrequency >= 2) {
      trendDirection = 'good'
    } else if (weeklyFrequency >= 1) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'low'
    }

    return {
      metric_name: 'exercise',
      trend_direction: trendDirection,
      value: Math.round(weeklyFrequency * 10) / 10,
      confidence,
      data_points: entries.length,
      time_period: `${weeksSpanned} weeks`,
      weekly_frequency: weeklyFrequency
    }
  }

  private static calculateMedicationTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length === 0) return null

    const taken = entries.filter(entry => 
      entry.data.taken === true || entry.data.taken === 'true'
    ).length
    const adherenceRate = (taken / entries.length) * 100
    const confidence = Math.min(0.9, Math.max(0.6, entries.length / 20))

    let trendDirection: string
    if (adherenceRate >= 90) {
      trendDirection = 'excellent'
    } else if (adherenceRate >= 75) {
      trendDirection = 'good'
    } else if (adherenceRate >= 50) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'concerning'
    }

    return {
      metric_name: 'medication',
      trend_direction: trendDirection,
      value: Math.round(adherenceRate),
      confidence,
      data_points: entries.length,
      time_period: `${entries.length} entries`,
      adherence_rate: adherenceRate
    }
  }

  private static calculateSymptomTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length === 0) return null

    const severities = entries.map(entry => entry.data.severity || 3).filter(s => !isNaN(s))
    const avgSeverity = severities.reduce((sum, s) => sum + s, 0) / severities.length
    const confidence = Math.min(0.8, Math.max(0.6, entries.length / 10))

    let trendDirection: string
    if (avgSeverity <= 2) {
      trendDirection = 'excellent'
    } else if (avgSeverity <= 3) {
      trendDirection = 'good'
    } else if (avgSeverity <= 4) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'concerning'
    }

    return {
      metric_name: 'symptoms',
      trend_direction: trendDirection,
      value: Math.round(avgSeverity * 10) / 10,
      confidence,
      data_points: entries.length,
      time_period: `${entries.length} entries`,
      avg_severity: avgSeverity
    }
  }

  private static calculateNutritionTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length === 0) return null

    const calories = entries.map(entry => entry.data.calories || 0).filter(c => !isNaN(c))
    const avgCalories = calories.reduce((sum, c) => sum + c, 0) / calories.length
    const confidence = Math.min(0.8, Math.max(0.6, entries.length / 10))

    let trendDirection: string
    if (avgCalories >= 1800 && avgCalories <= 2200) {
      trendDirection = 'excellent'
    } else if (avgCalories >= 1500 && avgCalories <= 2500) {
      trendDirection = 'good'
    } else if (avgCalories >= 1200 && avgCalories <= 2800) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'concerning'
    }

    return {
      metric_name: 'nutrition',
      trend_direction: trendDirection,
      value: Math.round(avgCalories),
      confidence,
      data_points: entries.length,
      time_period: `${entries.length} entries`,
      avg_calories: avgCalories
    }
  }

  private static calculateWeightTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length < 2) return null

    const weights = entries.map(entry => entry.data.weight || 0).filter(w => !isNaN(w))
    const trend = this.calculateLinearTrend(weights)
    const avgWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length
    const confidence = Math.min(0.9, Math.max(0.6, weights.length / 10))

    let trendDirection: string
    if (Math.abs(trend) < 0.5) {
      trendDirection = 'stable'
    } else if (trend < 0) {
      trendDirection = 'improving'
    } else {
      trendDirection = 'increasing'
    }

    return {
      metric_name: 'weight',
      trend_direction: trendDirection,
      value: Math.round(avgWeight),
      confidence,
      data_points: weights.length,
      time_period: `${weights.length} readings`,
      slope: trend
    }
  }

  private static calculateBloodPressureTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length < 2) return null

    const systolic = entries.map(entry => entry.data.systolic || 0).filter(s => !isNaN(s))
    const diastolic = entries.map(entry => entry.data.diastolic || 0).filter(d => !isNaN(d))
    
    if (systolic.length === 0 || diastolic.length === 0) return null

    const avgSystolic = systolic.reduce((sum, s) => sum + s, 0) / systolic.length
    const avgDiastolic = diastolic.reduce((sum, d) => sum + d, 0) / diastolic.length
    const confidence = Math.min(0.9, Math.max(0.6, entries.length / 10))

    let trendDirection: string
    if (avgSystolic < 120 && avgDiastolic < 80) {
      trendDirection = 'excellent'
    } else if (avgSystolic < 130 && avgDiastolic < 85) {
      trendDirection = 'good'
    } else if (avgSystolic < 140 && avgDiastolic < 90) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'concerning'
    }

    return {
      metric_name: 'blood_pressure',
      trend_direction: trendDirection,
      value: Math.round(avgSystolic),
      confidence,
      data_points: entries.length,
      time_period: `${entries.length} readings`,
      systolic: avgSystolic,
      diastolic: avgDiastolic
    }
  }

  private static calculateHeartRateTrend(entries: TrackingEntry[]): HealthTrend | null {
    if (entries.length < 2) return null

    const heartRates = entries.map(entry => entry.data.heart_rate || entry.data.bpm || 0).filter(hr => !isNaN(hr))
    if (heartRates.length === 0) return null

    const avgHeartRate = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length
    const confidence = Math.min(0.9, Math.max(0.6, entries.length / 10))

    let trendDirection: string
    if (avgHeartRate >= 60 && avgHeartRate <= 100) {
      trendDirection = 'excellent'
    } else if (avgHeartRate >= 50 && avgHeartRate <= 110) {
      trendDirection = 'good'
    } else if (avgHeartRate >= 40 && avgHeartRate <= 120) {
      trendDirection = 'moderate'
    } else {
      trendDirection = 'concerning'
    }

    return {
      metric_name: 'heart_rate',
      trend_direction: trendDirection,
      value: Math.round(avgHeartRate),
      confidence,
      data_points: entries.length,
      time_period: `${entries.length} readings`,
      avg_bpm: avgHeartRate
    }
  }

  private static calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const x = Array.from({length: n}, (_, i) => i)
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private static calculateVariance(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  }

  private static async calculateCorrelations(entries: TrackingEntry[]): Promise<CorrelationData[]> {
    const correlations: CorrelationData[] = []
    
    // Group by date to find correlations
    const dailyData = this.groupEntriesByDate(entries)
    
    // Calculate sleep-mood correlation (sleep duration vs mood energy)
    const sleepMoodCorr = this.calculateMetricCorrelation(
      dailyData, 'sleep-tracker', 'mood-tracker',
      'duration', 'energy'
    )
    if (sleepMoodCorr) correlations.push(sleepMoodCorr)

    // Calculate sleep-stress correlation (sleep duration vs stress level)
    const sleepStressCorr = this.calculateMetricCorrelation(
      dailyData, 'sleep-tracker', 'mood-tracker',
      'duration', 'stress'
    )
    if (sleepStressCorr) correlations.push(sleepStressCorr)

    // Calculate exercise-mood correlation (exercise duration vs mood energy)
    const exerciseMoodCorr = this.calculateMetricCorrelation(
      dailyData, 'exercise-tracker', 'mood-tracker',
      'duration', 'energy'
    )
    if (exerciseMoodCorr) correlations.push(exerciseMoodCorr)

    // Calculate exercise-stress correlation (exercise duration vs stress level)
    const exerciseStressCorr = this.calculateMetricCorrelation(
      dailyData, 'exercise-tracker', 'mood-tracker',
      'duration', 'stress'
    )
    if (exerciseStressCorr) correlations.push(exerciseStressCorr)

    // Filter out illogical correlations using LLM
    if (correlations.length > 0) {
      console.log('🔍 Original correlations before filtering:', correlations.map(c => 
        `${c.metric1} ↔ ${c.metric2}: ${(c.correlation * 100).toFixed(1)}%`
      ))
      
      try {
        const { CorrelationFilterService } = await import('./correlation-filter')
        console.log('✅ CorrelationFilterService imported successfully')
        
        const filterResult = await CorrelationFilterService.filterIllogicalCorrelations({
          correlations,
          userId: entries[0]?.user_id || 'unknown'
        })
        
        console.log('🧠 Filter result:', {
          filtered: filterResult.filteredCorrelations.length,
          removed: filterResult.removedCorrelations.length,
          reasoning: filterResult.reasoning
        })
        
        if (filterResult.removedCorrelations.length > 0) {
          console.log('🚫 Filtered out illogical correlations:', filterResult.reasoning)
          console.log('Removed correlations:', filterResult.removedCorrelations.map(c => 
            `${c.metric1} ↔ ${c.metric2}: ${(c.correlation * 100).toFixed(1)}%`
          ))
        }
        
        return filterResult.filteredCorrelations
      } catch (error) {
        console.error('❌ Error filtering correlations:', error)
        // Return original correlations if filtering fails
        return correlations
      }
    }

    return correlations
  }

  private static groupEntriesByDate(entries: TrackingEntry[]): Record<string, Record<string, TrackingEntry[]>> {
    return entries.reduce((acc, entry) => {
      const date = new Date(entry.timestamp).toDateString()
      if (!acc[date]) acc[date] = {}
      if (!acc[date][entry.tool_id]) acc[date][entry.tool_id] = []
      acc[date][entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, Record<string, TrackingEntry[]>>)
  }

  private static calculateMetricCorrelation(
    dailyData: Record<string, Record<string, TrackingEntry[]>>,
    tool1: string, tool2: string,
    field1: string, field2: string
  ): CorrelationData | null {
    const pairs: Array<[number, number]> = []
    
    Object.values(dailyData).forEach(dayData => {
      const entries1 = dayData[tool1]
      const entries2 = dayData[tool2]
      
      if (entries1?.length && entries2?.length) {
        const val1 = entries1[0]?.data?.[field1]
        const val2 = entries2[0]?.data?.[field2]
        
        if (val1 && val2 && !isNaN(val1) && !isNaN(val2)) {
          pairs.push([Number(val1), Number(val2)])
        }
      }
    })

    if (pairs.length < 5) return null

    const correlation = this.calculatePearsonCorrelation(pairs)
    
    return {
      metric1: tool1.replace('-tracker', ''),
      metric2: tool2.replace('-tracker', ''),
      correlation,
      significance: pairs.length > 10 ? 0.05 : 0.1,
      data_points: pairs.length
    }
  }

  private static calculatePearsonCorrelation(pairs: Array<[number, number]>): number {
    const n = pairs.length
    if (n < 2) return 0

    const sumX = pairs.reduce((sum, [x]) => sum + x, 0)
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0)
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0)
    const sumXX = pairs.reduce((sum, [x]) => sum + x * x, 0)
    const sumYY = pairs.reduce((sum, [, y]) => sum + y * y, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  private static async calculateGoalProgress(userId: string, entries: TrackingEntry[]): Promise<GoalProgress[]> {
    // For now, return simple goal progress based on consistency
    const goals: GoalProgress[] = []
    
    const toolUsage = entries.reduce((acc, entry) => {
      if (entry.tool_id) {
        acc[entry.tool_id] = (acc[entry.tool_id] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    Object.entries(toolUsage).forEach(([toolId, count]) => {
      if (!toolId || toolId === 'temp') {
        return
      }
      
      const goalName = `Daily ${toolId.replace('-tracker', '')} tracking`
      const target = 30 // 30 days goal
      const progress = Math.min(100, (count / target) * 100)
      
      goals.push({
        goal_id: `${toolId}-consistency`,
        goal_name: goalName,
        target_value: target,
        current_value: count,
        progress_percentage: Math.round(progress),
        status: progress >= 100 ? 'completed' : progress >= 75 ? 'on_track' : 'behind'
      })
    })

    return goals
  }

  private static async calculateStreaks(userId: string, entries: TrackingEntry[]): Promise<StreakData[]> {
    const streaks: StreakData[] = []
    
    // Group by tool
    const grouped = entries.reduce((acc, entry) => {
      if (entry.tool_id && entry.tool_id !== 'temp') {
        if (!acc[entry.tool_id]) acc[entry.tool_id] = []
        acc[entry.tool_id].push(entry)
      }
      return acc
    }, {} as Record<string, TrackingEntry[]>)

    Object.entries(grouped).forEach(([toolId, toolEntries]) => {
      if (!toolId || toolId === 'temp') {
        return
      }
      
      const streak = this.calculateStreakForTool(toolEntries)
      if (streak) {
        streaks.push({
          metric_name: toolId.replace('-tracker', ''),
          current_streak: streak.current,
          best_streak: streak.best,
          last_entry_date: streak.lastDate
        })
      }
    })

    return streaks
  }

  private static calculateStreakForTool(entries: TrackingEntry[]): { current: number, best: number, lastDate: string } | null {
    if (entries.length === 0) return null

    // Sort by date descending
    const sorted = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // Calculate current streak
    let currentStreak = 0
    let lastDate = new Date()
    
    for (const entry of sorted) {
      const entryDate = new Date(entry.timestamp)
      const daysDiff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 1) {
        currentStreak++
        lastDate = entryDate
      } else {
        break
      }
    }

    // For best streak, we'd need more sophisticated logic to find the longest consecutive period
    const bestStreak = Math.max(currentStreak, Math.min(entries.length, 30))

    return {
      current: currentStreak,
      best: bestStreak,
      lastDate: sorted[0].timestamp
    }
  }



  private static async getCachedAnalytics(userId: string, timeRange: string): Promise<AnalyticsData | null> {
    try {
      const cacheKey = `analytics_${userId}_${timeRange}`
      const { data, error } = await supabaseAdmin
        .from('analytics_cache')
        .select('cache_data, expires_at')
        .eq('cache_key', cacheKey)
        .single()

      if (error || !data || new Date(data.expires_at) < new Date()) {
        return null
      }

      return data.cache_data as AnalyticsData
    } catch {
      return null
    }
  }

  private static async cacheAnalytics(userId: string, timeRange: string, data: AnalyticsData): Promise<void> {
    try {
      const cacheKey = `analytics_${userId}_${timeRange}`
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // Cache for 1 hour

      // Generate a proper UUID for the id field
      const { randomUUID } = await import('crypto')
      
      await supabaseAdmin
        .from('analytics_cache')
        .upsert({
          id: randomUUID(),
          user_id: userId,
          cache_key: cacheKey,
          cache_data: data,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'cache_key'
        })
    } catch (error) {
      console.error('Failed to cache analytics:', error)
    }
  }
}