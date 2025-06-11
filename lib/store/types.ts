export interface UserProfile {
  id: string
  name: string
  age: string
  gender: string
  height: string
  weight: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface HealthCondition {
  id: string
  name: string
  icon: string
  description: string
  diagnosedDate: string
  severity: "mild" | "moderate" | "severe"
  notes?: string
  isActive: boolean
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  timeSlots: string[]
  adherence: number
  sideEffects?: string[]
  isActive: boolean
  prescribedDate: string
}

export interface HealthGoal {
  id: string
  title: string
  description: string
  targetValue?: number
  currentValue?: number
  unit?: string
  deadline?: string
  completed: boolean
  progress: number
  category: "medication" | "symptom" | "lifestyle" | "mental-health"
  createdAt: string
}

export interface SymptomEntry {
  id: string
  conditionId?: string
  type: string
  severity: number
  location?: string
  triggers?: string[]
  notes?: string
  date: string
  time: string
  userId: string
}

export interface MoodEntry {
  id: string
  mood: "very-sad" | "sad" | "neutral" | "happy" | "very-happy"
  energy: number
  stress: number
  notes?: string
  activities?: string[]
  date: string
  time: string
  userId: string
}

export interface MedicationLog {
  id: string
  medicationId: string
  taken: boolean
  actualTime?: string
  scheduledTime: string
  notes?: string
  sideEffects?: string[]
  date: string
  userId: string
}

export interface NutritionEntry {
  id: string
  meal: "breakfast" | "lunch" | "dinner" | "snack"
  foods: string[]
  calories?: number
  notes?: string
  date: string
  time: string
  userId: string
}

export interface ActivityEntry {
  id: string
  type: string
  duration: number
  intensity: "low" | "moderate" | "high"
  notes?: string
  date: string
  time: string
  userId: string
}

export interface AIMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: string
  userId: string
  suggestions?: string[]
  actionItems?: string[]
  relatedData?: {
    conditionId?: string
    symptomId?: string
    medicationId?: string
  }
}

export interface ActionItem {
  id: string
  type: "medication" | "symptom" | "mood" | "activity" | "appointment" | "reminder"
  title: string
  description: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  relatedId?: string
  userId: string
  createdAt: string
}

export interface HealthAlert {
  id: string
  type: "warning" | "info" | "success" | "error"
  title: string
  message: string
  date: string
  read: boolean
  actionRequired: boolean
  relatedData?: {
    conditionId?: string
    symptomId?: string
    medicationId?: string
  }
  userId: string
}

export interface AppPreferences {
  theme: "light" | "dark"
  notifications: {
    medication: boolean
    symptoms: boolean
    mood: boolean
    appointments: boolean
  }
  privacy: {
    shareData: boolean
    analytics: boolean
  }
  language: string
}

export interface HealthMetrics {
  date: string
  steps: number
  heartRate: number
  sleepHours: number
  caloriesBurned: number
  weight?: number
  bloodPressure?: {
    systolic: number
    diastolic: number
  }
  wellnessScore: number
  userId: string
}

export interface AppState {
  // User data
  user: UserProfile | null
  conditions: HealthCondition[]
  medications: Medication[]
  goals: HealthGoal[]
  preferences: AppPreferences

  // Health tracking data
  symptoms: SymptomEntry[]
  moods: MoodEntry[]
  medicationLogs: MedicationLog[]
  nutrition: NutritionEntry[]
  activities: ActivityEntry[]
  healthMetrics: HealthMetrics[]

  // App interaction data
  aiMessages: AIMessage[]
  actionItems: ActionItem[]
  alerts: HealthAlert[]

  // App state
  isLoading: boolean
  isOnline: boolean
  lastSync: string
  setupCompleted: boolean
  currentView: string

  // Error handling
  errors: {
    [key: string]: string
  }
}

export type AppAction =
  // User actions
  | { type: "SET_USER"; payload: UserProfile }
  | { type: "UPDATE_USER"; payload: Partial<UserProfile> }
  | { type: "CLEAR_USER" }

  // Condition actions
  | { type: "ADD_CONDITION"; payload: HealthCondition }
  | { type: "UPDATE_CONDITION"; payload: { id: string; updates: Partial<HealthCondition> } }
  | { type: "REMOVE_CONDITION"; payload: string }
  | { type: "SET_CONDITIONS"; payload: HealthCondition[] }

  // Medication actions
  | { type: "ADD_MEDICATION"; payload: Medication }
  | { type: "UPDATE_MEDICATION"; payload: { id: string; updates: Partial<Medication> } }
  | { type: "REMOVE_MEDICATION"; payload: string }
  | { type: "SET_MEDICATIONS"; payload: Medication[] }

  // Goal actions
  | { type: "ADD_GOAL"; payload: HealthGoal }
  | { type: "UPDATE_GOAL"; payload: { id: string; updates: Partial<HealthGoal> } }
  | { type: "COMPLETE_GOAL"; payload: string }
  | { type: "REMOVE_GOAL"; payload: string }

  // Health tracking actions
  | { type: "ADD_SYMPTOM"; payload: SymptomEntry }
  | { type: "UPDATE_SYMPTOM"; payload: { id: string; updates: Partial<SymptomEntry> } }
  | { type: "DELETE_SYMPTOM"; payload: string }
  | { type: "ADD_MOOD"; payload: MoodEntry }
  | { type: "UPDATE_MOOD"; payload: { id: string; updates: Partial<MoodEntry> } }
  | { type: "DELETE_MOOD"; payload: string }
  | { type: "ADD_MEDICATION_LOG"; payload: MedicationLog }
  | { type: "UPDATE_MEDICATION_LOG"; payload: { id: string; updates: Partial<MedicationLog> } }
  | { type: "ADD_NUTRITION"; payload: NutritionEntry }
  | { type: "ADD_ACTIVITY"; payload: ActivityEntry }

  // AI and interaction actions
  | { type: "ADD_AI_MESSAGE"; payload: AIMessage }
  | { type: "CLEAR_AI_MESSAGES" }
  | { type: "ADD_ACTION_ITEM"; payload: ActionItem }
  | { type: "UPDATE_ACTION_ITEM"; payload: { id: string; updates: Partial<ActionItem> } }
  | { type: "COMPLETE_ACTION_ITEM"; payload: string }
  | { type: "REMOVE_ACTION_ITEM"; payload: string }
  | { type: "ADD_ALERT"; payload: HealthAlert }
  | { type: "MARK_ALERT_READ"; payload: string }
  | { type: "REMOVE_ALERT"; payload: string }

  // App state actions
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "SET_CURRENT_VIEW"; payload: string }
  | { type: "COMPLETE_SETUP" }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<AppPreferences> }
  | { type: "UPDATE_WELLNESS_SCORE"; payload: number }

  // Bulk operations
  | { type: "SYNC_DATA"; payload: Partial<AppState> }
  | { type: "RESET_APP_STATE" }

  // Error handling
  | { type: "SET_ERROR"; payload: { key: string; message: string } }
  | { type: "CLEAR_ERROR"; payload: string }
  | { type: "CLEAR_ALL_ERRORS" }
