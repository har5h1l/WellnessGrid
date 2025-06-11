import type { AppState } from "./types"

export interface WellnessRule {
  id: string
  condition: string
  triggers: {
    symptoms?: string[]
    moods?: string[]
    severity?: number
    frequency?: number
  }
  recommendation: {
    title: string
    description: string
    action: string
    priority: "low" | "medium" | "high"
    icon: string
  }
}

export const WELLNESS_RULES: WellnessRule[] = [
  // Asthma-specific rules
  {
    id: "asthma-breathing",
    condition: "asthma",
    triggers: {
      symptoms: ["shortness of breath", "wheezing", "chest tightness"],
      severity: 6,
    },
    recommendation: {
      title: "Take a breathing break",
      description: "Your breathing symptoms seem elevated. Try some deep breathing exercises.",
      action: "Practice 4-7-8 breathing technique",
      priority: "high",
      icon: "🫁",
    },
  },
  {
    id: "asthma-inhaler",
    condition: "asthma",
    triggers: {
      symptoms: ["wheezing", "coughing"],
      frequency: 2,
    },
    recommendation: {
      title: "Check your inhaler",
      description: "You've logged breathing symptoms twice today. Make sure your rescue inhaler is nearby.",
      action: "Verify inhaler location",
      priority: "medium",
      icon: "💨",
    },
  },
  // Diabetes-specific rules
  {
    id: "diabetes-glucose",
    condition: "type 1 diabetes",
    triggers: {
      symptoms: ["fatigue", "thirst", "frequent urination"],
      severity: 5,
    },
    recommendation: {
      title: "Check blood sugar",
      description: "Your symptoms might indicate blood sugar changes. Consider checking your levels.",
      action: "Test glucose levels",
      priority: "high",
      icon: "🩸",
    },
  },
  {
    id: "diabetes-hydration",
    condition: "type 1 diabetes",
    triggers: {
      symptoms: ["thirst", "dry mouth"],
    },
    recommendation: {
      title: "Stay hydrated",
      description: "Increased thirst can be a sign of high blood sugar. Drink water and monitor.",
      action: "Drink 16oz of water",
      priority: "medium",
      icon: "💧",
    },
  },
  // General wellness rules
  {
    id: "mood-low",
    condition: "general",
    triggers: {
      moods: ["sad", "very-sad"],
      frequency: 2,
    },
    recommendation: {
      title: "Mood support",
      description: "You've been feeling down lately. Consider talking to someone or doing a favorite activity.",
      action: "Call a friend or family member",
      priority: "medium",
      icon: "💙",
    },
  },
  {
    id: "stress-high",
    condition: "general",
    triggers: {
      symptoms: ["headache", "tension"],
      moods: ["sad", "neutral"],
    },
    recommendation: {
      title: "Stress relief",
      description: "High stress levels detected. Take some time to relax and unwind.",
      action: "Try 10 minutes of meditation",
      priority: "medium",
      icon: "🧘",
    },
  },
  {
    id: "energy-low",
    condition: "general",
    triggers: {
      symptoms: ["fatigue", "tiredness"],
      severity: 7,
    },
    recommendation: {
      title: "Rest and recharge",
      description: "You're feeling quite tired. Consider getting some rest or light movement.",
      action: "Take a 20-minute power nap",
      priority: "medium",
      icon: "😴",
    },
  },
]

export class WellnessRuleEngine {
  static generateRecommendations(state: AppState): WellnessRule["recommendation"][] {
    if (!state.user) return []

    const userConditions = state.conditions.filter((c) => c.isActive).map((c) => c.name.toLowerCase())
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get recent symptoms and moods
    const recentSymptoms = state.symptoms.filter(
      (s) => (s.date === today || s.date === yesterday) && s.userId === state.user?.id,
    )
    const recentMoods = state.moods.filter(
      (m) => (m.date === today || m.date === yesterday) && m.userId === state.user?.id,
    )

    const recommendations: WellnessRule["recommendation"][] = []

    // Check each rule
    for (const rule of WELLNESS_RULES) {
      // Skip if rule doesn't apply to user's conditions (unless it's general)
      if (rule.condition !== "general" && !userConditions.some((c) => c.includes(rule.condition))) {
        continue
      }

      let triggered = false

      // Check symptom triggers
      if (rule.triggers.symptoms) {
        const matchingSymptoms = recentSymptoms.filter((symptom) =>
          rule.triggers.symptoms!.some((trigger) => symptom.type.toLowerCase().includes(trigger)),
        )

        if (matchingSymptoms.length > 0) {
          // Check severity threshold
          if (rule.triggers.severity) {
            const highSeveritySymptoms = matchingSymptoms.filter((s) => s.severity >= rule.triggers.severity!)
            if (highSeveritySymptoms.length > 0) triggered = true
          }

          // Check frequency threshold
          if (rule.triggers.frequency) {
            if (matchingSymptoms.length >= rule.triggers.frequency) triggered = true
          }

          // If no specific thresholds, any matching symptom triggers
          if (!rule.triggers.severity && !rule.triggers.frequency) triggered = true
        }
      }

      // Check mood triggers
      if (rule.triggers.moods && !triggered) {
        const matchingMoods = recentMoods.filter((mood) => rule.triggers.moods!.includes(mood.mood))

        if (matchingMoods.length > 0) {
          if (rule.triggers.frequency) {
            if (matchingMoods.length >= rule.triggers.frequency) triggered = true
          } else {
            triggered = true
          }
        }
      }

      if (triggered) {
        recommendations.push(rule.recommendation)
      }
    }

    // Sort by priority and return top 3
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]).slice(0, 3)
  }

  static calculateWellnessScore(state: AppState): number {
    if (!state.user) return 75

    const today = new Date().toISOString().split("T")[0]
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // Get recent data
    const recentSymptoms = state.symptoms.filter((s) => s.date >= lastWeek && s.userId === state.user?.id)
    const recentMoods = state.moods.filter((m) => m.date >= lastWeek && m.userId === state.user?.id)
    const recentMedLogs = state.medicationLogs.filter((l) => l.date >= lastWeek && l.userId === state.user?.id)

    let score = 100

    // Symptom impact (0-40 point deduction)
    const avgSymptomSeverity =
      recentSymptoms.length > 0 ? recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length : 0
    const symptomFrequency = recentSymptoms.length
    score -= Math.min(40, avgSymptomSeverity * 2 + symptomFrequency * 1.5)

    // Mood impact (0-30 point deduction)
    const moodValues = { "very-sad": 1, sad: 2, neutral: 3, happy: 4, "very-happy": 5 }
    const avgMood =
      recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + moodValues[m.mood], 0) / recentMoods.length : 3
    score -= Math.max(0, (3 - avgMood) * 10)

    // Medication adherence impact (0-20 point deduction)
    const activeMeds = state.medications.filter((m) => m.isActive)
    if (activeMeds.length > 0) {
      const expectedDoses = activeMeds.reduce((sum, med) => sum + med.timeSlots.length * 7, 0)
      const actualDoses = recentMedLogs.filter((log) => log.taken).length
      const adherence = expectedDoses > 0 ? actualDoses / expectedDoses : 1
      score -= (1 - adherence) * 20
    }

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  static getWellnessColor(score: number): string {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  static getWellnessColorBg(score: number): string {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }
}
