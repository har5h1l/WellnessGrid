import { DatabaseService, TrackingEntry } from '@/lib/database'
import { UserAlert, HealthScore } from '@/lib/database/types'
import { WellnessScoreService } from './wellness-score'
import { AlertService } from './alert-service'
import { createClient } from '@/lib/supabase'

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
    healthTrends: Array<{
        metric: string
        trend: 'improving' | 'stable' | 'declining'
        value: number
        change: number
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
            const [wellnessScore, recentAlerts, todayStats, trackingStreaks, healthTrends] = await Promise.allSettled([
                this.getWellnessScore(userId),
                this.getRecentAlerts(userId),
                this.getTodayStats(userId),
                this.getTrackingStreaks(userId),
                this.getHealthTrends(userId)
            ])

            const result: DashboardData = {
                wellnessScore: wellnessScore.status === 'fulfilled' ? wellnessScore.value : this.getDefaultWellnessScore(),
                recentAlerts: recentAlerts.status === 'fulfilled' ? recentAlerts.value : [],
                todayStats: todayStats.status === 'fulfilled' ? todayStats.value : this.getDefaultTodayStats(),
                trackingStreaks: trackingStreaks.status === 'fulfilled' ? trackingStreaks.value : [],
                healthTrends: healthTrends.status === 'fulfilled' ? healthTrends.value : []
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
            console.warn('Failed to calculate wellness score, using default:', error)
            return this.getDefaultWellnessScore()
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
            const todayEntries = await DatabaseService.getRecentTrackingEntries(userId, 1) // Today only
            
            const filteredEntries = todayEntries.filter(entry => 
                entry.timestamp.startsWith(today)
            )

            // Group by tool type
            const symptomsLogged = filteredEntries.filter(e => 
                e.tool_id.includes('symptom') || e.data.type === 'symptom'
            ).length

            const moodEntries = filteredEntries.filter(e => 
                e.tool_id.includes('mood') || e.data.mood !== undefined
            ).length

            const medicationsTaken = filteredEntries.filter(e => 
                e.tool_id.includes('medication') || e.data.medication !== undefined
            ).length

            return {
                symptomsLogged,
                moodEntries,
                medicationsTaken,
                trackingEntries: filteredEntries.length
            }
        } catch (error) {
            console.warn('Failed to get today stats:', error)
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
     * Get health trends for key metrics
     */
    private static async getHealthTrends(userId: string): Promise<DashboardData['healthTrends']> {
        try {
            const recentEntries = await DatabaseService.getRecentTrackingEntries(userId, 14)
            const trends: DashboardData['healthTrends'] = []
            
            // Group by tool and calculate trends
            const groupedData = this.groupEntriesByTool(recentEntries)
            
            for (const [toolId, entries] of Object.entries(groupedData)) {
                if (entries.length < 2) continue // Need at least 2 data points
                
                const trend = this.calculateTrend(entries, toolId)
                if (trend) {
                    trends.push(trend)
                }
            }
            
            return trends
        } catch (error) {
            console.warn('Failed to get health trends:', error)
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

    /**
     * Group tracking entries by tool
     */
    private static groupEntriesByTool(entries: TrackingEntry[]): Record<string, TrackingEntry[]> {
        return entries.reduce((acc, entry) => {
            if (!acc[entry.tool_id]) {
                acc[entry.tool_id] = []
            }
            acc[entry.tool_id].push(entry)
            return acc
        }, {} as Record<string, TrackingEntry[]>)
    }

    /**
     * Calculate trend for a specific tool's data
     */
    private static calculateTrend(entries: TrackingEntry[], toolId: string): DashboardData['healthTrends'][0] | null {
        if (entries.length < 2) return null
        
        // Sort by timestamp
        const sortedEntries = entries.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        
        let values: number[] = []
        let metricName = toolId
        
        // Extract numeric values based on tool type
        switch (toolId) {
            case 'glucose-tracker':
                values = sortedEntries.map(e => e.data.glucose || e.data.value).filter(v => typeof v === 'number')
                metricName = 'Blood Glucose'
                break
            case 'mood-tracker':
                values = sortedEntries.map(e => e.data.mood).filter(v => typeof v === 'number')
                metricName = 'Mood'
                break
            case 'sleep-tracker':
                values = sortedEntries.map(e => e.data.hours || e.data.duration).filter(v => typeof v === 'number')
                metricName = 'Sleep'
                break
            case 'vital-signs':
                values = sortedEntries.map(e => e.data.systolic || e.data.blood_pressure_systolic).filter(v => typeof v === 'number')
                metricName = 'Blood Pressure'
                break
            default:
                // Try to find any numeric value
                values = sortedEntries.map(e => {
                    const data = e.data as any
                    return data.value || data.score || data.level || data.rating
                }).filter(v => typeof v === 'number')
                break
        }
        
        if (values.length < 2) return null
        
        // Simple linear trend calculation
        const firstHalf = values.slice(0, Math.floor(values.length / 2))
        const secondHalf = values.slice(Math.floor(values.length / 2))
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        
        const change = secondAvg - firstAvg
        const percentChange = firstAvg !== 0 ? (change / firstAvg) * 100 : 0
        
        let trend: 'improving' | 'stable' | 'declining'
        if (Math.abs(percentChange) < 5) {
            trend = 'stable'
        } else if (change > 0) {
            // For mood, higher is better. For glucose, depends on range
            trend = toolId === 'mood-tracker' ? 'improving' : 'declining'
        } else {
            trend = toolId === 'mood-tracker' ? 'declining' : 'improving'
        }
        
        return {
            metric: metricName,
            trend,
            value: secondAvg,
            change: percentChange
        }
    }

    /**
     * Generate synthetic test data for a user
     */
    static async generateSyntheticData(userId: string): Promise<void> {
        console.log(`🧪 Generating synthetic test data for user ${userId}`)
        
        try {
            const now = new Date()
            const syntheticEntries: Array<Omit<TrackingEntry, 'id' | 'created_at' | 'updated_at'>> = []
            
            // Generate 30 days of varied health data
            for (let i = 0; i < 30; i++) {
                const date = new Date(now)
                date.setDate(date.getDate() - i)
                
                // Random glucose readings (simulate diabetes management)
                if (Math.random() > 0.1) { // 90% compliance
                    syntheticEntries.push({
                        user_id: userId,
                        tool_id: 'glucose-tracker',
                        timestamp: date.toISOString(),
                        data: {
                            glucose: 80 + Math.random() * 100, // 80-180 mg/dL
                            timing: ['fasting', 'before_meal', '2h_after_meal'][Math.floor(Math.random() * 3)],
                            carbs: Math.floor(15 + Math.random() * 60),
                            notes: i % 7 === 0 ? 'Feeling good today' : ''
                        }
                    })
                }
                
                // Random mood entries
                if (Math.random() > 0.2) { // 80% compliance
                    syntheticEntries.push({
                        user_id: userId,
                        tool_id: 'mood-tracker',
                        timestamp: date.toISOString(),
                        data: {
                            mood: (() => {
                                const moodOptions = ['very-sad', 'sad', 'neutral', 'happy', 'very-happy']
                                return moodOptions[Math.floor(Math.random() * moodOptions.length)]
                            })(),
                            energy: Math.floor(3 + Math.random() * 6),
                            stress: Math.floor(1 + Math.random() * 8),
                            notes: Math.random() > 0.8 ? 'Had a challenging day' : ''
                        }
                    })
                }
                
                // Medication adherence
                if (Math.random() > 0.05) { // 95% compliance
                    syntheticEntries.push({
                        user_id: userId,
                        tool_id: 'medication-metformin',
                        timestamp: date.toISOString(),
                        data: {
                            medication: 'Metformin 500mg',
                            taken: true,
                            time: '08:00',
                            notes: ''
                        }
                    })
                }
                
                // Sleep tracking
                if (Math.random() > 0.15) { // 85% compliance
                    syntheticEntries.push({
                        user_id: userId,
                        tool_id: 'sleep-tracker',
                        timestamp: date.toISOString(),
                        data: {
                            hours: 6 + Math.random() * 3, // 6-9 hours
                            quality: Math.floor(2 + Math.random() * 4), // 2-5 scale
                            bedtime: '22:30',
                            wake_time: '06:30'
                        }
                    })
                }
                
                // Occasional symptoms
                if (Math.random() > 0.85) { // 15% of days
                    syntheticEntries.push({
                        user_id: userId,
                        tool_id: 'symptom-tracker',
                        timestamp: date.toISOString(),
                        data: {
                            type: ['fatigue', 'headache', 'nausea', 'dizziness'][Math.floor(Math.random() * 4)],
                            severity: Math.floor(1 + Math.random() * 7),
                            duration: Math.floor(30 + Math.random() * 240), // 30-270 minutes
                            triggers: Math.random() > 0.5 ? 'stress' : 'diet'
                        }
                    })
                }
            }
            
            // Insert synthetic data in batches
            const batchSize = 10
            for (let i = 0; i < syntheticEntries.length; i += batchSize) {
                const batch = syntheticEntries.slice(i, i + batchSize)
                for (const entry of batch) {
                    await DatabaseService.createTrackingEntry(entry)
                }
                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            console.log(`✅ Generated ${syntheticEntries.length} synthetic tracking entries`)
            
        } catch (error) {
            console.error('Error generating synthetic data:', error)
            throw error
        }
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
            healthTrends: []
        }
    }
}