import type { AppState } from "../types"

export const initialState: AppState = {
  // User data
  user: null,
  conditions: [],
  medications: [],
  goals: [],
  preferences: {
    theme: "light",
    notifications: {
      medication: true,
      symptoms: true,
      mood: true,
      appointments: true,
    },
    privacy: {
      shareData: false,
      analytics: true,
    },
    language: "en",
  },

  // Health tracking data
  symptoms: [],
  moods: [],
  medicationLogs: [],
  nutrition: [],
  activities: [],
  healthMetrics: [],

  // App interaction data
  aiMessages: [],
  actionItems: [],
  alerts: [],

  // App state
  isLoading: false,
  isOnline: true,
  lastSync: new Date().toISOString(),
  setupCompleted: false,
  currentView: "dashboard",
  navigationHistory: [],

  // Error handling
  errors: {},
}
