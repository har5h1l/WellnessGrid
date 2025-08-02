import { supabase } from '@/lib/supabase'
import { DatabaseService, TrackingEntry } from '@/lib/database'
import { HealthScore } from '@/lib/database/types'

interface ScoreComponent {
  name: string
  value: number
  weight: number
  max_score: number
}

export class WellnessScoreService {
  
  /**
   * Calculate comprehensive wellness score for a user
   */
  static async calculateWellnessScore(
    userId: string, 
    scorePeriod: string = '7d'
  ): Promise<HealthScore> {
    console.log(`📊 Calculating wellness score for user ${userId} (${scorePeriod})`)
    
    try {
      // Get user data
      const [userProfile, userConditions, trackingData] = await Promise.all([
        DatabaseService.getUserProfile(userId),
        DatabaseService.getUserHealthConditions(userId),
        this.getRecentTrackingData(userId, scorePeriod)
      ])

      if (!userProfile) {
        throw new Error('User profile not found')
      }

      // Group tracking data by tool
      const groupedData = this.groupDataByTool(trackingData)
      
      // Calculate base component scores
      const baseComponents = this.calculateBaseComponents(groupedData, scorePeriod)
      
      // Apply condition-specific adjustments
      const adjustedComponents = this.applyConditionAdjustments(
        baseComponents, 
        userConditions, 
        groupedData
      )
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(adjustedComponents)
      
      // Determine trend
      const trend = await this.calculateTrend(userId, overallScore, scorePeriod)
      
      // Create health score object
      const healthScore: HealthScore = {
        user_id: userId,
        overall_score: Math.round(overallScore * 100) / 100,
        component_scores: this.formatComponentScores(adjustedComponents),
        trend,
        score_period: scorePeriod,
        calculated_at: new Date().toISOString()
      }

      // Save to database
      await this.saveHealthScore(healthScore)
      
      console.log(`✅ Wellness score calculated: ${healthScore.overall_score}/100`)
      return healthScore

    } catch (error) {
      console.error('Error calculating wellness score:', error)
      throw error
    }
  }

  /**
   * Calculate base component scores from tracking data
   */
  private static calculateBaseComponents(
    groupedData: Record<string, TrackingEntry[]>, 
    scorePeriod: string
  ): ScoreComponent[] {
    const components: ScoreComponent[] = []
    const days = this.parseDayRange(scorePeriod)
    
    // Glucose Management (for diabetic users)
    const glucoseScore = this.calculateGlucoseScore(groupedData['glucose-tracker'] || [], days)
    if (glucoseScore !== null) {
      components.push({
        name: 'glucose',
        value: glucoseScore,
        weight: 0.25,
        max_score: 100
      })
    }

    // Medication Adherence
    const medicationScore = this.calculateMedicationScore(groupedData['medication-reminder'] || [], days)
    if (medicationScore !== null) {
      components.push({
        name: 'medication_adherence',
        value: medicationScore,
        weight: 0.20,
        max_score: 100
      })
    }

    // Sleep Quality
    const sleepScore = this.calculateSleepScore(groupedData['sleep-tracker'] || [], days)
    if (sleepScore !== null) {
      components.push({
        name: 'sleep',
        value: sleepScore,
        weight: 0.15,
        max_score: 100
      })
    }

    // Mood/Mental Health
    const moodScore = this.calculateMoodScore(groupedData['mood-tracker'] || [], days)
    if (moodScore !== null) {
      components.push({
        name: 'mood',
        value: moodScore,
        weight: 0.15,
        max_score: 100
      })
    }

    // Vital Signs
    const vitalSignsScore = this.calculateVitalSignsScore(groupedData['vital-signs-tracker'] || [], days)
    if (vitalSignsScore !== null) {
      components.push({
        name: 'vital_signs',
        value: vitalSignsScore,
        weight: 0.10,
        max_score: 100
      })
    }

    // Exercise/Activity
    const exerciseScore = this.calculateExerciseScore(groupedData['exercise-tracker'] || [], days)
    if (exerciseScore !== null) {
      components.push({
        name: 'exercise',
        value: exerciseScore,
        weight: 0.10,
        max_score: 100
      })
    }

    // Nutrition
    const nutritionScore = this.calculateNutritionScore(groupedData['nutrition-tracker'] || [], days)
    if (nutritionScore !== null) {
      components.push({
        name: 'nutrition',
        value: nutritionScore,
        weight: 0.05,
        max_score: 100
      })
    }

    return components
  }

  /**
   * Calculate glucose management score
   */
  private static calculateGlucoseScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    const glucoseValues = entries
      .map(entry => parseFloat(entry.data.glucose_level))
      .filter(val => !isNaN(val))

    if (glucoseValues.length === 0) return null

    let score = 100
    
    // Target range: 80-130 mg/dL (pre-meal), 80-180 mg/dL (post-meal)
    // We'll use 70-180 as acceptable range for scoring
    
    const inRangeCount = glucoseValues.filter(val => val >= 70 && val <= 180).length
    const timeInRange = (inRangeCount / glucoseValues.length) * 100
    
    // Base score on time in range
    score = timeInRange
    
    // Penalize severe hypoglycemia more heavily
    const severeHypoCount = glucoseValues.filter(val => val < 54).length
    score -= severeHypoCount * 15
    
    // Penalize moderate hypoglycemia
    const moderateHypoCount = glucoseValues.filter(val => val >= 54 && val < 70).length
    score -= moderateHypoCount * 10
    
    // Penalize severe hyperglycemia
    const severeHyperCount = glucoseValues.filter(val => val > 250).length
    score -= severeHyperCount * 10
    
    // Penalize moderate hyperglycemia
    const moderateHyperCount = glucoseValues.filter(val => val > 180 && val <= 250).length
    score -= moderateHyperCount * 5
    
    // Bonus for consistency (low variability)
    const mean = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length
    const variance = glucoseValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseValues.length
    const cv = Math.sqrt(variance) / mean // Coefficient of variation
    
    if (cv < 0.3) score += 5 // Low variability bonus
    else if (cv > 0.5) score -= 5 // High variability penalty
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate medication adherence score
   */
  private static calculateMedicationScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    const takenCount = entries.filter(entry => entry.data.taken === true).length
    const adherenceRate = (takenCount / entries.length) * 100
    
    // Convert adherence rate to score with bonuses/penalties
    let score = adherenceRate
    
    if (adherenceRate >= 95) score += 5 // Perfect adherence bonus
    else if (adherenceRate < 70) score -= 10 // Poor adherence penalty
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate sleep quality score
   */
  private static calculateSleepScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    const sleepData = entries
      .map(entry => ({
        hours: parseFloat(entry.data.hours_slept),
        quality: parseFloat(entry.data.sleep_quality)
      }))
      .filter(data => !isNaN(data.hours))

    if (sleepData.length === 0) return null

    let score = 0
    let count = 0

    for (const data of sleepData) {
      let entryScore = 0
      
      // Hours slept score (optimal: 7-9 hours)
      if (data.hours >= 7 && data.hours <= 9) {
        entryScore += 50
      } else if (data.hours >= 6 && data.hours < 7) {
        entryScore += 40
      } else if (data.hours >= 9 && data.hours <= 10) {
        entryScore += 40
      } else if (data.hours >= 5 && data.hours < 6) {
        entryScore += 25
      } else if (data.hours > 10 && data.hours <= 11) {
        entryScore += 25
      } else {
        entryScore += 10 // Very poor sleep duration
      }
      
      // Sleep quality score (if available)
      if (!isNaN(data.quality)) {
        entryScore += (data.quality / 10) * 50 // Scale 0-10 to 0-50
      } else {
        entryScore += 25 // Default quality if not provided
      }
      
      score += entryScore
      count++
    }

    return count > 0 ? score / count : null
  }

  /**
   * Calculate mood score
   */
  private static calculateMoodScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    const moodValues = entries
      .map(entry => parseFloat(entry.data.mood_score))
      .filter(val => !isNaN(val))

    if (moodValues.length === 0) return null

    // Scale mood from 0-10 to 0-100
    const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length
    let score = (avgMood / 10) * 100
    
    // Bonus for consistency (avoid extreme variations)
    const variance = moodValues.reduce((sum, val) => sum + Math.pow(val - avgMood, 2), 0) / moodValues.length
    const standardDeviation = Math.sqrt(variance)
    
    if (standardDeviation < 1) score += 10 // Consistent mood bonus
    else if (standardDeviation > 3) score -= 10 // Highly variable mood penalty
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate vital signs score
   */
  private static calculateVitalSignsScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    let totalScore = 0
    let scoreCount = 0

    for (const entry of entries) {
      let entryScore = 0
      let componentCount = 0

      // Blood pressure scoring
      const systolic = parseFloat(entry.data.blood_pressure_systolic)
      const diastolic = parseFloat(entry.data.blood_pressure_diastolic)
      
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        let bpScore = 100
        
        // Optimal: <120/80, Normal: <130/85, High: >=140/90
        if (systolic < 120 && diastolic < 80) {
          bpScore = 100
        } else if (systolic < 130 && diastolic < 85) {
          bpScore = 85
        } else if (systolic < 140 && diastolic < 90) {
          bpScore = 70
        } else if (systolic < 160 && diastolic < 100) {
          bpScore = 50
        } else {
          bpScore = 25
        }
        
        entryScore += bpScore
        componentCount++
      }

      // Heart rate scoring
      const heartRate = parseFloat(entry.data.heart_rate)
      if (!isNaN(heartRate)) {
        let hrScore = 100
        
        // Normal resting: 60-100 bpm
        if (heartRate >= 60 && heartRate <= 100) {
          hrScore = 100
        } else if (heartRate >= 50 && heartRate < 60) {
          hrScore = 80 // Bradycardia but possibly athletic
        } else if (heartRate > 100 && heartRate <= 120) {
          hrScore = 70 // Mild tachycardia
        } else if (heartRate > 120 && heartRate <= 150) {
          hrScore = 40 // Moderate tachycardia
        } else {
          hrScore = 20 // Severe abnormality
        }
        
        entryScore += hrScore
        componentCount++
      }

      // Weight scoring (if available)
      const weight = parseFloat(entry.data.weight)
      if (!isNaN(weight)) {
        // This would need user's target weight for proper scoring
        // For now, give neutral score
        entryScore += 75
        componentCount++
      }

      if (componentCount > 0) {
        totalScore += entryScore / componentCount
        scoreCount++
      }
    }

    return scoreCount > 0 ? totalScore / scoreCount : null
  }

  /**
   * Calculate exercise score
   */
  private static calculateExerciseScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    // Target: 150 minutes moderate exercise per week (≈22 min/day)
    const targetMinutesPerDay = 22
    const totalMinutes = entries.reduce((sum, entry) => {
      const duration = parseFloat(entry.data.exercise_duration || entry.data.duration || 0)
      return sum + (isNaN(duration) ? 0 : duration)
    }, 0)

    const avgMinutesPerDay = totalMinutes / days
    
    let score = Math.min(100, (avgMinutesPerDay / targetMinutesPerDay) * 100)
    
    // Bonus for consistency (exercising regularly vs cramming)
    const exerciseDays = entries.length
    const consistencyRate = exerciseDays / days
    
    if (consistencyRate >= 0.8) score += 10 // Very consistent
    else if (consistencyRate >= 0.5) score += 5 // Moderately consistent
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Calculate nutrition score
   */
  private static calculateNutritionScore(entries: TrackingEntry[], days: number): number | null {
    if (entries.length === 0) return null

    // This is a simplified scoring - in reality would need more detailed analysis
    let score = 70 // Base score for tracking nutrition
    
    // Bonus for regular tracking
    const trackingDays = entries.length
    const trackingRate = trackingDays / days
    
    if (trackingRate >= 0.8) score += 20
    else if (trackingRate >= 0.5) score += 10
    
    // Could add more sophisticated scoring based on calories, macros, etc.
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Apply condition-specific adjustments to component scores
   */
  private static applyConditionAdjustments(
    components: ScoreComponent[], 
    userConditions: any[], 
    groupedData: Record<string, TrackingEntry[]>
  ): ScoreComponent[] {
    const adjustedComponents = [...components]
    
    for (const condition of userConditions) {
      switch (condition.condition_id) {
        case 'diabetes':
        case 'type-1-diabetes':
        case 'type-2-diabetes':
          // Increase glucose weight for diabetic users
          const glucoseComponent = adjustedComponents.find(c => c.name === 'glucose')
          if (glucoseComponent) {
            glucoseComponent.weight = 0.35 // Increased from 0.25
          }
          break
          
        case 'hypertension':
        case 'high-blood-pressure':
          // Increase vital signs weight for hypertensive users
          const vitalComponent = adjustedComponents.find(c => c.name === 'vital_signs')
          if (vitalComponent) {
            vitalComponent.weight = 0.25 // Increased from 0.10
          }
          break
          
        case 'depression':
        case 'anxiety':
          // Increase mood weight for mental health conditions
          const moodComponent = adjustedComponents.find(c => c.name === 'mood')
          if (moodComponent) {
            moodComponent.weight = 0.25 // Increased from 0.15
          }
          break
      }
    }
    
    // Normalize weights to sum to 1.0
    const totalWeight = adjustedComponents.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight > 0) {
      adjustedComponents.forEach(c => c.weight = c.weight / totalWeight)
    }
    
    return adjustedComponents
  }

  /**
   * Calculate overall wellness score from components
   */
  private static calculateOverallScore(components: ScoreComponent[]): number {
    if (components.length === 0) return 50 // Neutral score if no data
    
    const weightedSum = components.reduce((sum, component) => {
      return sum + (component.value * component.weight)
    }, 0)
    
    return Math.max(0, Math.min(100, weightedSum))
  }

  /**
   * Calculate trend compared to previous scores
   */
  private static async calculateTrend(
    userId: string, 
    currentScore: number, 
    scorePeriod: string
  ): Promise<'improving' | 'stable' | 'declining' | 'insufficient_data'> {
    try {
      // Get previous scores
      const { data: previousScores, error } = await supabase
        .from('health_scores')
        .select('overall_score, calculated_at')
        .eq('user_id', userId)
        .eq('score_period', scorePeriod)
        .order('calculated_at', { ascending: false })
        .limit(5)

      if (error) throw error

      if (!previousScores || previousScores.length < 2) {
        return 'insufficient_data'
      }

      // Compare with average of last few scores
      const recentScores = previousScores.slice(1, 4) // Skip current, take last 3
      if (recentScores.length === 0) return 'insufficient_data'

      const avgPreviousScore = recentScores.reduce((sum, s) => sum + s.overall_score, 0) / recentScores.length
      const difference = currentScore - avgPreviousScore

      if (difference > 5) return 'improving'
      else if (difference < -5) return 'declining'
      else return 'stable'

    } catch (error) {
      console.error('Error calculating trend:', error)
      return 'insufficient_data'
    }
  }

  /**
   * Helper methods
   */
  private static async getRecentTrackingData(userId: string, scorePeriod: string): Promise<TrackingEntry[]> {
    const days = this.parseDayRange(scorePeriod)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    return await DatabaseService.getTrackingEntries(userId, undefined, 1000)
  }

  private static parseDayRange(scorePeriod: string): number {
    const match = scorePeriod.match(/(\d+)d/)
    return match ? parseInt(match[1]) : 7
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

  private static formatComponentScores(components: ScoreComponent[]): Record<string, number> {
    return components.reduce((scores, component) => {
      scores[component.name] = Math.round(component.value * 100) / 100
      return scores
    }, {} as Record<string, number>)
  }

  private static async saveHealthScore(healthScore: HealthScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('health_scores')
        .insert(healthScore)

      if (error) throw error
    } catch (error) {
      console.error('Error saving health score:', error)
    }
  }

  /**
   * Get user's health score history
   */
  static async getHealthScoreHistory(
    userId: string, 
    scorePeriod: string = '7d', 
    limit: number = 30
  ): Promise<HealthScore[]> {
    try {
      const { data, error } = await supabase
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('score_period', scorePeriod)
        .order('calculated_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching health score history:', error)
      return []
    }
  }

  /**
   * Get latest health score for a user
   */
  static async getLatestHealthScore(
    userId: string, 
    scorePeriod: string = '7d'
  ): Promise<HealthScore | null> {
    try {
      const { data, error } = await supabase
        .from('health_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('score_period', scorePeriod)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error fetching latest health score:', error)
      return null
    }
  }
}