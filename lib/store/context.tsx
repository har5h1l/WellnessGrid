"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { AppState, AppAction } from "./types"
import { appReducer } from "./reducer"
import { initialState } from "./initial-state"
import { StorageService } from "./storage"
import { WellnessCalculator } from "./wellness-calculator"

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: {
    // User actions
    setUser: (user: AppState["user"]) => void
    updateUser: (updates: Partial<AppState["user"]>) => void
    clearUser: () => void

    // Condition actions
    addCondition: (condition: Omit<AppState["conditions"][0], "id">) => void
    updateCondition: (id: string, updates: Partial<AppState["conditions"][0]>) => void
    removeCondition: (id: string) => void

    // Medication actions
    addMedication: (medication: Omit<AppState["medications"][0], "id">) => void
    updateMedication: (id: string, updates: Partial<AppState["medications"][0]>) => void
    removeMedication: (id: string) => void

    // Health tracking actions
    addSymptom: (symptom: Omit<AppState["symptoms"][0], "id" | "userId">) => void
    addMood: (mood: Omit<AppState["moods"][0], "id" | "userId">) => void
    addMedicationLog: (log: Omit<AppState["medicationLogs"][0], "id" | "userId">) => void

    // AI and interaction actions
    addAIMessage: (message: Omit<AppState["aiMessages"][0], "id" | "userId">) => void
    addActionItem: (item: Omit<AppState["actionItems"][0], "id" | "userId" | "createdAt">) => void
    completeActionItem: (id: string) => void

    // App state actions
    setLoading: (loading: boolean) => void
    setCurrentView: (view: string) => void
    completeSetup: () => void

    // Utility actions
    calculateWellnessScore: () => void
    syncData: () => Promise<void>
    resetApp: () => void
  }
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true })
        const savedData = await StorageService.loadAppState()
        if (savedData) {
          dispatch({ type: "SYNC_DATA", payload: savedData })
        }
      } catch (error) {
        console.error("Failed to load app data:", error)
        dispatch({
          type: "SET_ERROR",
          payload: { key: "storage", message: "Failed to load saved data" },
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    loadData()
  }, [])

  // Save data to storage whenever state changes
  useEffect(() => {
    if (state.user) {
      StorageService.saveAppState(state)
    }
  }, [state.user])

  // Calculate wellness score when relevant data changes
  useEffect(() => {
    if (state.user && (state.symptoms.length > 0 || state.moods.length > 0 || state.medicationLogs.length > 0)) {
      const score = WellnessCalculator.calculate(state)
      if (score !== getCurrentWellnessScore()) {
        dispatch({ type: "UPDATE_WELLNESS_SCORE", payload: score })
      }
    }
  }, [state.symptoms, state.moods, state.medicationLogs, state.user])

  const getCurrentWellnessScore = () => {
    const today = new Date().toISOString().split("T")[0]
    const todayMetrics = state.healthMetrics.find((m) => m.date === today && m.userId === state.user?.id)
    return todayMetrics?.wellnessScore || 75
  }

  // Action creators
  const actions = {
    // User actions
    setUser: useCallback((user: AppState["user"]) => {
      dispatch({ type: "SET_USER", payload: user })
    }, []),

    updateUser: useCallback((updates: Partial<AppState["user"]>) => {
      dispatch({ type: "UPDATE_USER", payload: updates })
    }, []),

    clearUser: useCallback(() => {
      dispatch({ type: "CLEAR_USER" })
    }, []),

    // Condition actions
    addCondition: useCallback((condition: Omit<AppState["conditions"][0], "id">) => {
      const newCondition = {
        ...condition,
        id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      dispatch({ type: "ADD_CONDITION", payload: newCondition })
    }, []),

    updateCondition: useCallback((id: string, updates: Partial<AppState["conditions"][0]>) => {
      dispatch({ type: "UPDATE_CONDITION", payload: { id, updates } })
    }, []),

    removeCondition: useCallback((id: string) => {
      dispatch({ type: "REMOVE_CONDITION", payload: id })
    }, []),

    // Medication actions
    addMedication: useCallback((medication: Omit<AppState["medications"][0], "id">) => {
      const newMedication = {
        ...medication,
        id: `medication-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      dispatch({ type: "ADD_MEDICATION", payload: newMedication })
    }, []),

    updateMedication: useCallback((id: string, updates: Partial<AppState["medications"][0]>) => {
      dispatch({ type: "UPDATE_MEDICATION", payload: { id, updates } })
    }, []),

    removeMedication: useCallback((id: string) => {
      dispatch({ type: "REMOVE_MEDICATION", payload: id })
    }, []),

    // Health tracking actions
    addSymptom: useCallback(
      (symptom: Omit<AppState["symptoms"][0], "id" | "userId">) => {
        if (!state.user) return

        const newSymptom = {
          ...symptom,
          id: `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: state.user.id,
        }
        dispatch({ type: "ADD_SYMPTOM", payload: newSymptom })
      },
      [state.user],
    ),

    addMood: useCallback(
      (mood: Omit<AppState["moods"][0], "id" | "userId">) => {
        if (!state.user) return

        const newMood = {
          ...mood,
          id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: state.user.id,
        }
        dispatch({ type: "ADD_MOOD", payload: newMood })
      },
      [state.user],
    ),

    addMedicationLog: useCallback(
      (log: Omit<AppState["medicationLogs"][0], "id" | "userId">) => {
        if (!state.user) return

        const newLog = {
          ...log,
          id: `medlog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: state.user.id,
        }
        dispatch({ type: "ADD_MEDICATION_LOG", payload: newLog })
      },
      [state.user],
    ),

    // AI and interaction actions
    addAIMessage: useCallback(
      (message: Omit<AppState["aiMessages"][0], "id" | "userId">) => {
        if (!state.user) return

        const newMessage = {
          ...message,
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: state.user.id,
        }
        dispatch({ type: "ADD_AI_MESSAGE", payload: newMessage })
      },
      [state.user],
    ),

    addActionItem: useCallback(
      (item: Omit<AppState["actionItems"][0], "id" | "userId" | "createdAt">) => {
        if (!state.user) return

        const newItem = {
          ...item,
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: state.user.id,
          createdAt: new Date().toISOString(),
        }
        dispatch({ type: "ADD_ACTION_ITEM", payload: newItem })
      },
      [state.user],
    ),

    completeActionItem: useCallback((id: string) => {
      dispatch({ type: "COMPLETE_ACTION_ITEM", payload: id })
    }, []),

    // App state actions
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: "SET_LOADING", payload: loading })
    }, []),

    setCurrentView: useCallback((view: string) => {
      dispatch({ type: "SET_CURRENT_VIEW", payload: view })
    }, []),

    completeSetup: useCallback(() => {
      dispatch({ type: "COMPLETE_SETUP" })
    }, []),

    // Utility actions
    calculateWellnessScore: useCallback(() => {
      const score = WellnessCalculator.calculate(state)
      dispatch({ type: "UPDATE_WELLNESS_SCORE", payload: score })
    }, [state]),

    syncData: useCallback(async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true })
        await StorageService.saveAppState(state)
        dispatch({ type: "CLEAR_ERROR", payload: "sync" })
      } catch (error) {
        console.error("Failed to sync data:", error)
        dispatch({
          type: "SET_ERROR",
          payload: { key: "sync", message: "Failed to sync data" },
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }, [state]),

    resetApp: useCallback(() => {
      StorageService.clearAppState()
      dispatch({ type: "RESET_APP_STATE" })
    }, []),
  }

  return <AppContext.Provider value={{ state, dispatch, actions }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Convenience hooks for specific data
export function useUser() {
  const { state } = useApp()
  return state.user
}

export function useConditions() {
  const { state } = useApp()
  return state.conditions.filter((c) => c.isActive)
}

export function useMedications() {
  const { state } = useApp()
  return state.medications.filter((m) => m.isActive)
}

export function useSymptoms(conditionId?: string) {
  const { state } = useApp()
  return conditionId ? state.symptoms.filter((s) => s.conditionId === conditionId) : state.symptoms
}

export function useMoods(days?: number) {
  const { state } = useApp()
  if (!days) return state.moods

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  const cutoffString = cutoffDate.toISOString().split("T")[0]

  return state.moods.filter((m) => m.date >= cutoffString)
}

export function useActionItems(completed?: boolean) {
  const { state } = useApp()
  return completed !== undefined ? state.actionItems.filter((item) => item.completed === completed) : state.actionItems
}

export function useAlerts(read?: boolean) {
  const { state } = useApp()
  return read !== undefined ? state.alerts.filter((alert) => alert.read === read) : state.alerts
}
