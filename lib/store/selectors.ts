import type { AppState } from "./types"

export class AppSelectors {
  // User selectors
  static getUser(state: AppState) {
    return state.user
  }

  static isSetupCompleted(state: AppState) {
    return state.setupCompleted && state.user !== null
  }

  // Condition selectors
  static getActiveConditions(state: AppState) {
    return state.conditions.filter((c) => c.isActive)
  }

  static getConditionById(state: AppState, id: string) {
    return state.conditions.find((c) => c.id === id)
  }

  static getConditionsByName(state: AppState, name: string) {
    return state.conditions.filter((c) => c.name.toLowerCase().includes(name.toLowerCase()) && c.isActive)
  }

  // Medication selectors
  static getActiveMedications(state: AppState) {
    return state.medications.filter((m) => m.isActive)
  }

  static getMedicationById(state: AppState, id: string) {
    return state.medications.find((m) => m.id === id)
  }

  static getMedicationsForCondition(state: AppState, conditionName: string) {
    return state.medications.filter((m) => m.isActive && m.name.toLowerCase().includes(conditionName.toLowerCase()))
  }

  // Health tracking selectors
  static getTodaySymptoms(state: AppState) {
    const today = new Date().toISOString().split("T")[0]
    return state.symptoms.filter((s) => s.date === today && s.userId === state.user?.id)
  }

  static getRecentSymptoms(state: AppState, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffString = cutoffDate.toISOString().split("T")[0]

    return state.symptoms.filter((s) => s.date >= cutoffString && s.userId === state.user?.id)
  }

  static getSymptomsByCondition(state: AppState, conditionId: string) {
    return state.symptoms.filter((s) => s.conditionId === conditionId && s.userId === state.user?.id)
  }

  static getTodayMoods(state: AppState) {
    const today = new Date().toISOString().split("T")[0]
    return state.moods.filter((m) => m.date === today && m.userId === state.user?.id)
  }

  static getRecentMoods(state: AppState, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffString = cutoffDate.toISOString().split("T")[0]

    return state.moods.filter((m) => m.date >= cutoffString && m.userId === state.user?.id)
  }

  static getTodayMedicationLogs(state: AppState) {
    const today = new Date().toISOString().split("T")[0]
    return state.medicationLogs.filter((l) => l.date === today && l.userId === state.user?.id)
  }

  static getMedicationLogsForMedication(state: AppState, medicationId: string, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffString = cutoffDate.toISOString().split("T")[0]

    return state.medicationLogs.filter(
      (l) => l.medicationId === medicationId && l.date >= cutoffString && l.userId === state.user?.id,
    )
  }

  // Goal selectors
  static getActiveGoals(state: AppState) {
    return state.goals.filter((g) => !g.completed)
  }

  static getCompletedGoals(state: AppState) {
    return state.goals.filter((g) => g.completed)
  }

  static getGoalsByCategory(state: AppState, category: AppState["goals"][0]["category"]) {
    return state.goals.filter((g) => g.category === category)
  }

  // Action item selectors
  static getPendingActionItems(state: AppState) {
    return state.actionItems.filter((item) => !item.completed && item.userId === state.user?.id)
  }

  static getOverdueActionItems(state: AppState) {
    const now = new Date().toISOString()
    return state.actionItems.filter(
      (item) => !item.completed && item.dueDate && item.dueDate < now && item.userId === state.user?.id,
    )
  }

  static getActionItemsByType(state: AppState, type: AppState["actionItems"][0]["type"]) {
    return state.actionItems.filter((item) => item.type === type && item.userId === state.user?.id)
  }

  // Alert selectors
  static getUnreadAlerts(state: AppState) {
    return state.alerts.filter((alert) => !alert.read && alert.userId === state.user?.id)
  }

  static getAlertsByType(state: AppState, type: AppState["alerts"][0]["type"]) {
    return state.alerts.filter((alert) => alert.type === type && alert.userId === state.user?.id)
  }

  // Health metrics selectors
  static getCurrentWellnessScore(state: AppState) {
    const today = new Date().toISOString().split("T")[0]
    const todayMetrics = state.healthMetrics.find((m) => m.date === today && m.userId === state.user?.id)
    return todayMetrics?.wellnessScore || 75
  }

  static getRecentHealthMetrics(state: AppState, days = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffString = cutoffDate.toISOString().split("T")[0]

    return state.healthMetrics.filter((m) => m.date >= cutoffString && m.userId === state.user?.id)
  }

  // AI message selectors
  static getRecentAIMessages(state: AppState, limit = 50) {
    return state.aiMessages.filter((m) => m.userId === state.user?.id).slice(-limit)
  }

  static getAIMessagesByDate(state: AppState, date: string) {
    return state.aiMessages.filter((m) => m.timestamp.startsWith(date) && m.userId === state.user?.id)
  }

  // Statistics selectors
  static getSymptomStats(state: AppState, days = 30) {
    const recentSymptoms = this.getRecentSymptoms(state, days)

    const byType = recentSymptoms.reduce(
      (acc, symptom) => {
        if (!acc[symptom.type]) {
          acc[symptom.type] = { count: 0, totalSeverity: 0 }
        }
        acc[symptom.type].count++
        acc[symptom.type].totalSeverity += symptom.severity
        return acc
      },
      {} as Record<string, { count: number; totalSeverity: number }>,
    )

    return Object.entries(byType)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        avgSeverity: stats.totalSeverity / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
  }

  static getMedicationAdherenceStats(state: AppState, days = 7) {
    const activeMedications = this.getActiveMedications(state)

    return activeMedications.map((medication) => {
      const logs = this.getMedicationLogsForMedication(state, medication.id, days)
      const expectedDoses = days * medication.timeSlots.length
      const actualDoses = logs.filter((log) => log.taken).length

      return {
        medication: medication.name,
        adherence: expectedDoses > 0 ? (actualDoses / expectedDoses) * 100 : 0,
        expected: expectedDoses,
        actual: actualDoses,
      }
    })
  }

  // Error selectors
  static hasErrors(state: AppState) {
    return Object.keys(state.errors).length > 0
  }

  static getErrorByKey(state: AppState, key: string) {
    return state.errors[key]
  }

  static getAllErrors(state: AppState) {
    return state.errors
  }
}
