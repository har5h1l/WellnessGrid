"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type {
  AppState,
  SymptomEntry,
  MoodEntry,
  MedicationLog,
  NutritionEntry,
  ActivityEntry,
  AIMessage,
  ActionItem,
  HealthAlert,
  User,
} from "./types"

// Initial state
const initialState: AppState = {
  user: {
    id: "user-1",
    name: "Alex",
    age: "16",
    gender: "prefer-not",
    height: "165",
    weight: "60",
    conditions: [
      {
        id: "condition-1",
        name: "Asthma",
        diagnosedDate: "2022-01-15",
        severity: "mild",
        notes: "Exercise-induced asthma",
      },
    ],
    medications: [
      {
        id: "med-1",
        name: "Albuterol",
        dosage: "2 puffs",
        frequency: "As needed",
        timeSlots: ["08:00", "20:00"],
        adherence: 85,
        sideEffects: ["Jitters", "Increased heart rate"],
      },
      {
        id: "med-2",
        name: "Advair",
        dosage: "1 puff",
        frequency: "Twice daily",
        timeSlots: ["08:00", "20:00"],
        adherence: 92,
      },
    ],
    tools: ["medication-tracker", "symptom-tracker", "mood-tracker"],
    wellnessScore: 75,
    goals: [
      {
        id: "goal-1",
        title: "Better medication adherence",
        description: "Take medications on time 95% of the time",
        targetValue: 95,
        currentValue: 85,
        unit: "%",
        deadline: "2024-12-31",
        completed: false,
        progress: 85,
      },
      {
        id: "goal-2",
        title: "Improved symptom tracking",
        description: "Log symptoms daily for better pattern recognition",
        targetValue: 30,
        currentValue: 18,
        unit: "days",
        completed: false,
        progress: 60,
      },
    ],
  },
  symptoms: [
    {
      id: "symptom-1",
      date: "2024-01-15",
      time: "14:30",
      type: "Shortness of breath",
      severity: 3,
      notes: "After climbing stairs",
      triggers: ["Physical activity"],
      location: "Chest",
    },
    {
      id: "symptom-2",
      date: "2024-01-14",
      time: "09:15",
      type: "Wheezing",
      severity: 2,
      notes: "Morning symptoms",
      triggers: ["Cold air"],
      location: "Chest",
    },
  ],
  moods: [
    {
      id: "mood-1",
      date: "2024-01-15",
      time: "18:00",
      mood: "happy",
      energy: 7,
      stress: 3,
      notes: "Good day overall",
      activities: ["School", "Friends", "Exercise"],
    },
    {
      id: "mood-2",
      date: "2024-01-14",
      time: "19:30",
      mood: "neutral",
      energy: 5,
      stress: 6,
      notes: "Tired from school",
      activities: ["School", "Homework"],
    },
  ],
  medications: [
    {
      id: "medlog-1",
      medicationId: "med-1",
      date: "2024-01-15",
      time: "08:00",
      taken: true,
      notes: "Taken with breakfast",
    },
    {
      id: "medlog-2",
      medicationId: "med-2",
      date: "2024-01-15",
      time: "08:05",
      taken: true,
    },
  ],
  nutrition: [
    {
      id: "nutrition-1",
      date: "2024-01-15",
      time: "08:00",
      meal: "breakfast",
      foods: ["Oatmeal", "Banana", "Orange juice"],
      calories: 350,
      notes: "Healthy start to the day",
    },
  ],
  activities: [
    {
      id: "activity-1",
      date: "2024-01-15",
      time: "16:00",
      type: "Walking",
      duration: 30,
      intensity: "moderate",
      notes: "Walk in the park",
    },
  ],
  healthMetrics: [
    {
      date: "2024-01-15",
      steps: 8500,
      heartRate: 72,
      sleepHours: 7.5,
      caloriesBurned: 2200,
      weight: 60,
    },
  ],
  aiMessages: [
    {
      id: "ai-1",
      type: "ai",
      content:
        "Hi Alex, how are you feeling today? Remember, you're doing great just by being here. What's on your mind?",
      timestamp: "10:30 AM",
      suggestions: ["Log symptoms", "Track mood", "Review medications"],
    },
  ],
  actionItems: [
    {
      id: "action-1",
      type: "medication",
      title: "Take evening Advair",
      description: "Don't forget your evening dose of Advair",
      completed: false,
      dueDate: "2024-01-15T20:00:00",
      priority: "high",
    },
    {
      id: "action-2",
      type: "activity",
      title: "Log today's symptoms",
      description: "Record any symptoms you experienced today",
      completed: false,
      priority: "medium",
    },
  ],
  alerts: [
    {
      id: "alert-1",
      type: "warning",
      title: "Sleep Pattern Detected",
      message: "You've been getting less sleep than usual. Consider adjusting your bedtime.",
      date: "2024-01-15",
      read: false,
      actionRequired: true,
    },
  ],
  isLoading: false,
  lastSync: new Date().toISOString(),
}

// Action types
type HealthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "ADD_SYMPTOM"; payload: SymptomEntry }
  | { type: "UPDATE_SYMPTOM"; payload: { id: string; updates: Partial<SymptomEntry> } }
  | { type: "DELETE_SYMPTOM"; payload: string }
  | { type: "ADD_MOOD"; payload: MoodEntry }
  | { type: "UPDATE_MOOD"; payload: { id: string; updates: Partial<MoodEntry> } }
  | { type: "DELETE_MOOD"; payload: string }
  | { type: "ADD_MEDICATION_LOG"; payload: MedicationLog }
  | { type: "UPDATE_MEDICATION_LOG"; payload: { id: string; updates: Partial<MedicationLog> } }
  | { type: "ADD_NUTRITION"; payload: NutritionEntry }
  | { type: "UPDATE_NUTRITION"; payload: { id: string; updates: Partial<NutritionEntry> } }
  | { type: "ADD_ACTIVITY"; payload: ActivityEntry }
  | { type: "UPDATE_ACTIVITY"; payload: { id: string; updates: Partial<ActivityEntry> } }
  | { type: "ADD_AI_MESSAGE"; payload: AIMessage }
  | { type: "ADD_ACTION_ITEM"; payload: ActionItem }
  | { type: "UPDATE_ACTION_ITEM"; payload: { id: string; updates: Partial<ActionItem> } }
  | { type: "COMPLETE_ACTION_ITEM"; payload: string }
  | { type: "ADD_ALERT"; payload: HealthAlert }
  | { type: "MARK_ALERT_READ"; payload: string }
  | { type: "UPDATE_WELLNESS_SCORE"; payload: number }
  | { type: "SYNC_DATA"; payload: Partial<AppState> }

// Reducer
function healthReducer(state: AppState, action: HealthAction): AppState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        lastSync: new Date().toISOString(),
      }

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
        medications: [action.payload, ...state.medications],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_MEDICATION_LOG":
      return {
        ...state,
        medications: state.medications.map((med) =>
          med.id === action.payload.id ? { ...med, ...action.payload.updates } : med,
        ),
        lastSync: new Date().toISOString(),
      }

    case "ADD_NUTRITION":
      return {
        ...state,
        nutrition: [action.payload, ...state.nutrition],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_NUTRITION":
      return {
        ...state,
        nutrition: state.nutrition.map((entry) =>
          entry.id === action.payload.id ? { ...entry, ...action.payload.updates } : entry,
        ),
        lastSync: new Date().toISOString(),
      }

    case "ADD_ACTIVITY":
      return {
        ...state,
        activities: [action.payload, ...state.activities],
        lastSync: new Date().toISOString(),
      }

    case "UPDATE_ACTIVITY":
      return {
        ...state,
        activities: state.activities.map((activity) =>
          activity.id === action.payload.id ? { ...activity, ...action.payload.updates } : activity,
        ),
        lastSync: new Date().toISOString(),
      }

    case "ADD_AI_MESSAGE":
      return {
        ...state,
        aiMessages: [...state.aiMessages, action.payload],
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

    case "UPDATE_WELLNESS_SCORE":
      return {
        ...state,
        user: { ...state.user, wellnessScore: action.payload },
        lastSync: new Date().toISOString(),
      }

    case "SYNC_DATA":
      return {
        ...state,
        ...action.payload,
        lastSync: new Date().toISOString(),
      }

    default:
      return state
  }
}

// Context
const HealthContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<HealthAction>
} | null>(null)

// Provider component
export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(healthReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("wellnessgrid-data")
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        dispatch({ type: "SYNC_DATA", payload: parsedData })
      } catch (error) {
        console.error("Failed to load saved data:", error)
      }
    }
  }, [])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("wellnessgrid-data", JSON.stringify(state))
  }, [state])

  return <HealthContext.Provider value={{ state, dispatch }}>{children}</HealthContext.Provider>
}

// Custom hook to use the health context
export function useHealth() {
  const context = useContext(HealthContext)
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider")
  }
  return context
}

// Helper functions for common operations
export const healthActions = {
  addSymptom: (symptom: Omit<SymptomEntry, "id">) => ({
    type: "ADD_SYMPTOM" as const,
    payload: { ...symptom, id: `symptom-${Date.now()}` },
  }),

  addMood: (mood: Omit<MoodEntry, "id">) => ({
    type: "ADD_MOOD" as const,
    payload: { ...mood, id: `mood-${Date.now()}` },
  }),

  addMedicationLog: (log: Omit<MedicationLog, "id">) => ({
    type: "ADD_MEDICATION_LOG" as const,
    payload: { ...log, id: `medlog-${Date.now()}` },
  }),

  addNutrition: (nutrition: Omit<NutritionEntry, "id">) => ({
    type: "ADD_NUTRITION" as const,
    payload: { ...nutrition, id: `nutrition-${Date.now()}` },
  }),

  addActivity: (activity: Omit<ActivityEntry, "id">) => ({
    type: "ADD_ACTIVITY" as const,
    payload: { ...activity, id: `activity-${Date.now()}` },
  }),

  addAIMessage: (message: Omit<AIMessage, "id">) => ({
    type: "ADD_AI_MESSAGE" as const,
    payload: { ...message, id: `ai-${Date.now()}` },
  }),

  addActionItem: (item: Omit<ActionItem, "id">) => ({
    type: "ADD_ACTION_ITEM" as const,
    payload: { ...item, id: `action-${Date.now()}` },
  }),

  addAlert: (alert: Omit<HealthAlert, "id">) => ({
    type: "ADD_ALERT" as const,
    payload: { ...alert, id: `alert-${Date.now()}` },
  }),
}
