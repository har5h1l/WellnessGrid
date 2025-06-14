import type { AppState } from "../types"

const STORAGE_KEY = "wellnessgrid-app-state"
const STORAGE_VERSION = "1.0.0"

export class StorageService {
  static async saveAppState(state: AppState): Promise<void> {
    try {
      const dataToSave = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        state: {
          user: state.user,
          conditions: state.conditions,
          medications: state.medications,
          goals: state.goals,
          preferences: state.preferences,
          symptoms: state.symptoms,
          moods: state.moods,
          medicationLogs: state.medicationLogs,
          nutrition: state.nutrition,
          activities: state.activities,
          healthMetrics: state.healthMetrics,
          aiMessages: state.aiMessages,
          actionItems: state.actionItems,
          alerts: state.alerts,
          setupCompleted: state.setupCompleted,
          lastSync: state.lastSync,
        },
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error("Failed to save app state:", error)
      throw new Error("Storage save failed")
    }
  }

  static async loadAppState(): Promise<Partial<AppState> | null> {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (!savedData) return null

      const parsedData = JSON.parse(savedData)

      // Version check
      if (parsedData.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, clearing data")
        this.clearAppState()
        return null
      }

      return parsedData.state
    } catch (error) {
      console.error("Failed to load app state:", error)
      this.clearAppState()
      return null
    }
  }

  static clearAppState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear app state:", error)
    }
  }

  static async exportData(): Promise<string> {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) throw new Error("No data to export")

    return savedData
  }

  static async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data)
      if (parsedData.version && parsedData.state) {
        localStorage.setItem(STORAGE_KEY, data)
      } else {
        throw new Error("Invalid data format")
      }
    } catch (error) {
      console.error("Failed to import data:", error)
      throw new Error("Import failed")
    }
  }
}
