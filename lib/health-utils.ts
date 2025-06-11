import type { SymptomEntry, MoodEntry, MedicationLog, User } from "./types"

export function calculateWellnessScore(
  symptoms: SymptomEntry[],
  moods: MoodEntry[],
  medications: MedicationLog[],
  user: User,
): number {
  const today = new Date().toISOString().split("T")[0]
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Recent symptoms (lower score for more/severe symptoms)
  const recentSymptoms = symptoms.filter((s) => s.date >= lastWeek)
  const symptomScore = Math.max(
    0,
    100 - recentSymptoms.length * 5 - recentSymptoms.reduce((sum, s) => sum + s.severity, 0) * 2,
  )

  // Recent moods (higher score for better moods)
  const recentMoods = moods.filter((m) => m.date >= lastWeek)
  const avgMoodScore =
    recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => {
          const moodValue = { "very-sad": 1, sad: 2, neutral: 3, happy: 4, "very-happy": 5 }[m.mood]
          return sum + moodValue
        }, 0) / recentMoods.length
      : 3
  const moodScore = (avgMoodScore / 5) * 100

  // Medication adherence
  const adherenceScore =
    user.medications.reduce((sum, med) => sum + med.adherence, 0) / Math.max(user.medications.length, 1)

  // Weighted average
  return Math.round(symptomScore * 0.4 + moodScore * 0.3 + adherenceScore * 0.3)
}

export function getSymptomTrends(symptoms: SymptomEntry[], days = 30) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const relevantSymptoms = symptoms.filter((s) => {
    const symptomDate = new Date(s.date)
    return symptomDate >= startDate && symptomDate <= endDate
  })

  const dailyAverages: { date: string; severity: number }[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]
    const daySymptoms = relevantSymptoms.filter((s) => s.date === dateStr)

    const avgSeverity =
      daySymptoms.length > 0 ? daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length : 0

    dailyAverages.push({ date: dateStr, severity: avgSeverity })
  }

  return dailyAverages
}

export function getMoodTrends(moods: MoodEntry[], days = 30) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const relevantMoods = moods.filter((m) => {
    const moodDate = new Date(m.date)
    return moodDate >= startDate && moodDate <= endDate
  })

  const moodValues = { "very-sad": 1, sad: 2, neutral: 3, happy: 4, "very-happy": 5 }

  return relevantMoods.map((m) => ({
    date: m.date,
    mood: moodValues[m.mood],
    energy: m.energy,
    stress: m.stress,
  }))
}

export function getMedicationAdherence(medications: MedicationLog[], user: User, days = 7) {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const adherenceData = user.medications.map((med) => {
    const expectedDoses = days * med.timeSlots.length
    const actualDoses = medications.filter(
      (log) => log.medicationId === med.id && log.taken && new Date(log.date) >= startDate,
    ).length

    return {
      medication: med.name,
      adherence: expectedDoses > 0 ? (actualDoses / expectedDoses) * 100 : 0,
      expected: expectedDoses,
      actual: actualDoses,
    }
  })

  return adherenceData
}

export function generateHealthInsights(
  symptoms: SymptomEntry[],
  moods: MoodEntry[],
  medications: MedicationLog[],
  user: User,
): string[] {
  const insights: string[] = []

  // Symptom patterns
  const recentSymptoms = symptoms.filter((s) => {
    const date = new Date(s.date)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return date >= weekAgo
  })

  if (recentSymptoms.length > 5) {
    insights.push(
      "You've logged more symptoms than usual this week. Consider discussing this with your healthcare provider.",
    )
  }

  // Mood patterns
  const recentMoods = moods.filter((m) => {
    const date = new Date(m.date)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return date >= weekAgo
  })

  const avgStress = recentMoods.reduce((sum, m) => sum + m.stress, 0) / Math.max(recentMoods.length, 1)
  if (avgStress > 7) {
    insights.push(
      "Your stress levels have been higher than usual. Try some relaxation techniques or talk to someone you trust.",
    )
  }

  // Medication adherence
  const adherence = getMedicationAdherence(medications, user, 7)
  const lowAdherence = adherence.filter((a) => a.adherence < 80)
  if (lowAdherence.length > 0) {
    insights.push(`Your adherence for ${lowAdherence[0].medication} has been below 80%. Setting reminders might help.`)
  }

  return insights
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  if (hour < 21) return "evening"
  return "night"
}

export function generatePersonalizedGreeting(name: string): string {
  const timeOfDay = getTimeOfDay()
  const greetings = {
    morning: [`Good morning, ${name}!`, `Rise and shine, ${name}!`, `Morning, ${name}!`],
    afternoon: [`Good afternoon, ${name}!`, `Hey there, ${name}!`, `Afternoon, ${name}!`],
    evening: [`Good evening, ${name}!`, `Evening, ${name}!`, `Hey ${name}!`],
    night: [`Good evening, ${name}!`, `Hey ${name}!`, `Evening, ${name}!`],
  }

  const options = greetings[timeOfDay]
  return options[Math.floor(Math.random() * options.length)]
}
