import { supabase } from '@/lib/supabase'
import { DatabaseService, TrackingEntry } from '@/lib/database'
import { UserAlert } from '@/lib/database/types'

export class AlertService {
  
  /**
   * Automatically check and generate alerts when new tracking data is added
   */
  static async checkAndGenerateAlerts(userId: string, newEntry: TrackingEntry): Promise<void> {
    console.log(`🚨 Auto-checking alerts for user ${userId} after new ${newEntry.tool_id} entry`)
    
    try {
      // Get recent tracking data for pattern analysis
      const recentEntries = await DatabaseService.getRecentTrackingEntries(userId, 7)
      
      // Check if immediate alerts should be triggered
      const urgentAlerts = await this.checkUrgentPatterns(userId, newEntry, recentEntries)
      
      if (urgentAlerts.length > 0) {
        console.log(`🚨 Generated ${urgentAlerts.length} urgent alerts`)
        for (const alert of urgentAlerts) {
          await this.saveAlert(alert)
        }
      }
      
      // Schedule full alert check if needed (e.g., once per day)
      await this.scheduleFullAlertCheck(userId)
      
    } catch (error) {
      console.error('Error in auto alerts generation:', error)
    }
  }

  /**
   * Check for urgent patterns that need immediate alerts
   */
  private static async checkUrgentPatterns(
    userId: string, 
    newEntry: TrackingEntry, 
    recentEntries: TrackingEntry[]
  ): Promise<UserAlert[]> {
    const alerts: UserAlert[] = []
    const toolId = newEntry.tool_id
    const newData = newEntry.data as any
    
    // Check for critical values that need immediate attention
    switch (toolId) {
      case 'glucose-tracker':
        const glucose = newData.glucose || newData.value
        if (glucose && (glucose < 70 || glucose > 250)) {
          alerts.push({
            user_id: userId,
            alert_type: glucose < 70 ? 'hypoglycemia' : 'hyperglycemia',
            severity: glucose < 60 || glucose > 300 ? 'critical' : 'high',
            title: glucose < 70 ? 'Low Blood Sugar Alert' : 'High Blood Sugar Alert',
            message: glucose < 70 
              ? `Your glucose reading of ${glucose} mg/dL is below normal. Consider consuming fast-acting carbs and recheck in 15 minutes.`
              : `Your glucose reading of ${glucose} mg/dL is elevated. Stay hydrated and consult your healthcare provider if levels remain high.`,
            metadata: { glucose_value: glucose, reading_time: newEntry.timestamp },
            triggered_at: new Date().toISOString()
          })
        }
        break
        
      case 'vital-signs-tracker':
        // Blood pressure alerts
        if (newData.systolic && newData.diastolic) {
          const sys = newData.systolic
          const dia = newData.diastolic
          
          if (sys >= 180 || dia >= 120) {
            alerts.push({
              user_id: userId,
              alert_type: 'hypertensive_crisis',
              severity: 'critical',
              title: 'Critical Blood Pressure Alert',
              message: `Your blood pressure reading of ${sys}/${dia} mmHg is dangerously high. Seek immediate medical attention.`,
              metadata: { systolic: sys, diastolic: dia, reading_time: newEntry.timestamp },
              triggered_at: new Date().toISOString()
            })
          } else if (sys >= 140 || dia >= 90) {
            alerts.push({
              user_id: userId,
              alert_type: 'elevated_blood_pressure',
              severity: 'medium',
              title: 'Elevated Blood Pressure',
              message: `Your blood pressure reading of ${sys}/${dia} mmHg is elevated. Monitor closely and consult your healthcare provider.`,
              metadata: { systolic: sys, diastolic: dia, reading_time: newEntry.timestamp },
              triggered_at: new Date().toISOString()
            })
          }
        }
        
        // Heart rate alerts
        if (newData.heartRate) {
          const hr = newData.heartRate
          if (hr >= 120 || hr <= 50) {
            alerts.push({
              user_id: userId,
              alert_type: hr >= 120 ? 'tachycardia' : 'bradycardia',
              severity: hr >= 150 || hr <= 40 ? 'high' : 'medium',
              title: hr >= 120 ? 'High Heart Rate Alert' : 'Low Heart Rate Alert',
              message: hr >= 120 
                ? `Your heart rate of ${hr} bpm is elevated. If you're not exercising, consider resting and monitor symptoms.`
                : `Your heart rate of ${hr} bpm is low. Monitor for dizziness or fatigue and consult your healthcare provider if concerned.`,
              metadata: { heart_rate: hr, reading_time: newEntry.timestamp },
              triggered_at: new Date().toISOString()
            })
          }
        }
        break
        
      case 'mood-tracker':
        const mood = newData.mood || newData.score
        if (mood && mood <= 2) {
          alerts.push({
            user_id: userId,
            alert_type: 'low_mood',
            severity: 'medium',
            title: 'Low Mood Detected',
            message: `Your mood rating of ${mood}/10 indicates you may be having a difficult time. Consider reaching out to a friend, counselor, or your healthcare provider for support.`,
            metadata: { mood_score: mood, reading_time: newEntry.timestamp },
            triggered_at: new Date().toISOString()
          })
        }
        break
    }
    
    return alerts
  }

  /**
   * Schedule a full alert check (rate-limited to avoid spam)
   */
  private static async scheduleFullAlertCheck(userId: string): Promise<void> {
    try {
      // Check if we've done a full alert check recently
      const { data: recentAlerts } = await supabase
        .from('user_alerts')
        .select('triggered_at')
        .eq('user_id', userId)
        .gte('triggered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1)
      
      // Only do full check if no alerts in last 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)
      const hasRecentFullCheck = recentAlerts && recentAlerts.length > 0 && 
        new Date(recentAlerts[0].triggered_at) > sixHoursAgo
      
      if (!hasRecentFullCheck) {
        console.log('🔄 Scheduling full alert check for user', userId)
        // Run full alert check in background
        this.checkUserAlerts(userId).catch(error => {
          console.error('Background alert check failed:', error)
        })
      }
    } catch (error) {
      console.error('Error scheduling full alert check:', error)
    }
  }

  /**
   * Check for all types of health alerts for a user
   */
  static async checkUserAlerts(userId: string): Promise<UserAlert[]> {
    console.log(`🚨 Checking alerts for user ${userId}`)
    
    try {
      // Get user data
      const [userProfile, userConditions, trackingData] = await Promise.all([
        DatabaseService.getUserProfile(userId),
        DatabaseService.getUserConditions(userId),
        DatabaseService.getTrackingEntries(userId, undefined, 100)
      ])

      if (!userProfile) {
        throw new Error('User profile not found')
      }

      const alerts: UserAlert[] = []
      
      // Group tracking data by tool
      const groupedData = this.groupDataByTool(trackingData)
      
      // Check condition-specific alerts
      for (const condition of userConditions) {
        const conditionAlerts = await this.checkConditionAlerts(userId, condition, groupedData)
        alerts.push(...conditionAlerts)
      }

      // Check general health alerts
      const generalAlerts = await this.checkGeneralHealthAlerts(userId, groupedData)
      alerts.push(...generalAlerts)

      // Check medication adherence alerts
      const medicationAlerts = await this.checkMedicationAlerts(userId, groupedData)
      alerts.push(...medicationAlerts)

      // Check streak alerts
      const streakAlerts = await this.checkStreakAlerts(userId, groupedData)
      alerts.push(...streakAlerts)

      // Save new alerts to database
      for (const alert of alerts) {
        await this.saveAlert(alert)
      }

      console.log(`✅ Generated ${alerts.length} alerts for user ${userId}`)
      return alerts

    } catch (error) {
      console.error('Error checking user alerts:', error)
      return []
    }
  }

  /**
   * Check alerts specific to user's health conditions
   */
  private static async checkConditionAlerts(
    userId: string, 
    condition: any, 
    groupedData: Record<string, TrackingEntry[]>
  ): Promise<UserAlert[]> {
    const alerts: UserAlert[] = []
    
    switch (condition.condition_id) {
      case 'diabetes':
      case 'type-1-diabetes':
      case 'type-2-diabetes':
        alerts.push(...this.checkDiabetesAlerts(userId, groupedData))
        break
        
      case 'hypertension':
      case 'high-blood-pressure':
        alerts.push(...this.checkHypertensionAlerts(userId, groupedData))
        break
        
      case 'asthma':
        alerts.push(...this.checkAsthmaAlerts(userId, groupedData))
        break
        
      case 'depression':
      case 'anxiety':
        alerts.push(...this.checkMentalHealthAlerts(userId, groupedData))
        break
    }
    
    return alerts
  }

  /**
   * Check diabetes-specific alerts
   */
  private static checkDiabetesAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): UserAlert[] {
    const alerts: UserAlert[] = []
    const glucoseEntries = groupedData['glucose-tracker'] || []
    
    if (glucoseEntries.length === 0) {
      // Alert for no glucose tracking
      alerts.push({
        user_id: userId,
        alert_type: 'glucose_missing',
        severity: 'warning',
        title: 'Missing Glucose Tracking',
        message: 'No glucose readings found. Regular monitoring is important for diabetes management.',
        action_required: 'Start tracking your glucose levels daily',
        metadata: { condition: 'diabetes' },
        is_read: false,
        is_dismissed: false
      })
      return alerts
    }

    // Check recent entries (last 7 days)
    const recentEntries = glucoseEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const glucoseValues = recentEntries
      .map(entry => parseFloat(entry.data.glucose_level))
      .filter(val => !isNaN(val))

    if (glucoseValues.length === 0) return alerts

    // Check for high glucose (hyperglycemia)
    const highReadings = glucoseValues.filter(val => val > 180)
    if (highReadings.length > 2) {
      alerts.push({
        user_id: userId,
        alert_type: 'glucose_high',
        severity: 'urgent',
        title: 'High Glucose Alert',
        message: `${highReadings.length} glucose readings above 180 mg/dL in the past week`,
        action_required: 'Contact your healthcare provider to discuss your glucose management plan',
        metadata: { 
          tool_id: 'glucose-tracker',
          high_readings: highReadings.length,
          max_reading: Math.max(...highReadings)
        },
        is_read: false,
        is_dismissed: false
      })
    }

    // Check for low glucose (hypoglycemia) - more urgent
    const lowReadings = glucoseValues.filter(val => val < 70)
    if (lowReadings.length > 0) {
      alerts.push({
        user_id: userId,
        alert_type: 'glucose_low',
        severity: 'critical',
        title: 'Low Glucose Alert',
        message: `${lowReadings.length} glucose readings below 70 mg/dL detected`,
        action_required: 'Treat hypoglycemia immediately and monitor closely. Consider adjusting your diabetes management plan.',
        metadata: { 
          tool_id: 'glucose-tracker',
          low_readings: lowReadings.length,
          min_reading: Math.min(...lowReadings)
        },
        is_read: false,
        is_dismissed: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expires in 24 hours
      })
    }

    // Check for glucose variability
    if (glucoseValues.length > 5) {
      const mean = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length
      const variance = glucoseValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / glucoseValues.length
      const standardDeviation = Math.sqrt(variance)
      
      if (standardDeviation > 50) {
        alerts.push({
          user_id: userId,
          alert_type: 'glucose_variability',
          severity: 'warning',
          title: 'High Glucose Variability',
          message: `Your glucose levels are varying significantly (SD: ${standardDeviation.toFixed(1)})`,
          action_required: 'Consider reviewing your diet, medication timing, and stress management',
          metadata: { 
            tool_id: 'glucose-tracker',
            standard_deviation: standardDeviation,
            mean_glucose: mean
          },
          is_read: false,
          is_dismissed: false
        })
      }
    }

    return alerts
  }

  /**
   * Check hypertension-specific alerts
   */
  private static checkHypertensionAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): UserAlert[] {
    const alerts: UserAlert[] = []
    const bpEntries = groupedData['vital-signs-tracker'] || []
    
    const recentBpEntries = bpEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      entry.data.blood_pressure_systolic && entry.data.blood_pressure_diastolic
    )

    if (recentBpEntries.length === 0) {
      alerts.push({
        user_id: userId,
        alert_type: 'bp_missing',
        severity: 'warning',
        title: 'Missing Blood Pressure Monitoring',
        message: 'No blood pressure readings found. Regular monitoring is crucial for hypertension management.',
        action_required: 'Start tracking your blood pressure regularly',
        metadata: { condition: 'hypertension' },
        is_read: false,
        is_dismissed: false
      })
      return alerts
    }

    // Check for consistently high blood pressure
    const highBpReadings = recentBpEntries.filter(entry => 
      entry.data.blood_pressure_systolic > 140 || entry.data.blood_pressure_diastolic > 90
    )

    if (highBpReadings.length > 2) {
      const avgSystolic = highBpReadings.reduce((sum, entry) => sum + entry.data.blood_pressure_systolic, 0) / highBpReadings.length
      const avgDiastolic = highBpReadings.reduce((sum, entry) => sum + entry.data.blood_pressure_diastolic, 0) / highBpReadings.length

      alerts.push({
        user_id: userId,
        alert_type: 'bp_high',
        severity: 'urgent',
        title: 'High Blood Pressure Alert',
        message: `${highBpReadings.length} blood pressure readings above normal range (avg: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg)`,
        action_required: 'Contact your healthcare provider to review your blood pressure management',
        metadata: { 
          tool_id: 'vital-signs-tracker',
          high_readings: highBpReadings.length,
          avg_systolic: avgSystolic,
          avg_diastolic: avgDiastolic
        },
        is_read: false,
        is_dismissed: false
      })
    }

    return alerts
  }

  /**
   * Check mental health related alerts
   */
  private static checkMentalHealthAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): UserAlert[] {
    const alerts: UserAlert[] = []
    const moodEntries = groupedData['mood-tracker'] || []
    
    const recentMoodEntries = moodEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      entry.data.mood_score !== undefined
    )

    if (recentMoodEntries.length === 0) return alerts

    const moodScores = recentMoodEntries.map(entry => parseFloat(entry.data.mood_score)).filter(score => !isNaN(score))
    
    if (moodScores.length === 0) return alerts

    // Check for consistently low mood
    const lowMoodDays = moodScores.filter(score => score <= 3).length
    if (lowMoodDays >= 3) {
      alerts.push({
        user_id: userId,
        alert_type: 'mood_low',
        severity: 'warning',
        title: 'Low Mood Pattern Detected',
        message: `You've reported low mood (≤3) for ${lowMoodDays} days this week`,
        action_required: 'Consider reaching out to a mental health professional or trusted support person',
        metadata: { 
          tool_id: 'mood-tracker',
          low_mood_days: lowMoodDays,
          avg_mood: moodScores.reduce((a, b) => a + b, 0) / moodScores.length
        },
        is_read: false,
        is_dismissed: false
      })
    }

    // Check for very low mood (potential crisis)
    const veryLowMoodDays = moodScores.filter(score => score <= 1).length
    if (veryLowMoodDays > 0) {
      alerts.push({
        user_id: userId,
        alert_type: 'mood_critical',
        severity: 'critical',
        title: 'Very Low Mood Alert',
        message: `You've reported very low mood (≤1) recently. Your wellbeing is important.`,
        action_required: 'Please reach out for support immediately. Contact a mental health crisis line if needed.',
        metadata: { 
          tool_id: 'mood-tracker',
          critical_days: veryLowMoodDays
        },
        is_read: false,
        is_dismissed: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 7 days
      })
    }

    return alerts
  }

  /**
   * Check asthma-specific alerts
   */
  private static checkAsthmaAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): UserAlert[] {
    const alerts: UserAlert[] = []
    const symptomEntries = groupedData['symptom-tracker'] || []
    
    // Check for respiratory symptoms
    const recentSymptomEntries = symptomEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      (entry.data.symptoms?.includes('shortness_of_breath') || 
       entry.data.symptoms?.includes('wheezing') ||
       entry.data.symptoms?.includes('chest_tightness'))
    )

    if (recentSymptomEntries.length > 2) {
      alerts.push({
        user_id: userId,
        alert_type: 'asthma_symptoms',
        severity: 'warning',
        title: 'Asthma Symptoms Detected',
        message: `You've reported asthma-related symptoms ${recentSymptomEntries.length} times this week`,
        action_required: 'Monitor your symptoms closely and ensure you have your rescue inhaler available',
        metadata: { 
          tool_id: 'symptom-tracker',
          symptom_reports: recentSymptomEntries.length,
          condition: 'asthma'
        },
        is_read: false,
        is_dismissed: false
      })
    }

    return alerts
  }

  /**
   * Check general health alerts (not condition-specific)
   */
  private static async checkGeneralHealthAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): Promise<UserAlert[]> {
    const alerts: UserAlert[] = []

    // Check sleep patterns
    const sleepEntries = groupedData['sleep-tracker'] || []
    const recentSleepEntries = sleepEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
      entry.data.hours_slept !== undefined
    )

    if (recentSleepEntries.length > 0) {
      const avgSleep = recentSleepEntries.reduce((sum, entry) => 
        sum + parseFloat(entry.data.hours_slept), 0
      ) / recentSleepEntries.length

      if (avgSleep < 6) {
        alerts.push({
          user_id: userId,
          alert_type: 'sleep_insufficient',
          severity: 'warning',
          title: 'Insufficient Sleep Pattern',
          message: `Your average sleep is ${avgSleep.toFixed(1)} hours (recommended: 7-9 hours)`,
          action_required: 'Focus on improving sleep hygiene and consider consulting a healthcare provider',
          metadata: { 
            tool_id: 'sleep-tracker',
            avg_sleep: avgSleep,
            sleep_entries: recentSleepEntries.length
          },
          is_read: false,
          is_dismissed: false
        })
      }
    }

    // Check vital signs for unusual patterns
    const vitalEntries = groupedData['vital-signs-tracker'] || []
    const recentVitalEntries = vitalEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    for (const entry of recentVitalEntries) {
      const heartRate = parseFloat(entry.data.heart_rate)
      
      if (!isNaN(heartRate)) {
        if (heartRate > 100) {
          alerts.push({
            user_id: userId,
            alert_type: 'heart_rate_high',
            severity: 'info',
            title: 'Elevated Heart Rate',
            message: `Heart rate reading of ${heartRate} bpm detected (normal resting: 60-100 bpm)`,
            action_required: 'Monitor your heart rate and note any symptoms. Consult healthcare provider if persistently elevated.',
            metadata: { 
              tool_id: 'vital-signs-tracker',
              heart_rate: heartRate,
              reading_date: entry.timestamp
            },
            is_read: false,
            is_dismissed: false,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        } else if (heartRate < 50) {
          alerts.push({
            user_id: userId,
            alert_type: 'heart_rate_low',
            severity: 'warning',
            title: 'Low Heart Rate',
            message: `Heart rate reading of ${heartRate} bpm detected (normal resting: 60-100 bpm)`,
            action_required: 'Monitor for symptoms like dizziness or fatigue. Consider consulting a healthcare provider.',
            metadata: { 
              tool_id: 'vital-signs-tracker',
              heart_rate: heartRate,
              reading_date: entry.timestamp
            },
            is_read: false,
            is_dismissed: false,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    }

    return alerts
  }

  /**
   * Check medication adherence alerts
   */
  private static async checkMedicationAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): Promise<UserAlert[]> {
    const alerts: UserAlert[] = []
    const medicationEntries = groupedData['medication-reminder'] || []
    
    const recentMedicationEntries = medicationEntries.filter(entry => 
      new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    if (recentMedicationEntries.length === 0) return alerts

    const missedDoses = recentMedicationEntries.filter(entry => entry.data.taken === false)
    const adherenceRate = ((recentMedicationEntries.length - missedDoses.length) / recentMedicationEntries.length) * 100

    if (adherenceRate < 80) {
      alerts.push({
        user_id: userId,
        alert_type: 'medication_adherence',
        severity: adherenceRate < 60 ? 'urgent' : 'warning',
        title: 'Low Medication Adherence',
        message: `Medication adherence is ${adherenceRate.toFixed(1)}% (${missedDoses.length} missed doses this week)`,
        action_required: 'Review your medication schedule and consider setting up reminders',
        metadata: { 
          tool_id: 'medication-reminder',
          adherence_rate: adherenceRate,
          missed_doses: missedDoses.length,
          total_doses: recentMedicationEntries.length
        },
        is_read: false,
        is_dismissed: false
      })
    }

    return alerts
  }

  /**
   * Check streak alerts (motivation/engagement)
   */
  private static async checkStreakAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): Promise<UserAlert[]> {
    const alerts: UserAlert[] = []
    
    // Check for tools with broken streaks (no entries for 2+ days)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dayBeforeYesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    for (const [toolId, entries] of Object.entries(groupedData)) {
      const hasRecentEntry = entries.some(entry => 
        entry.timestamp.startsWith(yesterday) || entry.timestamp.startsWith(dayBeforeYesterday)
      )
      
      if (!hasRecentEntry && entries.length > 0) {
        // Check if they had a streak before
        const lastWeekEntries = entries.filter(entry => 
          new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        
        if (lastWeekEntries.length > 2) {
          alerts.push({
            user_id: userId,
            alert_type: 'streak_broken',
            severity: 'info',
            title: 'Tracking Streak at Risk',
            message: `You haven't tracked with ${this.getToolName(toolId)} recently. Keep up your health tracking momentum!`,
            action_required: 'Continue your health tracking routine',
            metadata: { 
              tool_id: toolId,
              last_entry: entries[0]?.timestamp
            },
            is_read: false,
            is_dismissed: false,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    }

    return alerts
  }

  /**
   * Get active alerts for a user
   */
  static async getUserAlerts(userId: string, includeRead = false): Promise<UserAlert[]> {
    try {
      let query = supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!includeRead) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user alerts:', error)
      return []
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  /**
   * Dismiss alert
   */
  static async dismissAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId)

      if (error) throw error
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  /**
   * Helper methods
   */
  private static groupDataByTool(trackingData: TrackingEntry[]): Record<string, TrackingEntry[]> {
    return trackingData.reduce((groups, entry) => {
      if (!groups[entry.tool_id]) {
        groups[entry.tool_id] = []
      }
      groups[entry.tool_id].push(entry)
      return groups
    }, {} as Record<string, TrackingEntry[]>)
  }

  private static getToolName(toolId: string): string {
    const toolNames: Record<string, string> = {
      'glucose-tracker': 'Glucose Tracker',
      'mood-tracker': 'Mood Tracker',
      'sleep-tracker': 'Sleep Tracker',
      'vital-signs-tracker': 'Vital Signs',
      'hydration-tracker': 'Hydration Tracker',
      'nutrition-tracker': 'Nutrition Tracker',
      'medication-reminder': 'Medication Reminder',
      'symptom-tracker': 'Symptom Tracker'
    }
    return toolNames[toolId] || toolId
  }

  private static async saveAlert(alert: UserAlert): Promise<void> {
    try {
      // Check if similar alert already exists (avoid duplicates)
      const { data: existingAlerts } = await supabase
        .from('user_alerts')
        .select('id')
        .eq('user_id', alert.user_id)
        .eq('alert_type', alert.alert_type)
        .eq('is_dismissed', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (existingAlerts && existingAlerts.length > 0) {
        // Similar alert already exists, skip
        return
      }

      const { error } = await supabase
        .from('user_alerts')
        .insert(alert)

      if (error) throw error
    } catch (error) {
      console.error('Error saving alert:', error)
    }
  }
}