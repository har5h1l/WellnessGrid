import { supabase } from '@/lib/supabase'
import { DatabaseService, TrackingEntry } from '@/lib/database'
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

      // Get tracking entries
      const { data: trackingEntries, error } = await supabase
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

      // Calculate health score based on trends
      const healthScore = this.calculateHealthScore(trends, entries.length)

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

      // Cache the results
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

    // Calculate glucose trends
    if (grouped['glucose-tracker']) {
      const glucoseTrend = this.calculateGlucoseTrend(grouped['glucose-tracker'])
      if (glucoseTrend) trends.push(glucoseTrend)
    }

    // Calculate mood trends
    if (grouped['mood-tracker']) {
      const moodTrend = this.calculateMoodTrend(grouped['mood-tracker'])
      if (moodTrend) trends.push(moodTrend)
    }

    // Calculate sleep trends
    if (grouped['sleep-tracker']) {
      const sleepTrend = this.calculateSleepTrend(grouped['sleep-tracker'])
      if (sleepTrend) trends.push(sleepTrend)
    }

    // Calculate exercise trends
    if (grouped['exercise-tracker']) {
      const exerciseTrend = this.calculateExerciseTrend(grouped['exercise-tracker'])
      if (exerciseTrend) trends.push(exerciseTrend)
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
      metric_name: 'glucose',
      trend_direction: trendDirection,
      value: Math.round(avgLevel),
      confidence,
      variance: Math.round(variance),
      data_points: levels.length,
      time_period: `${levels.length} readings`,
      slope: trend
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
      metric_name: 'mood',
      trend_direction: trendDirection,
      value: Math.round(avgRating * 10) / 10,
      confidence,
      data_points: ratings.length,
      time_period: `${ratings.length} entries`,
      slope: trend
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
      metric_name: 'sleep',
      trend_direction: trendDirection,
      value: Math.round(avgHours * 10) / 10,
      confidence,
      data_points: hours.length,
      time_period: `${hours.length} nights`,
      slope: trend
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
    
    // Calculate sleep-mood correlation
    const sleepMoodCorr = this.calculateMetricCorrelation(
      dailyData, 'sleep-tracker', 'mood-tracker',
      'hours_slept', 'mood_rating'
    )
    if (sleepMoodCorr) correlations.push(sleepMoodCorr)

    // Calculate exercise-mood correlation
    const exerciseMoodCorr = this.calculateMetricCorrelation(
      dailyData, 'exercise-tracker', 'mood-tracker',
      'duration', 'mood_rating'
    )
    if (exerciseMoodCorr) correlations.push(exerciseMoodCorr)

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
      metric_1: tool1.replace('-tracker', ''),
      metric_2: tool2.replace('-tracker', ''),
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
      acc[entry.tool_id] = (acc[entry.tool_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(toolUsage).forEach(([toolId, count]) => {
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
      if (!acc[entry.tool_id]) acc[entry.tool_id] = []
      acc[entry.tool_id].push(entry)
      return acc
    }, {} as Record<string, TrackingEntry[]>)

    Object.entries(grouped).forEach(([toolId, toolEntries]) => {
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

  private static calculateHealthScore(trends: HealthTrend[], dataPoints: number): HealthScore {
    let overallScore = 50 // Base score
    const componentScores: Record<string, number> = {}

    // Score each trend component
    trends.forEach(trend => {
      let score = 50 // Base component score
      
      switch (trend.metric_name) {
        case 'glucose':
          if (trend.trend_direction === 'stable' && trend.value >= 80 && trend.value <= 140) score = 85
          else if (trend.trend_direction === 'improving') score = 80
          else if (trend.trend_direction === 'concerning') score = 30
          break
          
        case 'mood':
          if (trend.trend_direction === 'improving' || (trend.value >= 7 && trend.trend_direction === 'stable')) score = 85
          else if (trend.trend_direction === 'stable' && trend.value >= 5) score = 70
          else if (trend.trend_direction === 'declining') score = 40
          break
          
        case 'sleep':
          if (trend.trend_direction === 'good') score = 85
          else if (trend.trend_direction === 'stable' && trend.value >= 7) score = 75
          else if (trend.trend_direction === 'concerning') score = 35
          break
          
        case 'exercise':
          if (trend.trend_direction === 'excellent') score = 90
          else if (trend.trend_direction === 'good') score = 80
          else if (trend.trend_direction === 'moderate') score = 65
          else if (trend.trend_direction === 'low') score = 45
          break
      }

      componentScores[trend.metric_name] = score
      
      // Weight the overall score by confidence and data availability
      const weight = trend.confidence * (trend.data_points / Math.max(trend.data_points, 10))
      overallScore += (score - 50) * weight * 0.4
    })

    // Data consistency bonus
    if (dataPoints > 20) overallScore += 5
    if (dataPoints > 50) overallScore += 5

    overallScore = Math.max(0, Math.min(100, Math.round(overallScore)))

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
    if (dataPoints < 5) {
      trend = 'insufficient_data'
    } else if (overallScore >= 75) {
      trend = 'improving'
    } else if (overallScore >= 60) {
      trend = 'stable'
    } else {
      trend = 'declining'
    }

    return {
      id: `score_${Date.now()}`,
      user_id: '', // Will be set by caller
      overall_score: overallScore,
      component_scores: componentScores,
      trend,
      score_period: '30d',
      calculated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  }

  private static async getCachedAnalytics(userId: string, timeRange: string): Promise<AnalyticsData | null> {
    try {
      const cacheKey = `analytics_${userId}_${timeRange}`
      const { data, error } = await supabase
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

      await supabase
        .from('analytics_cache')
        .upsert({
          user_id: userId,
          cache_key: cacheKey,
          cache_data: data,
          expires_at: expiresAt.toISOString()
        })
    } catch (error) {
      console.error('Failed to cache analytics:', error)
    }
  }
}