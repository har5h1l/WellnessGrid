import type { AppState, AppAction } from "./types"

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // User actions
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload, updatedAt: new Date().toISOString() } : null,
        lastSync: new Date().toISOString(),
      }

    case "CLEAR_USER":
      return {
        ...state,
        user: null,
        conditions: [],
        medications: [],
        goals: [],
        symptoms: [],
        moods: [],
        medicationLogs: [],
        nutrition: [],
        activities: [],
        healthMetrics: [],
        aiMessages: [],
        actionItems: [],
        alerts: [],
        setupCompleted: false,
      }

    // Condition actions
    case "ADD_CONDITION":
      return {
        ...state,
        conditions: [...state.conditions, action.payload],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_CONDITION":
      return {
        ...state,
        conditions: state.conditions.map((condition) =>
          condition.id === action.payload.id ? { ...condition, ...action.payload.updates } : condition,
        ),
        lastSync: new Date().toISOString(),
      }

    case "REMOVE_CONDITION":
      return {
        ...state,
        conditions: state.conditions.filter((condition) => condition.id !== action.payload),
        // Also remove related data
        symptoms: state.symptoms.filter((symptom) => symptom.conditionId !== action.payload),
        lastSync: new Date().toISOString(),
      }

    case "SET_CONDITIONS":
      return {
        ...state,
        conditions: action.payload,
        lastSync: new Date().toISOString(),
      }

    // Medication actions
    case "ADD_MEDICATION":
      return {
        ...state,
        medications: [...state.medications, action.payload],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_MEDICATION":
      return {
        ...state,
        medications: state.medications.map((medication) =>
          medication.id === action.payload.id ? { ...medication, ...action.payload.updates } : medication,
        ),
        lastSync: new Date().toISOString(),
      }

    case "REMOVE_MEDICATION":
      return {
        ...state,
        medications: state.medications.filter((medication) => medication.id !== action.payload),
        medicationLogs: state.medicationLogs.filter((log) => log.medicationId !== action.payload),
        lastSync: new Date().toISOString(),
      }

    case "SET_MEDICATIONS":
      return {
        ...state,
        medications: action.payload,
        lastSync: new Date().toISOString(),
      }

    // Goal actions
    case "ADD_GOAL":
      return {
        ...state,
        goals: [...state.goals, action.payload],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload.id ? { ...goal, ...action.payload.updates } : goal,
        ),
        lastSync: new Date().toISOString(),
      }

    case "COMPLETE_GOAL":
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === action.payload ? { ...goal, completed: true, progress: 100 } : goal,
        ),
        lastSync: new Date().toISOString(),
      }

    case "REMOVE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload),
        lastSync: new Date().toISOString(),
      }

    // Health tracking actions
    case "ADD_SYMPTOM":
      return {
        ...state,
        symptoms: [action.payload, ...state.symptoms],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_SYMPTOM":
      return {
        ...state,
        symptoms: state.symptoms.map((symptom) =>
          symptom.id === action.payload.id ? { ...symptom, ...action.payload.updates } : symptom,
        ),
        lastSync: new Date().toISOString(),
      }

    case "DELETE_SYMPTOM":
      return {
        ...state,
        symptoms: state.symptoms.filter((symptom) => symptom.id !== action.payload),
        lastSync: new Date().toISOString(),
      }

    case "ADD_MOOD":
      return {
        ...state,
        moods: [action.payload, ...state.moods],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_MOOD":
      return {
        ...state,
        moods: state.moods.map((mood) =>
          mood.id === action.payload.id ? { ...mood, ...action.payload.updates } : mood,
        ),
        lastSync: new Date().toISOString(),
      }

    case "DELETE_MOOD":
      return {
        ...state,
        moods: state.moods.filter((mood) => mood.id !== action.payload),
        lastSync: new Date().toISOString(),
      }

    case "ADD_MEDICATION_LOG":
      return {
        ...state,
        medicationLogs: [action.payload, ...state.medicationLogs],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_MEDICATION_LOG":
      return {
        ...state,
        medicationLogs: state.medicationLogs.map((log) =>
          log.id === action.payload.id ? { ...log, ...action.payload.updates } : log,
        ),
        lastSync: new Date().toISOString(),
      }

    case "ADD_NUTRITION":
      return {
        ...state,
        nutrition: [action.payload, ...state.nutrition],
        lastSync: new Date().toISOString(),
      }

    case "ADD_ACTIVITY":
      return {
        ...state,
        activities: [action.payload, ...state.activities],
        lastSync: new Date().toISOString(),
      }

    // AI and interaction actions
    case "ADD_AI_MESSAGE":
      return {
        ...state,
        aiMessages: [...state.aiMessages, action.payload],
        lastSync: new Date().toISOString(),
      }

    case "CLEAR_AI_MESSAGES":
      return {
        ...state,
        aiMessages: [],
        lastSync: new Date().toISOString(),
      }

    case "ADD_ACTION_ITEM":
      return {
        ...state,
        actionItems: [action.payload, ...state.actionItems],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_ACTION_ITEM":
      return {
        ...state,
        actionItems: state.actionItems.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload.updates } : item,
        ),
        lastSync: new Date().toISOString(),
      }

    case "COMPLETE_ACTION_ITEM":
      return {
        ...state,
        actionItems: state.actionItems.map((item) =>
          item.id === action.payload ? { ...item, completed: true } : item,
        ),
        lastSync: new Date().toISOString(),
      }

    case "REMOVE_ACTION_ITEM":
      return {
        ...state,
        actionItems: state.actionItems.filter((item) => item.id !== action.payload),
        lastSync: new Date().toISOString(),
      }

    case "ADD_ALERT":
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        lastSync: new Date().toISOString(),
      }

    case "MARK_ALERT_READ":
      return {
        ...state,
        alerts: state.alerts.map((alert) => (alert.id === action.payload ? { ...alert, read: true } : alert)),
        lastSync: new Date().toISOString(),
      }

    case "REMOVE_ALERT":
      return {
        ...state,
        alerts: state.alerts.filter((alert) => alert.id !== action.payload),
        lastSync: new Date().toISOString(),
      }

    // App state actions
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    case "SET_ONLINE_STATUS":
      return {
        ...state,
        isOnline: action.payload,
      }

    case "SET_CURRENT_VIEW":
      return {
        ...state,
        currentView: action.payload,
      }

    case "ADD_TO_NAVIGATION_HISTORY":
      return {
        ...state,
        navigationHistory: [...state.navigationHistory, action.payload].slice(-10), // Keep last 10 entries
      }

    case "SET_LAST_SYNC":
      return {
        ...state,
        lastSync: action.payload,
      }

    case "COMPLETE_SETUP":
      return {
        ...state,
        setupCompleted: true,
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_WELLNESS_SCORE":
      const today = new Date().toISOString().split("T")[0]
      const userId = state.user?.id || ""

      return {
        ...state,
        healthMetrics: state.healthMetrics.map((metric) =>
          metric.date === today && metric.userId === userId ? { ...metric, wellnessScore: action.payload } : metric,
        ),
        lastSync: new Date().toISOString(),
      }

    // Bulk operations
    case "SYNC_DATA":
      return {
        ...state,
        ...action.payload,
        lastSync: new Date().toISOString(),
      }

    case "RESET_APP_STATE":
      return {
        ...state,
        conditions: [],
        medications: [],
        goals: [],
        symptoms: [],
        moods: [],
        medicationLogs: [],
        nutrition: [],
        activities: [],
        healthMetrics: [],
        aiMessages: [],
        actionItems: [],
        alerts: [],
        setupCompleted: false,
        errors: {},
        lastSync: new Date().toISOString(),
      }

    // Error handling
    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.message,
        },
      }

    case "CLEAR_ERROR":
      const { [action.payload]: _, ...remainingErrors } = state.errors
      return {
        ...state,
        errors: remainingErrors,
      }

    case "CLEAR_ALL_ERRORS":
      return {
        ...state,
        errors: {},
      }

    default:
      return state
  }
}
