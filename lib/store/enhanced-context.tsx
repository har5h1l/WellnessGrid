"use client"

import React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { AppState, AppAction } from "../types"
import { appReducer } from "./reducer"
import { initialState } from "./initial-state"
import { createActions } from "./actions"
import { StorageService } from "./storage"
import { ErrorBoundary } from "@/components/error-boundary"
import { authHelpers, DatabaseService } from "@/lib/database"

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

        // Check Supabase authentication and load user data
        try {
          console.log("AppProvider: Checking authentication...")
          const user = await authHelpers.getCurrentUser()
          
          if (user) {
            console.log("AppProvider: User authenticated:", user.email)
            
            // Load user complete data from Supabase
            try {
              const userData = await DatabaseService.getUserCompleteData(user.id)
              console.log("AppProvider: User data loaded:", userData)
              
              if (userData.profile) {
                // Set user data in store
                dispatch({ 
                  type: "SET_USER", 
                  payload: {
                    id: userData.profile.id,
                    name: userData.profile.name,
                    email: user.email || "",
                    age: userData.profile.age,
                    gender: userData.profile.gender,
                    height: userData.profile.height,
                    weight: userData.profile.weight,
                    avatar: userData.profile.avatar,
                    wellnessScore: userData.profile.wellness_score || 0
                  }
                })
                
                // Set conditions
                if (userData.conditions && userData.conditions.length > 0) {
                  dispatch({
                    type: "SET_CONDITIONS",
                    payload: userData.conditions.map(condition => ({
                      id: condition.id,
                      name: condition.name,
                      category: condition.category || "Other",
                      severity: condition.severity || "mild",
                      isActive: condition.is_active !== false,
                      description: condition.description,
                      icon: condition.icon
                    }))
                  })
                }
                
                // Set medications if any
                if (userData.medications && userData.medications.length > 0) {
                  dispatch({
                    type: "SET_MEDICATIONS",
                    payload: userData.medications.map(med => ({
                      id: med.id,
                      name: med.name,
                      dosage: med.dosage || "",
                      frequency: med.frequency || "",
                      isActive: med.is_active !== false,
                      notes: med.notes
                    }))
                  })
                }
                
                                 // Mark setup as completed
                 dispatch({ type: "COMPLETE_SETUP" })
                 console.log("AppProvider: User data loaded into store successfully")
               } else {
                 console.log("AppProvider: No profile found - setup not completed")
                 // Don't dispatch anything - setupCompleted remains false by default
               }
             } catch (profileError) {
               console.log("AppProvider: Error loading profile:", profileError)
               // Don't dispatch anything - setupCompleted remains false by default
             }
           } else {
             console.log("AppProvider: No authenticated user")
             dispatch({ type: "SET_USER", payload: null })
             // Don't dispatch anything - setupCompleted remains false by default
           }
         } catch (authError) {
           console.log("AppProvider: Authentication error:", authError)
           dispatch({ type: "SET_USER", payload: null })
           // Don't dispatch anything - setupCompleted remains false by default
         }

        // Load saved local data (for offline functionality)
        try {
          const savedData = await StorageService.loadAppState()
          if (savedData && savedData.user) {
            // Only merge local data if we don't have user data from Supabase
            if (!state.user) {
              console.log("AppProvider: Loading saved local data")
            dispatch({ type: "SYNC_DATA", payload: savedData })
            }
          }
        } catch (error) {
          console.warn("AppProvider: Failed to load saved data:", error)
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
        console.error("AppProvider: App initialization error:", error)
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

  // Auto-save data when state changes (for offline functionality)
  useEffect(() => {
    if (isReady && state.user) {
      const saveData = async () => {
        try {
          await StorageService.saveAppState(state)
        } catch (error) {
          console.warn("AppProvider: Failed to save data:", error)
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
