import { DatabaseService, TrackingEntry } from '@/lib/database'
import { UserAlert, HealthScore } from '@/lib/database/types'
import { WellnessScoreService } from './wellness-score'
import { AlertService } from './alert-service'
import { createClient } from '@/lib/supabase'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create admin client for server-side operations
const supabaseAdmin = (() => {
  if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseClient(
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
})()

export interface DashboardData {
    wellnessScore: HealthScore
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
    healthInsights: Array<{
        id: string
        insight_type: string
        generated_at: string
        insights: any
        summary?: string
        trends?: any[]
        recommendations?: any[]
        concerns?: any[]
    }>
}

export class HomepageIntegrationService {
    
    /**
     * Get comprehensive dashboard data for a user
     */
    static async getDashboardData(userId: string): Promise<DashboardData> {
        console.log(`📊 Loading dashboard data for user ${userId}`)
        
        try {
            // Run parallel data fetching for performance
            const [wellnessScore, recentAlerts, todayStats, trackingStreaks, healthInsights] = await Promise.allSettled([
                this.getWellnessScore(userId),
                this.getRecentAlerts(userId),
                this.getTodayStats(userId),
                this.getTrackingStreaks(userId),
                this.getHealthInsights(userId)
            ])

            const result: DashboardData = {
                wellnessScore: wellnessScore.status === 'fulfilled' ? wellnessScore.value : { overall_score: 50, trend: 'stable' },
                recentAlerts: recentAlerts.status === 'fulfilled' ? recentAlerts.value : [],
                todayStats: todayStats.status === 'fulfilled' ? todayStats.value : this.getDefaultTodayStats(),
                trackingStreaks: trackingStreaks.status === 'fulfilled' ? trackingStreaks.value : [],
                healthInsights: healthInsights.status === 'fulfilled' ? healthInsights.value : []
            }

            console.log(`✅ Dashboard data loaded successfully for user ${userId}`)
            return result

        } catch (error) {
            console.error('Error loading dashboard data:', error)
            return this.getFallbackDashboardData()
        }
    }

    /**
     * Get current wellness score for user
     */
    private static async getWellnessScore(userId: string): Promise<HealthScore> {
        try {
            return await WellnessScoreService.calculateWellnessScore(userId, '7d')
        } catch (error) {
            console.error('Failed to calculate wellness score, using analytics fallback:', error)
            // Fall back to analytics-based calculation
            try {
                const { HealthAnalyticsService } = await import('./health-analytics')
                const analyticsData = await HealthAnalyticsService.getAnalyticsData(userId, '7d')
                return {
                    user_id: userId,
                    overall_score: analyticsData.health_score || 50,
                    trend: 'stable',
                    score_period: '7d',
                    calculated_at: new Date().toISOString(),
                    component_scores: {}
                }
            } catch (analyticsError) {
                console.error('Analytics fallback also failed:', analyticsError)
                return {
                    user_id: userId,
                    overall_score: 50,
                    trend: 'stable',
                    score_period: '7d',
                    calculated_at: new Date().toISOString(),
                    component_scores: {}
                }
            }
        }
    }

    /**
     * Get recent unread alerts for user
     */
    private static async getRecentAlerts(userId: string): Promise<UserAlert[]> {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
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
     * Get today's tracking statistics
     */
    private static async getTodayStats(userId: string): Promise<DashboardData['todayStats']> {
        try {
            const today = new Date().toISOString().split('T')[0]
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            
            // Get today's entries directly from database using admin client for server-side access
            const client = supabaseAdmin || createClient()
            const { data: todayEntries, error } = await client
                .from('tracking_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', today + 'T00:00:00')
                .lt('timestamp', tomorrow + 'T00:00:00')

            if (error) {
                console.error('Error fetching today entries:', error)
                return this.getDefaultTodayStats()
            }

            const entries = todayEntries || []

            // Group by tool type using the exact tool_id values from database
            const symptomsLogged = entries.filter(e => 
                e.tool_id === 'symptom-tracker'
            ).length

            const moodEntries = entries.filter(e => 
                e.tool_id === 'mood-tracker'
            ).length

            const medicationsTaken = entries.filter(e => 
                e.tool_id === 'medication-tracker'
            ).length

            console.log('📊 Today stats calculated:', { symptomsLogged, moodEntries, medicationsTaken, totalEntries: entries.length })
            console.log('📅 Date range used:', { today: today + 'T00:00:00', tomorrow: tomorrow + 'T00:00:00' })
            console.log('📊 Sample entries found:', entries.slice(0, 3).map(e => ({ tool_id: e.tool_id, timestamp: e.timestamp })))

            return {
                symptomsLogged,
                moodEntries,
                medicationsTaken,
                trackingEntries: entries.length
            }
        } catch (error) {
            console.error('Failed to get today stats:', error)
            return this.getDefaultTodayStats()
        }
    }

    /**
     * Get tracking streaks for user's tools
     */
    private static async getTrackingStreaks(userId: string): Promise<DashboardData['trackingStreaks']> {
        try {
            const userTools = await DatabaseService.getUserTools(userId)
            const activeTools = userTools.filter(tool => tool.is_enabled)
            
            const streaks: DashboardData['trackingStreaks'] = []
            
            for (const tool of activeTools) {
                const toolEntries = await DatabaseService.getTrackingEntries(userId, tool.tool_id, 30)
                const streak = this.calculateStreak(toolEntries)
                const lastEntry = toolEntries[0] // Most recent
                
                streaks.push({
                    toolId: tool.tool_id,
                    toolName: tool.tool_name || tool.tool_id,
                    currentStreak: streak,
                    lastTracked: lastEntry ? lastEntry.timestamp : null
                })
            }
            
            return streaks
        } catch (error) {
            console.warn('Failed to get tracking streaks:', error)
            return []
        }
    }

    /**
     * Get health insights from database, auto-generate if needed
     */
    private static async getHealthInsights(userId: string): Promise<any[]> {
        try {
            // Check for existing insights
            const client = supabaseAdmin || createClient()
            const { data: existingInsights, error } = await client
                .from('health_insights')
                .select('*')
                .eq('user_id', userId)
                .order('generated_at', { ascending: false })
                .limit(3)

            if (error) {
                console.error('Error fetching insights:', error)
                return []
            }

            // If we have recent insights (within 24 hours), use them
            if (existingInsights && existingInsights.length > 0) {
                const latestInsight = existingInsights[0]
                const generatedAt = new Date(latestInsight.generated_at)
                const hoursSinceGenerated = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
                
                if (hoursSinceGenerated < 24) {
                    console.log('📊 Using existing insights from database')
                    return existingInsights
                }
            }

            // Auto-generate insights if none exist or they're old
            console.log('🤖 Auto-generating insights for homepage')
            try {
                const { HealthInsightsService } = await import('./health-insights')
                const newInsight = await HealthInsightsService.generateHealthInsights(userId)
                return newInsight ? [newInsight] : []
            } catch (genError) {
                console.warn('Failed to auto-generate insights:', genError)
                return existingInsights || []
            }
        } catch (error) {
            console.warn('Failed to get health insights:', error)
            return []
        }
    }

    /**
     * Calculate consecutive day streak for a tool
     */
    private static calculateStreak(entries: TrackingEntry[]): number {
        if (entries.length === 0) return 0
        
        // Sort by date descending
        const sortedEntries = entries.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        let streak = 0
        let currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)
        
        for (const entry of sortedEntries) {
            const entryDate = new Date(entry.timestamp)
            entryDate.setHours(0, 0, 0, 0)
            
            const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysDiff === streak) {
                streak++
                currentDate.setDate(currentDate.getDate() - 1)
            } else if (daysDiff === streak + 1 && streak === 0) {
                // Entry is from yesterday, start streak
                streak = 1
                currentDate.setDate(currentDate.getDate() - 1)
            } else {
                break // Streak broken
            }
        }
        
        return streak
    }



    // Default/fallback data methods
    private static getDefaultWellnessScore(): HealthScore {
        return {
            id: 'default',
            user_id: '',
            overall_score: 75,
            component_scores: {
                glucose: 78,
                mood: 72,
                sleep: 80,
                medication: 85
            },
            trend: 'stable',
            score_period: '7d',
            data_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private static getDefaultTodayStats(): DashboardData['todayStats'] {
        return {
            symptomsLogged: 0,
            moodEntries: 0,
            medicationsTaken: 0,
            trackingEntries: 0
        }
    }

    private static getFallbackDashboardData(): DashboardData {
        return {
            wellnessScore: this.getDefaultWellnessScore(),
            recentAlerts: [],
            todayStats: this.getDefaultTodayStats(),
            trackingStreaks: [],
            healthInsights: []
        }
    }
}