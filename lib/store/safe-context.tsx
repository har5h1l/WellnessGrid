"use client"

import React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"

// Simple safe types
interface AppUser {
  id: string
  name: string
  email: string
  age?: string
  gender?: string
  height?: string
  weight?: string
  avatar?: string
  wellnessScore?: number
}

interface AppCondition {
  id: string
  name: string
  category: string
  severity: string
  isActive: boolean
  description?: string
  icon?: string
}

interface AppMedication {
  id: string
  name: string
  dosage: string
  frequency: string
  isActive: boolean
  notes?: string
}

interface SafeAppState {
  user: AppUser | null
  conditions: AppCondition[]
  medications: AppMedication[]
  isLoading: boolean
  isOnline: boolean
  setupCompleted: boolean
  errors: Array<{ key: string; message: string; details?: string }>
}

type SafeAppAction = 
  | { type: "SET_USER"; payload: AppUser | null }
  | { type: "SET_CONDITIONS"; payload: AppCondition[] }
  | { type: "SET_MEDICATIONS"; payload: AppMedication[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "COMPLETE_SETUP" }
  | { type: "SET_ERROR"; payload: { key: string; message: string; details?: string } }
  | { type: "CLEAR_ERROR"; payload: string }

// Safe reducer
const safeReducer = (state: SafeAppState, action: SafeAppAction): SafeAppState => {
  try {
    switch (action.type) {
      case "SET_USER":
        return { ...state, user: action.payload }
      case "SET_CONDITIONS":
        return { ...state, conditions: action.payload }
      case "SET_MEDICATIONS":
        return { ...state, medications: action.payload }
      case "SET_LOADING":
        return { ...state, isLoading: action.payload }
      case "SET_ONLINE_STATUS":
        return { ...state, isOnline: action.payload }
      case "COMPLETE_SETUP":
        return { ...state, setupCompleted: true }
      case "SET_ERROR":
        return { 
          ...state, 
          errors: [...state.errors.filter(e => e.key !== action.payload.key), action.payload] 
        }
      case "CLEAR_ERROR":
        return { 
          ...state, 
          errors: state.errors.filter(e => e.key !== action.payload) 
        }
      default:
        return state
    }
  } catch (error) {
    console.error('Reducer error:', error)
    return state
  }
}

// Initial state
const initialState: SafeAppState = {
  user: null,
  conditions: [],
  medications: [],
  isLoading: false,
  isOnline: true,
  setupCompleted: false,
  errors: []
}

interface SafeAppContextType {
  state: SafeAppState
  dispatch: React.Dispatch<SafeAppAction>
  actions: ReturnType<typeof createActions>
  isReady: boolean
}

const SafeAppContext = createContext<SafeAppContextType | null>(null)

export function SafeAppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(safeReducer, initialState)
  const [isReady, setIsReady] = React.useState(false)
  
  // Create actions for backwards compatibility
  const actions = React.useMemo(() => createActions(dispatch), [dispatch])

  // Safe initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("SafeAppProvider: Starting initialization...")
        dispatch({ type: "SET_LOADING", payload: true })

        // Check online status safely
        if (typeof window !== "undefined") {
          const updateOnlineStatus = () => {
            try {
              dispatch({ type: "SET_ONLINE_STATUS", payload: navigator.onLine })
            } catch (error) {
              console.warn("Failed to check online status:", error)
            }
          }

          window.addEventListener("online", updateOnlineStatus)
          window.addEventListener("offline", updateOnlineStatus)
          updateOnlineStatus()
        }

        // Try to load user authentication safely
        try {
          console.log("SafeAppProvider: Attempting to load authentication...")
          
          // Dynamic import with error handling
          const authModule = await import('@/lib/database').catch(error => {
            console.warn("Failed to import database module:", error)
            return null
          })
          
          if (authModule?.authHelpers?.getCurrentUser) {
            try {
              const user = await authModule.authHelpers.getCurrentUser()
              
              if (user) {
                console.log("SafeAppProvider: User authenticated:", user.email)
                
                // Set basic user data
                dispatch({ 
                  type: "SET_USER", 
                  payload: {
                    id: user.id,
                    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    email: user.email || "",
                  }
                })
                
                dispatch({ type: "COMPLETE_SETUP" })
                console.log("SafeAppProvider: Setup completed")
              } else {
                console.log("SafeAppProvider: No authenticated user")
                dispatch({ type: "SET_USER", payload: null })
              }
            } catch (authError) {
              console.warn("SafeAppProvider: Authentication check failed:", authError)
              dispatch({ type: "SET_USER", payload: null })
            }
          } else {
            console.warn("SafeAppProvider: Auth helpers not available")
            dispatch({ type: "SET_USER", payload: null })
          }
        } catch (importError) {
          console.warn("SafeAppProvider: Failed to load auth services:", importError)
          dispatch({ type: "SET_USER", payload: null })
        }

        setIsReady(true)
        console.log("SafeAppProvider: Initialization complete")
        
      } catch (error) {
        console.error("SafeAppProvider: Critical initialization error:", error)
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

  const contextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions,
      isReady,
    }),
    [state, dispatch, actions, isReady],
  )

  return (
    <SafeAppContext.Provider value={contextValue}>
      {children}
    </SafeAppContext.Provider>
  )
}

export function useSafeApp() {
  const context = useContext(SafeAppContext)
  if (!context) {
    throw new Error("useSafeApp must be used within a SafeAppProvider")
  }
  return context
}

// Safe hooks
export function useSafeUser() {
  const { state } = useSafeApp()
  return state.user
}

export function useSafeErrors() {
  const { state } = useSafeApp()
  return state.errors || []
}

// Additional safe hooks
export function useConditions() {
  const { state } = useSafeApp()
  return state.conditions.filter((c) => c.isActive)
}

export function useMedications() {
  const { state } = useSafeApp()
  return state.medications.filter((m) => m.isActive)
}

export function useHealthRecords() {
  const { state } = useSafeApp()
  return [] // Mock empty array
}

export function useResources() {
  const { state } = useSafeApp()
  return [] // Mock empty array
}

export function useProtocols() {
  const { state } = useSafeApp()
  return [] // Mock empty array
}

// Backwards compatibility exports - these maintain the old API but use safe implementation
export const useApp = useSafeApp
export const useUser = useSafeUser

// Mock action creators for backwards compatibility
export const createActions = (dispatch: React.Dispatch<SafeAppAction>) => ({
  navigate: (path: string) => {
    console.log('Navigation to:', path)
    // Mock navigation - doesn't do anything but prevents errors
  },
  setUser: (user: AppUser | null) => dispatch({ type: "SET_USER", payload: user }),
  setConditions: (conditions: AppCondition[]) => dispatch({ type: "SET_CONDITIONS", payload: conditions }),
  setMedications: (medications: AppMedication[]) => dispatch({ type: "SET_MEDICATIONS", payload: medications }),
  setLoading: (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }),
  completeSetup: () => dispatch({ type: "COMPLETE_SETUP" }),
  setError: (error: { key: string; message: string; details?: string }) => 
    dispatch({ type: "SET_ERROR", payload: error }),
  clearError: (key: string) => dispatch({ type: "CLEAR_ERROR", payload: key }),
})
