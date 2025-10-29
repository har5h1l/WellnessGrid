// query-context-analyzer.ts - analyzes queries to determine what user data is needed

import { createClient } from '@supabase/supabase-js';

// use service role key to bypass RLS policies when fetching user data for context enrichment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ContextRequirements {
    needsGlucoseData: boolean;
    needsMedicationData: boolean;
    needsMoodData: boolean;
    needsSymptomData: boolean;
    needsHealthProfile: boolean;
    needsRecentActivity: boolean;
    timeframe: 'today' | 'week' | 'month' | 'all';
    keywords: string[];
}

interface UserDataSummary {
    glucoseData?: {
        latestReading: number | null;
        avgLast7Days: number | null;
        avgLast30Days: number | null;
        spikesCount: number;
        timeInRange: number;
        trendDirection: 'stable' | 'increasing' | 'decreasing';
    };
    medicationData?: {
        adherenceRate: number;
        missedDoses: number;
        recentMedications: string[];
    };
    moodData?: {
        avgMoodScore: number;
        recentMoods: string[];
        trendDirection: 'improving' | 'declining' | 'stable';
    };
    symptomData?: {
        recentSymptoms: string[];
        severity: string;
        frequency: string;
    };
    healthProfile?: {
        conditions: string[];
        age: number | null;
        goals: string[];
    };
    activityData?: {
        recentActivities: string[];
        exerciseMinutes: number;
    };
}

export class QueryContextAnalyzer {
    private supabase;

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * analyze the query to determine what user data is needed
     */
    analyzeQuery(query: string): ContextRequirements {
        const lowerQuery = query.toLowerCase();
        
        const requirements: ContextRequirements = {
            needsGlucoseData: false,
            needsMedicationData: false,
            needsMoodData: false,
            needsSymptomData: false,
            needsHealthProfile: false,
            needsRecentActivity: false,
            timeframe: 'week',
            keywords: []
        };

        // glucose-related keywords
        const glucoseKeywords = ['glucose', 'blood sugar', 'sugar level', 'reading', 'spike', 'drop', 'a1c', 'hyperglycemia', 'hypoglycemia', 'bg'];
        if (glucoseKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsGlucoseData = true;
            requirements.keywords.push('glucose');
        }

        // medication-related keywords
        const medicationKeywords = ['medication', 'medicine', 'pill', 'dose', 'insulin', 'metformin', 'drug', 'prescription'];
        if (medicationKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsMedicationData = true;
            requirements.keywords.push('medication');
        }

        // mood-related keywords
        const moodKeywords = ['mood', 'feeling', 'emotion', 'anxious', 'stressed', 'happy', 'sad', 'depressed', 'mental health'];
        if (moodKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsMoodData = true;
            requirements.keywords.push('mood');
        }

        // symptom-related keywords
        const symptomKeywords = ['symptom', 'pain', 'headache', 'nausea', 'fatigue', 'tired', 'dizzy', 'sick', 'feel'];
        if (symptomKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsSymptomData = true;
            requirements.keywords.push('symptoms');
        }

        // activity-related keywords
        const activityKeywords = ['exercise', 'activity', 'workout', 'run', 'walk', 'gym', 'physical', 'active'];
        if (activityKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsRecentActivity = true;
            requirements.keywords.push('activity');
        }

        // health profile keywords
        const profileKeywords = ['condition', 'diagnosis', 'history', 'profile', 'diabetes', 'type 1', 't1d', 'health'];
        if (profileKeywords.some(keyword => lowerQuery.includes(keyword))) {
            requirements.needsHealthProfile = true;
            requirements.keywords.push('profile');
        }

        // timeframe analysis
        if (lowerQuery.includes('today') || lowerQuery.includes('now') || lowerQuery.includes('current')) {
            requirements.timeframe = 'today';
        } else if (lowerQuery.includes('week') || lowerQuery.includes('recent') || lowerQuery.includes('lately')) {
            requirements.timeframe = 'week';
        } else if (lowerQuery.includes('month') || lowerQuery.includes('past month')) {
            requirements.timeframe = 'month';
        } else if (lowerQuery.includes('all') || lowerQuery.includes('ever') || lowerQuery.includes('history')) {
            requirements.timeframe = 'all';
        }

        // if no specific data type identified, default to needing health profile and glucose
        if (!requirements.needsGlucoseData && !requirements.needsMedicationData && 
            !requirements.needsMoodData && !requirements.needsSymptomData && 
            !requirements.needsRecentActivity) {
            requirements.needsHealthProfile = true;
            requirements.needsGlucoseData = true; // most health questions relate to glucose for T1D
        }

        return requirements;
    }

    /**
     * fetch relevant user data based on requirements
     */
    async fetchUserData(userId: string, requirements: ContextRequirements): Promise<UserDataSummary> {
        const summary: UserDataSummary = {};
        
        // determine date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        
        switch (requirements.timeframe) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'all':
                startDate = new Date(0); // beginning of time
                break;
        }

        try {
            // fetch glucose data if needed
            if (requirements.needsGlucoseData) {
                summary.glucoseData = await this.fetchGlucoseData(userId, startDate);
            }

            // fetch medication data if needed
            if (requirements.needsMedicationData) {
                summary.medicationData = await this.fetchMedicationData(userId, startDate);
            }

            // fetch mood data if needed
            if (requirements.needsMoodData) {
                summary.moodData = await this.fetchMoodData(userId, startDate);
            }

            // fetch symptom data if needed
            if (requirements.needsSymptomData) {
                summary.symptomData = await this.fetchSymptomData(userId, startDate);
            }

            // fetch health profile if needed
            if (requirements.needsHealthProfile) {
                summary.healthProfile = await this.fetchHealthProfile(userId);
            }

            // fetch activity data if needed
            if (requirements.needsRecentActivity) {
                summary.activityData = await this.fetchActivityData(userId, startDate);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }

        return summary;
    }

    private async fetchGlucoseData(userId: string, startDate: Date) {
        const { data: entries, error } = await this.supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_id', 'glucose-tracker')
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error || !entries || entries.length === 0) {
            return {
                latestReading: null,
                avgLast7Days: null,
                avgLast30Days: null,
                spikesCount: 0,
                timeInRange: 0,
                trendDirection: 'stable' as const
            };
        }

        // extract glucose levels (handle both 'level' and 'glucose_level' field names)
        const levels = entries.map(e => e.data?.level || e.data?.glucose_level).filter(l => l != null) as number[];
        const latestReading = levels[0] || null;
        
        // calculate averages
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const last7Days = entries.filter(e => new Date(e.timestamp) >= sevenDaysAgo);
        const last30Days = entries.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);
        
        const avgLast7Days = last7Days.length > 0 
            ? Math.round(last7Days.reduce((sum, e) => sum + (e.data?.level || e.data?.glucose_level || 0), 0) / last7Days.length)
            : null;
        const avgLast30Days = last30Days.length > 0 
            ? Math.round(last30Days.reduce((sum, e) => sum + (e.data?.level || e.data?.glucose_level || 0), 0) / last30Days.length)
            : null;
        
        // count spikes (>180 mg/dL)
        const spikesCount = levels.filter(l => l > 180).length;
        
        // calculate time in range (70-180 mg/dL)
        const inRangeCount = levels.filter(l => l >= 70 && l <= 180).length;
        const timeInRange = levels.length > 0 ? Math.round((inRangeCount / levels.length) * 100) : 0;
        
        // determine trend
        let trendDirection: 'stable' | 'increasing' | 'decreasing' = 'stable';
        if (avgLast7Days && avgLast30Days) {
            const diff = avgLast7Days - avgLast30Days;
            if (diff > 10) trendDirection = 'increasing';
            else if (diff < -10) trendDirection = 'decreasing';
        }

        return {
            latestReading,
            avgLast7Days,
            avgLast30Days,
            spikesCount,
            timeInRange,
            trendDirection
        };
    }

    private async fetchMedicationData(userId: string, startDate: Date) {
        const { data: entries, error } = await this.supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_id', 'medication-tracker')
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error || !entries || entries.length === 0) {
            return {
                adherenceRate: 0,
                missedDoses: 0,
                recentMedications: []
            };
        }

        // calculate adherence
        const takenCount = entries.filter(e => e.data?.taken === true).length;
        const adherenceRate = entries.length > 0 
            ? Math.round((takenCount / entries.length) * 100)
            : 0;
        const missedDoses = entries.length - takenCount;

        // get recent medications
        const medications = new Set(entries.map(e => e.data?.medication_name).filter(Boolean) as string[]);
        const recentMedications = Array.from(medications).slice(0, 5);

        return {
            adherenceRate,
            missedDoses,
            recentMedications
        };
    }

    private async fetchMoodData(userId: string, startDate: Date) {
        const { data: entries, error } = await this.supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_id', 'mood-tracker')
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error || !entries || entries.length === 0) {
            return {
                avgMoodScore: 0,
                recentMoods: [],
                trendDirection: 'stable' as const
            };
        }

        // calculate average mood score
        const moodScores = entries.map(e => e.data?.mood_score || e.data?.score || 5).filter(s => s != null) as number[];
        const avgMoodScore = moodScores.length > 0 
            ? Math.round((moodScores.reduce((sum, s) => sum + s, 0) / moodScores.length) * 10) / 10
            : 0;

        // get recent moods
        const moods = entries.map(e => e.data?.mood || e.data?.feeling).filter(Boolean) as string[];
        const recentMoods = Array.from(new Set(moods)).slice(0, 5);

        // determine trend (compare first half vs second half)
        let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
        if (moodScores.length >= 4) {
            const mid = Math.floor(moodScores.length / 2);
            const recentAvg = moodScores.slice(0, mid).reduce((sum, s) => sum + s, 0) / mid;
            const olderAvg = moodScores.slice(mid).reduce((sum, s) => sum + s, 0) / (moodScores.length - mid);
            const diff = recentAvg - olderAvg;
            if (diff > 0.5) trendDirection = 'improving';
            else if (diff < -0.5) trendDirection = 'declining';
        }

        return {
            avgMoodScore,
            recentMoods,
            trendDirection
        };
    }

    private async fetchSymptomData(userId: string, startDate: Date) {
        const { data: entries, error } = await this.supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_id', 'symptom-tracker')
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error || !entries || entries.length === 0) {
            return {
                recentSymptoms: [],
                severity: 'none',
                frequency: 'none'
            };
        }

        // get recent symptoms
        const symptoms = entries.map(e => e.data?.symptom || e.data?.name).filter(Boolean) as string[];
        const recentSymptoms = Array.from(new Set(symptoms)).slice(0, 5);

        // calculate average severity
        const severities = entries.map(e => e.data?.severity).filter(Boolean) as string[];
        const severityCounts = severities.reduce((acc, s) => {
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostCommonSeverity = Object.entries(severityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

        // determine frequency
        let frequency = 'none';
        if (entries.length >= 7) frequency = 'frequent';
        else if (entries.length >= 3) frequency = 'occasional';
        else if (entries.length > 0) frequency = 'rare';

        return {
            recentSymptoms,
            severity: mostCommonSeverity,
            frequency
        };
    }

    private async fetchHealthProfile(userId: string) {
        const { data: profile, error: profileError } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        const { data: conditions, error: conditionsError } = await this.supabase
            .from('user_health_conditions')
            .select('condition_id')
            .eq('user_id', userId);

        const { data: goals, error: goalsError } = await this.supabase
            .from('user_goals')
            .select('goal')
            .eq('user_id', userId);

        return {
            conditions: conditions?.map(c => c.condition_id) || [],
            age: profile?.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : null,
            goals: goals?.map(g => g.goal).filter(Boolean) || []
        };
    }

    private async fetchActivityData(userId: string, startDate: Date) {
        const { data: entries, error } = await this.supabase
            .from('tracking_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('tool_id', 'exercise-tracker')
            .gte('timestamp', startDate.toISOString())
            .order('timestamp', { ascending: false });

        if (error || !entries || entries.length === 0) {
            return {
                recentActivities: [],
                exerciseMinutes: 0
            };
        }

        // get recent activities
        const activities = entries.map(e => e.data?.activity || e.data?.type).filter(Boolean) as string[];
        const recentActivities = Array.from(new Set(activities)).slice(0, 5);

        // calculate total exercise minutes
        const exerciseMinutes = entries.reduce((sum, e) => sum + (e.data?.duration || 0), 0);

        return {
            recentActivities,
            exerciseMinutes
        };
    }

    /**
     * format user data summary into a concise context string for the llm
     */
    formatDataSummary(summary: UserDataSummary, requirements: ContextRequirements): string {
        const parts: string[] = [];

        if (summary.glucoseData) {
            const { latestReading, avgLast7Days, avgLast30Days, spikesCount, timeInRange, trendDirection } = summary.glucoseData;
            parts.push(`GLUCOSE DATA:
- Latest reading: ${latestReading ? `${latestReading} mg/dL` : 'N/A'}
- 7-day average: ${avgLast7Days ? `${avgLast7Days} mg/dL` : 'N/A'}
- 30-day average: ${avgLast30Days ? `${avgLast30Days} mg/dL` : 'N/A'}
- Spikes (>180 mg/dL): ${spikesCount} in ${requirements.timeframe}
- Time in range (70-180): ${timeInRange}%
- Trend: ${trendDirection}`);
        }

        if (summary.medicationData) {
            const { adherenceRate, missedDoses, recentMedications } = summary.medicationData;
            parts.push(`MEDICATION DATA:
- Adherence rate: ${adherenceRate}%
- Missed doses: ${missedDoses} in ${requirements.timeframe}
- Recent medications: ${recentMedications.join(', ') || 'None'}`);
        }

        if (summary.moodData) {
            const { avgMoodScore, recentMoods, trendDirection } = summary.moodData;
            parts.push(`MOOD DATA:
- Average mood score: ${avgMoodScore}/10
- Recent moods: ${recentMoods.join(', ') || 'None'}
- Trend: ${trendDirection}`);
        }

        if (summary.symptomData) {
            const { recentSymptoms, severity, frequency } = summary.symptomData;
            parts.push(`SYMPTOM DATA:
- Recent symptoms: ${recentSymptoms.join(', ') || 'None'}
- Severity: ${severity}
- Frequency: ${frequency}`);
        }

        if (summary.healthProfile) {
            const { conditions, age, goals } = summary.healthProfile;
            parts.push(`HEALTH PROFILE:
- Conditions: ${conditions.join(', ') || 'None'}
- Age: ${age || 'N/A'}
- Goals: ${goals.join(', ') || 'None'}`);
        }

        if (summary.activityData) {
            const { recentActivities, exerciseMinutes } = summary.activityData;
            parts.push(`ACTIVITY DATA:
- Recent activities: ${recentActivities.join(', ') || 'None'}
- Total exercise: ${exerciseMinutes} minutes in ${requirements.timeframe}`);
        }

        return parts.join('\n\n');
    }

    /**
     * main method: analyze query and fetch relevant user data
     */
    async getEnrichedContext(query: string, userId: string): Promise<string> {
        console.log('🔍 Analyzing query for context requirements...');
        
        const requirements = this.analyzeQuery(query);
        console.log('📋 Context requirements:', requirements);
        
        console.log('📊 Fetching relevant user data...');
        const userData = await this.fetchUserData(userId, requirements);
        
        const enrichedContext = this.formatDataSummary(userData, requirements);
        console.log('✅ Enriched context generated:', enrichedContext.length, 'characters');
        
        return enrichedContext;
    }
}

export const queryContextAnalyzer = new QueryContextAnalyzer();

