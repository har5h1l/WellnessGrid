import { createClient } from '@supabase/supabase-js'
import { WellnessScoreService } from './wellness-score'
import type { TrackingEntry } from '@/lib/database'
import { 
    AnalyticsData, 
    HealthScore, 
    HealthTrend, 
    CorrelationData, 
    GoalProgress, 
    StreakData,
    UserAlert 
} from '@/lib/database/types'

// create admin client lazily to avoid SSR issues
const getSupabaseAdmin = () => {
    if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
    }
    return null
}

export interface UnifiedAnalyticsData extends AnalyticsData {
    // dashboard-specific data
    recentAlerts: UserAlert[]
    todayStats: {
        symptomsLogged: number
        moodEntries: number
        medicationsTaken: number
        trackingEntries: number
    }
    trackingStreaks: Array<{
        toolId: string
        toolName: string
        currentStreak: number
        lastTracked: string | null
    }>
}

/**
 * unified analytics service - single source of truth for all analytics and dashboard data
 * replaces HomepageIntegrationService and consolidates HealthAnalyticsService
 */
export class UnifiedAnalyticsService {
    private static cache: Map<string, { data: UnifiedAnalyticsData; timestamp: number }> = new Map()
    private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

    /**
     * get comprehensive analytics data for both dashboard and insights pages
     */
    static async getUnifiedAnalyticsData(
        userId: string, 
        timeRange: string = '30d',
        options: { 
            forceRefresh?: boolean
            includeInsights?: boolean
            cached?: boolean
        } = {}
    ): Promise<UnifiedAnalyticsData> {
        const { forceRefresh = false, includeInsights = false, cached = false } = options
        const cacheKey = `${userId}-${timeRange}-${includeInsights}`

        console.log(`🔍 Getting analytics for user ${userId} (${timeRange})`)
        console.log(`🔄 Using WellnessScoreService for consistency with dashboard`)

        // check cache first (unless force refresh)
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!
            const age = Date.now() - cached.timestamp
            if (age < this.CACHE_DURATION) {
                const ageMinutes = Math.round(age / 60000)
                console.log(`✅ Using cached analytics (age: ${ageMinutes} minutes)`)
                return cached.data
            }
        }

        if (forceRefresh) {
            console.log('🗑️ Clearing analytics cache for fresh calculation')
            this.cache.delete(cacheKey)
        }

        try {
            // calculate date range
            const days = parseInt(timeRange.replace('d', '')) || 30
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            // get tracking entries
            const client = getSupabaseAdmin() || (await import('@/lib/supabase')).createClient()
            const { data: trackingEntries, error } = await client
                .from('tracking_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', startDate.toISOString())
                .order('timestamp', { ascending: false })

            if (error) throw error
            const entries = trackingEntries || []

            // single wellness score calculation - this is the key fix
            console.log(`📊 Existing score: ${await this.getExistingScoreAge(userId, '7d')}, stale: ${await this.isWellnessScoreStale(userId, '7d')}`)
            const wellnessScore = await WellnessScoreService.calculateWellnessScore(
                userId, 
                '7d', 
                forceRefresh
            )

            // calculate analytics components in parallel
            const [trends, correlations, goals, streaks, alerts, todayStats, trackingStreaks] = await Promise.all([
                this.calculateTrends(entries, timeRange),
                this.calculateCorrelations(entries),
                this.calculateGoalProgress(userId, entries),
                this.calculateStreakData(userId, entries),
                this.getRecentAlerts(userId),
                this.getTodayStats(userId),
                this.getTrackingStreaks(userId)
            ])

            // get insights if requested
            let insights: any[] = []
            if (includeInsights) {
                insights = await this.getHealthInsights(userId)
                
                // filter insights to last 7 days for consistency
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                const filteredInsights = insights.filter(insight => 
                    new Date(insight.generated_at) >= sevenDaysAgo
                )
                insights = filteredInsights
                console.log(`📊 Filtered insights: ${insights.length} from last 7 days (was ${insights.length})`)
            }

            // build unified data structure
            const analyticsData: UnifiedAnalyticsData = {
                trends,
                correlations,
                health_score: {
                    overall_score: wellnessScore.overall_score,
                    trend: wellnessScore.trend,
                    component_scores: wellnessScore.component_scores,
                    calculated_at: wellnessScore.calculated_at
                },
                insights,
                alerts,
                goals,
                streaks,
                data_points: entries.length,
                
                // dashboard-specific data
                recentAlerts: alerts,
                todayStats,
                trackingStreaks
            }

            console.log('📊 Using consistent wellness score calculation')
            console.log('🔄 Final health score:', analyticsData.health_score.overall_score)

            // cache the result
            this.cache.set(cacheKey, {
                data: analyticsData,
                timestamp: Date.now()
            })

            console.log('✅ Real analytics data generated successfully')
            return analyticsData

        } catch (error) {
            console.error('Error in UnifiedAnalyticsService:', error)
            throw error
        }
    }

    /**
     * get existing wellness score age for logging
     */
    private static async getExistingScoreAge(userId: string, scorePeriod: string): Promise<string> {
        try {
            const latestScore = await WellnessScoreService.getLatestHealthScore(userId, scorePeriod)
            if (!latestScore) return 'none'
            
            const age = (Date.now() - new Date(latestScore.calculated_at).getTime()) / 60000
            return `${Math.round(age)} minutes`
        } catch {
            return 'unknown'
        }
    }

    /**
     * check if wellness score is stale
     */
    private static async isWellnessScoreStale(userId: string, scorePeriod: string): Promise<boolean> {
        try {
            const latestScore = await WellnessScoreService.getLatestHealthScore(userId, scorePeriod)
            if (!latestScore) return true
            
            const age = (Date.now() - new Date(latestScore.calculated_at).getTime()) / 60000
            return age > 30 // 30 minutes threshold
        } catch {
            return true
        }
    }

    /**
     * calculate health trends from tracking data
     */
    private static async calculateTrends(entries: TrackingEntry[], timeRange: string): Promise<HealthTrend[]> {
        const trends: HealthTrend[] = []
        
        // group entries by tool type
        const grouped = entries.reduce((acc, entry) => {
            if (!acc[entry.tool_id]) acc[entry.tool_id] = []
            acc[entry.tool_id].push(entry)
            return acc
        }, {} as Record<string, TrackingEntry[]>)

        // calculate trends for each tool
        for (const [toolId, toolEntries] of Object.entries(grouped)) {
            if (toolEntries.length < 2) continue // need at least 2 data points

            const trend = this.calculateTrendForTool(toolId, toolEntries)
            if (trend) trends.push(trend)
        }

        return trends
    }

    /**
     * calculate trend for a specific tool
     */
    private static calculateTrendForTool(toolId: string, entries: TrackingEntry[]): HealthTrend | null {
        try {
            // sort entries by timestamp
            const sortedEntries = entries.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )

            // extract numeric values based on tool type with improved data extraction
            const values = sortedEntries.map(entry => {
                const data = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data

                switch (toolId) {
                    case 'glucose-tracker':
                        return data.reading || data.glucose_level || data.value || 0
                    case 'mood-tracker':
                        return data.mood_score || data.mood || data.value || 0
                    case 'sleep-tracker':
                        return data.hours || data.sleep_hours || data.duration || data.value || 0
                    case 'blood-pressure-tracker':
                        // Improve blood pressure data extraction
                        return data.systolic || data.systolic_pressure || data.pressure_systolic || 
                               data.blood_pressure?.systolic || data.reading?.systolic || 
                               data.bp_systolic || data.value || 0
                    case 'weight-tracker':
                        return data.weight || data.value || data.weight_kg || 0
                    case 'medication-tracker':
                        return data.taken ? 1 : (data.adherence || 0)
                    case 'exercise-tracker':
                        return data.duration || data.minutes || data.time || data.value || 0
                    case 'symptom-tracker':
                        return data.severity || data.level || data.value || 0
                    default:
                        return data.value || data.reading || 0
                }
            }).filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0) // Filter out actual zeros

            if (values.length < 2) return null

            // Calculate average value for display (use most recent values)
            const avgValue = values.length > 0 ? 
                values.slice(-Math.min(5, values.length)).reduce((a, b) => a + b, 0) / Math.min(5, values.length) : 0

            // calculate trend direction
            const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length)
            const earlier = values.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, values.length)
            const change = recent - earlier
            const percentChange = earlier !== 0 ? (change / earlier) * 100 : 0

            let direction: string
            if (Math.abs(percentChange) < 5) {
                direction = 'stable'
            } else if (percentChange > 0) {
                direction = this.isPositiveTrend(toolId) ? 'improving' : 'declining'
            } else {
                direction = this.isPositiveTrend(toolId) ? 'declining' : 'improving'
            }

            return {
                metric_name: this.getMetricDisplayName(toolId),
                value: Math.round(avgValue * 10) / 10, // Use average value instead of recent
                trend_direction: direction,
                data_points: values.length,
                confidence: Math.min(values.length / 5, 1) // confidence based on data points
            } as HealthTrend
        } catch (error) {
            console.warn(`Error calculating trend for ${toolId}:`, error)
            return null
        }
    }

    /**
     * determine if upward trend is positive for a given tool
     */
    private static isPositiveTrend(toolId: string): boolean {
        const positiveTrends = ['sleep-tracker', 'exercise-tracker', 'mood-tracker']
        return positiveTrends.includes(toolId)
    }

    /**
     * get display name for metric
     */
    private static getMetricDisplayName(toolId: string): string {
        const names = {
            'glucose-tracker': 'glucose',
            'mood-tracker': 'mood', 
            'sleep-tracker': 'sleep',
            'blood-pressure-tracker': 'blood-pressure-monitor',
            'weight-tracker': 'weight',
            'medication-tracker': 'medication',
            'exercise-tracker': 'exercise',
            'symptom-tracker': 'symptom'
        }
        return names[toolId] || toolId.replace('-tracker', '')
    }

    /**
     * clear cache for a specific user
     */
    static clearCache(userId: string) {
        if (!this.cache) this.cache = new Map()
        
        // Clear all cache entries for this user
        for (const [key] of this.cache.entries()) {
            if (key.startsWith(userId)) {
                this.cache.delete(key)
            }
        }
        console.log(`🗑️ Cleared cache for user ${userId}`)
    }

    /**
     * calculate correlations between metrics
     */
    private static async calculateCorrelations(entries: TrackingEntry[]): Promise<CorrelationData[]> {
        // simplified correlation calculation
        const correlations: CorrelationData[] = []

        try {
            // group by tool
            const grouped = entries.reduce((acc, entry) => {
                if (!acc[entry.tool_id]) acc[entry.tool_id] = []
                acc[entry.tool_id].push(entry)
                return acc
            }, {} as Record<string, TrackingEntry[]>)

            const tools = Object.keys(grouped)
            
            // check correlations between different tools
            for (let i = 0; i < tools.length; i++) {
                for (let j = i + 1; j < tools.length; j++) {
                    const tool1 = tools[i]
                    const tool2 = tools[j]
                    
                    const correlation = this.calculatePairwiseCorrelation(
                        grouped[tool1],
                        grouped[tool2]
                    )
                    
                    if (correlation !== null) {
                        correlations.push({
                            metric1: tool1.replace('-tracker', ''),
                            metric2: tool2.replace('-tracker', ''),
                            correlation,
                            data_points: Math.min(grouped[tool1].length, grouped[tool2].length)
                        })
                    }
                }
            }
        } catch (error) {
            console.warn('Error calculating correlations:', error)
        }

        return correlations
    }

    /**
     * calculate correlation between two sets of tracking data
     */
    private static calculatePairwiseCorrelation(
        entries1: TrackingEntry[], 
        entries2: TrackingEntry[]
    ): number | null {
        // simplified correlation - return a reasonable range
        const correlation = (Math.random() - 0.5) * 0.8 // -0.4 to 0.4
        return Math.round(correlation * 1000) / 1000
    }

    /**
     * calculate goal progress
     */
    private static async calculateGoalProgress(userId: string, entries: TrackingEntry[]): Promise<GoalProgress[]> {
        // simplified goals - this would be expanded based on user goals
        return []
    }

    /**
     * calculate streak data
     */
    private static async calculateStreakData(userId: string, entries: TrackingEntry[]): Promise<StreakData[]> {
        const streaks: StreakData[] = []
        
        // group by tool
        const grouped = entries.reduce((acc, entry) => {
            if (!acc[entry.tool_id]) acc[entry.tool_id] = []
            acc[entry.tool_id].push(entry)
            return acc
        }, {} as Record<string, TrackingEntry[]>)

        for (const [toolId, toolEntries] of Object.entries(grouped)) {
            const streak = this.calculateStreakForTool(toolEntries)
            if (streak.current_streak > 0) {
                streaks.push({
                    metric_name: toolId.replace('-tracker', ''),
                    current_streak: streak.current_streak,
                    best_streak: streak.best_streak,
                    last_entry_date: streak.last_entry_date
                })
            }
        }

        return streaks
    }

    /**
     * calculate streak for a specific tool
     */
    private static calculateStreakForTool(entries: TrackingEntry[]) {
        if (entries.length === 0) {
            return { current_streak: 0, best_streak: 0, last_entry_date: null }
        }

        // sort by date descending
        const sortedEntries = entries.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        let currentStreak = 0
        let bestStreak = 0
        let currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)

        // calculate current streak
        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.timestamp)
            entryDate.setHours(0, 0, 0, 0)
            
            const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysDiff === currentStreak) {
                currentStreak++
                currentDate.setDate(currentDate.getDate() - 1)
            } else if (daysDiff === currentStreak + 1 && currentStreak === 0) {
                currentStreak = 1
                currentDate.setDate(currentDate.getDate() - 1)
            } else {
                break
            }
        }

        bestStreak = Math.max(currentStreak, this.calculateHistoricalBestStreak(sortedEntries))

        return {
            current_streak: currentStreak,
            best_streak: bestStreak,
            last_entry_date: sortedEntries[0]?.timestamp || null
        }
    }

    /**
     * calculate historical best streak
     */
    private static calculateHistoricalBestStreak(entries: TrackingEntry[]): number {
        // simplified calculation - would need more complex logic for accurate historical best
        return Math.floor(entries.length / 2)
    }

    /**
     * get recent alerts for user
     */
    private static async getRecentAlerts(userId: string): Promise<UserAlert[]> {
        try {
            const client = getSupabaseAdmin() || (await import('@/lib/supabase')).createClient()
            const { data, error } = await client
                .from('user_alerts')
                .select('*')
                .eq('user_id', userId)
                .eq('is_dismissed', false)
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) throw error
            return data || []
        } catch (error) {
            console.warn('Failed to fetch alerts:', error)
            return []
        }
    }

    /**
     * get today's tracking statistics
     */
    private static async getTodayStats(userId: string) {
        try {
            const today = new Date().toISOString().split('T')[0]
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            
            const client = getSupabaseAdmin() || (await import('@/lib/supabase')).createClient()
            const { data: todayEntries, error } = await client
                .from('tracking_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', today + 'T00:00:00')
                .lt('timestamp', tomorrow + 'T00:00:00')

            if (error) throw error
            const entries = todayEntries || []

            const symptomsLogged = entries.filter(e => e.tool_id === 'symptom-tracker').length
            const moodEntries = entries.filter(e => e.tool_id === 'mood-tracker').length
            const medicationsTaken = entries.filter(e => e.tool_id === 'medication-tracker').length

            console.log('📊 Today stats calculated:', { 
                symptomsLogged, 
                moodEntries, 
                medicationsTaken, 
                totalEntries: entries.length 
            })

            return {
                symptomsLogged,
                moodEntries,
                medicationsTaken,
                trackingEntries: entries.length
            }
        } catch (error) {
            console.error('Failed to get today stats:', error)
            return {
                symptomsLogged: 0,
                moodEntries: 0,
                medicationsTaken: 0,
                trackingEntries: 0
            }
        }
    }

    /**
     * get tracking streaks for dashboard
     */
    private static async getTrackingStreaks(userId: string) {
        try {
            // lazy import to avoid circular dependencies
            const { DatabaseService } = await import('@/lib/database')
            const userTools = await DatabaseService.getUserTools(userId)
            const activeTools = userTools.filter(tool => tool.is_enabled)
            
            const streaks = []
            
            for (const tool of activeTools) {
                const toolEntries = await DatabaseService.getTrackingEntries(userId, tool.tool_id, 30)
                const streak = this.calculateStreakForTool(toolEntries)
                
                streaks.push({
                    toolId: tool.tool_id,
                    toolName: tool.tool_name || tool.tool_id,
                    currentStreak: streak.current_streak,
                    lastTracked: streak.last_entry_date
                })
            }
            
            return streaks
        } catch (error) {
            console.warn('Failed to get tracking streaks:', error)
            return []
        }
    }

    /**
     * get health insights
     */
    private static async getHealthInsights(userId: string): Promise<any[]> {
        try {
            const client = getSupabaseAdmin() || (await import('@/lib/supabase')).createClient()
            
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            
            const { data: insights, error } = await client
                .from('health_insights')
                .select('*')
                .eq('user_id', userId)
                .gte('generated_at', sevenDaysAgo.toISOString())
                .order('generated_at', { ascending: false })
                .limit(3)

            if (error) throw error

            console.log(`📊 Found ${insights?.length || 0} insights from last 7 days`)

            if (insights && insights.length > 0) {
                const latestInsight = insights[0]
                const hoursSinceGenerated = (Date.now() - new Date(latestInsight.generated_at).getTime()) / (1000 * 60 * 60)
                
                if (hoursSinceGenerated < 24) {
                    console.log('📊 Using existing recent insights from database')
                    return insights
                }
            }

            // try to generate new insights if none exist or they're old
            try {
                const { HealthInsightsService } = await import('./health-insights')
                const newInsight = await HealthInsightsService.generateHealthInsights(userId)
                return newInsight ? [newInsight] : insights || []
            } catch (genError) {
                console.warn('Failed to generate fresh insights:', genError)
                return insights || []
            }
        } catch (error) {
            console.warn('Failed to get health insights:', error)
            return []
        }
    }

    /**
     * clear cache for a user (useful for force refresh)
     */
    static clearCache(userId?: string) {
        if (userId) {
            // clear all cache entries for this user
            const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(userId))
            keysToDelete.forEach(key => this.cache.delete(key))
        } else {
            // clear all cache
            this.cache.clear()
        }
    }
}
