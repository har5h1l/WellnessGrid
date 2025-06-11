"use client"

import React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { AppState, AppAction } from "../types"
import { appReducer } from "./reducer"
import { initialState } from "./initial-state"
import { createActions } from "./actions"
import { StorageService } from "./storage"
import { ErrorBoundary } from "@/components/error-boundary"

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: ReturnType<typeof createActions>
  isReady: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [isReady, setIsReady] = React.useState(false)

  // Create actions with dispatch
  const actions = React.useMemo(() => createActions(dispatch), [])

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true })

        // Load saved data
        try {
          const savedData = await StorageService.loadAppState()
          if (savedData) {
            dispatch({ type: "SYNC_DATA", payload: savedData })
          }
        } catch (error) {
          console.warn("Failed to load saved data:", error)
          // Continue with default state
        }

        // Check online status
        const updateOnlineStatus = () => {
          dispatch({ type: "SET_ONLINE_STATUS", payload: navigator.onLine })
        }

        if (typeof window !== "undefined") {
          window.addEventListener("online", updateOnlineStatus)
          window.addEventListener("offline", updateOnlineStatus)
          updateOnlineStatus()
        }

        setIsReady(true)
      } catch (error) {
        console.error("App initialization error:", error)
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "initialization",
            message: "Failed to initialize app",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        })
        setIsReady(true) // Still set ready to allow app to function
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initializeApp()
  }, [])

  // Auto-save data when state changes
  useEffect(() => {
    if (isReady && state.user) {
      const saveData = async () => {
        try {
          await StorageService.saveAppState(state)
        } catch (error) {
          console.warn("Failed to save data:", error)
          dispatch({
            type: "SET_ERROR",
            payload: {
              key: "storage",
              message: "Failed to save data",
              details: error instanceof Error ? error.message : "Unknown error",
            },
          })
        }
      }

      const timeoutId = setTimeout(saveData, 1000) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [state, isReady])

  const contextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions,
      isReady,
    }),
    [state, actions, isReady],
  )

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    </ErrorBoundary>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Enhanced hooks with error handling
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

export function useHealthRecords() {
  const { state } = useApp()
  return state.healthRecords || []
}

export function useResources() {
  const { state } = useApp()
  return state.resources || []
}

export function useProtocols() {
  const { state } = useApp()
  return state.protocols || []
}

export function useErrors() {
  const { state } = useApp()
  return state.errors || []
}
