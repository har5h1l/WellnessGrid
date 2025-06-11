import type { AppState } from "./types"

export class WellnessCalculator {
  static calculate(state: AppState): number {
    if (!state.user) return 75

    const today = new Date().toISOString().split("T")[0]
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Recent symptoms (lower score for more/severe symptoms)
    const recentSymptoms = state.symptoms.filter((s) => s.date >= lastWeek && s.userId === state.user!.id)
    const symptomScore = Math.max(
      0,
      100 - recentSymptoms.length * 5 - recentSymptoms.reduce((sum, s) => sum + s.severity, 0) * 2,
    )

    // Recent moods (higher score for better moods)
    const recentMoods = state.moods.filter((m) => m.date >= lastWeek && m.userId === state.user!.id)
    const avgMoodScore =
      recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => {
            const moodValue = { "very-sad": 1, sad: 2, neutral: 3, happy: 4, "very-happy": 5 }[m.mood]
            return sum + moodValue
          }, 0) / recentMoods.length
        : 3
    const moodScore = (avgMoodScore / 5) * 100

    // Medication adherence
    const adherenceScore = this.calculateMedicationAdherence(state)

    // Activity and lifestyle factors
    const lifestyleScore = this.calculateLifestyleScore(state)

    // Weighted average
    const finalScore = Math.round(symptomScore * 0.3 + moodScore * 0.25 + adherenceScore * 0.25 + lifestyleScore * 0.2)

    return Math.max(0, Math.min(100, finalScore))
  }

  private static calculateMedicationAdherence(state: AppState): number {
    if (state.medications.length === 0) return 100

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const recentLogs = state.medicationLogs.filter((log) => log.date >= lastWeek && log.userId === state.user!.id)

    const adherenceRates = state.medications.map((med) => {
      const expectedDoses = 7 * med.timeSlots.length
      const actualDoses = recentLogs.filter((log) => log.medicationId === med.id && log.taken).length
      return expectedDoses > 0 ? (actualDoses / expectedDoses) * 100 : 100
    })

    return adherenceRates.length > 0 ? adherenceRates.reduce((sum, rate) => sum + rate, 0) / adherenceRates.length : 100
  }

  private static calculateLifestyleScore(state: AppState): number {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Activity tracking
    const recentActivities = state.activities.filter((a) => a.date >= lastWeek && a.userId === state.user!.id)
    const activityScore = Math.min(100, recentActivities.length * 10)

    // Nutrition tracking
    const recentNutrition = state.nutrition.filter((n) => n.date >= lastWeek && n.userId === state.user!.id)
    const nutritionScore = Math.min(100, recentNutrition.length * 5)

    // Sleep quality (from health metrics)
    const recentMetrics = state.healthMetrics.filter((m) => m.date >= lastWeek && m.userId === state.user!.id)
    const avgSleep =
      recentMetrics.length > 0 ? recentMetrics.reduce((sum, m) => sum + m.sleepHours, 0) / recentMetrics.length : 7.5
    const sleepScore = Math.max(0, Math.min(100, (avgSleep / 8) * 100))

    return (activityScore + nutritionScore + sleepScore) / 3
  }

  static getTrendDirection(state: AppState, days = 14): "improving" | "declining" | "stable" {
    const midPoint = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const firstHalfSymptoms = state.symptoms.filter(
      (s) => s.date >= startDate && s.date < midPoint && s.userId === state.user!.id,
    )
    const secondHalfSymptoms = state.symptoms.filter((s) => s.date >= midPoint && s.userId === state.user!.id)

    const firstHalfAvg =
      firstHalfSymptoms.length > 0
        ? firstHalfSymptoms.reduce((sum, s) => sum + s.severity, 0) / firstHalfSymptoms.length
        : 0
    const secondHalfAvg =
      secondHalfSymptoms.length > 0
        ? secondHalfSymptoms.reduce((sum, s) => sum + s.severity, 0) / secondHalfSymptoms.length
        : 0

    const difference = secondHalfAvg - firstHalfAvg

    if (difference > 0.3) return "declining"
    if (difference < -0.3) return "improving"
    return "stable"
  }

  static generateInsights(state: AppState): string[] {
    const insights: string[] = []

    if (!state.user) return insights

    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const recentSymptoms = state.symptoms.filter((s) => s.date >= lastWeek && s.userId === state.user.id)
    const recentMoods = state.moods.filter((m) => m.date >= lastWeek && m.userId === state.user.id)

    // Symptom patterns
    if (recentSymptoms.length > 5) {
      insights.push(
        "You've logged more symptoms than usual this week. Consider discussing this with your healthcare provider.",
      )
    }

    // Mood patterns
    const avgStress =
      recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.stress, 0) / recentMoods.length : 0
    if (avgStress > 7) {
      insights.push(
        "Your stress levels have been higher than usual. Try some relaxation techniques or talk to someone you trust.",
      )
    }

    // Medication adherence
    const adherence = this.calculateMedicationAdherence(state)
    if (adherence < 80) {
      insights.push("Your medication adherence has been below 80%. Setting reminders might help.")
    }

    // Condition-specific insights
    state.conditions.forEach((condition) => {
      const conditionSymptoms = recentSymptoms.filter((s) => s.conditionId === condition.id)
      if (conditionSymptoms.length > 3) {
        insights.push(
          `Your ${condition.name} symptoms have been more frequent lately. Consider reviewing your management plan.`,
        )
      }
    })

    return insights
  }
}
