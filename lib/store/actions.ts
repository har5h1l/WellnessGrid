import type React from "react"
import type { AppState, AppAction } from "../types"

// Action creators with proper error handling and validation
export const createActions = (dispatch: React.Dispatch<AppAction>) => ({
  // User actions
  setUser: (user: AppState["user"]) => {
    try {
      dispatch({ type: "SET_USER", payload: user })
      dispatch({ type: "CLEAR_ERROR", payload: "user" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "user",
          message: "Failed to set user data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  updateUser: (updates: Partial<AppState["user"]>) => {
    try {
      dispatch({ type: "UPDATE_USER", payload: updates })
      dispatch({ type: "CLEAR_ERROR", payload: "user" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "user",
          message: "Failed to update user data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  // Navigation actions
  navigate: (path: string) => {
    try {
      dispatch({ type: "SET_CURRENT_VIEW", payload: path })
      dispatch({ type: "ADD_TO_NAVIGATION_HISTORY", payload: path })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "navigation",
          message: "Navigation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  // Health data actions with validation
  addSymptom: (symptom: Omit<AppState["symptoms"][0], "id" | "userId">) => {
    try {
      // Validate symptom data
      if (!symptom.type || symptom.severity < 0 || symptom.severity > 10) {
        throw new Error("Invalid symptom data")
      }

      const newSymptom = {
        ...symptom,
        id: `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: "current-user", // This would come from auth context
      }

      dispatch({ type: "ADD_SYMPTOM", payload: newSymptom })
      dispatch({ type: "CLEAR_ERROR", payload: "symptoms" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "symptoms",
          message: "Failed to add symptom",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  addMood: (mood: Omit<AppState["moods"][0], "id" | "userId">) => {
    try {
      // Validate mood data
      if (!mood.mood || mood.energy < 1 || mood.energy > 10 || mood.stress < 1 || mood.stress > 10) {
        throw new Error("Invalid mood data")
      }

      const newMood = {
        ...mood,
        id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: "current-user",
      }

      dispatch({ type: "ADD_MOOD", payload: newMood })
      dispatch({ type: "CLEAR_ERROR", payload: "moods" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "moods",
          message: "Failed to add mood entry",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  // AI Message actions
  addAIMessage: (message: Omit<AppState["aiMessages"][0], "id" | "userId">) => {
    try {
      // Validate message data
      if (!message.content || !message.type || !message.timestamp) {
        throw new Error("Invalid AI message data")
      }

      const newMessage = {
        ...message,
        id: `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: "current-user", // This would come from auth context
      }

      dispatch({ type: "ADD_AI_MESSAGE", payload: newMessage })
      dispatch({ type: "CLEAR_ERROR", payload: "ai-messages" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "ai-messages",
          message: "Failed to add AI message",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  },

  // Error handling actions
  clearError: (key: string) => {
    dispatch({ type: "CLEAR_ERROR", payload: key })
  },

  clearAllErrors: () => {
    dispatch({ type: "CLEAR_ALL_ERRORS" })
  },

  // Loading state actions
  setLoading: (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading })
  },

  // Sync actions
  syncData: async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() })
      dispatch({ type: "CLEAR_ERROR", payload: "sync" })
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          key: "sync",
          message: "Failed to sync data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  },
})
