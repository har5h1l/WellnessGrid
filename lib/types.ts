export interface User {
  id: string
  name: string
  age: string
  gender: string
  height: string
  weight: string
  conditions: Condition[]
  medications: Medication[]
  tools: string[]
  wellnessScore: number
  goals: Goal[]
  avatar?: string
}

export interface Condition {
  id: string
  name: string
  diagnosedDate: string
  severity: "mild" | "moderate" | "severe"
  notes?: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  timeSlots: string[]
  adherence: number
  sideEffects?: string[]
}

export interface Goal {
  id: string
  title: string
  description: string
  targetValue?: number
  currentValue?: number
  unit?: string
  deadline?: string
  completed: boolean
  progress: number
}

export interface SymptomEntry {
  id: string
  date: string
  time: string
  type: string
  severity: number
  notes?: string
  triggers?: string[]
  location?: string
}

export interface MoodEntry {
  id: string
  date: string
  time: string
  mood: "very-sad" | "sad" | "neutral" | "happy" | "very-happy"
  energy: number
  stress: number
  notes?: string
  activities?: string[]
}

export interface MedicationLog {
  id: string
  medicationId: string
  date: string
  time: string
  taken: boolean
  notes?: string
  sideEffects?: string[]
}

export interface NutritionEntry {
  id: string
  date: string
  time: string
  meal: "breakfast" | "lunch" | "dinner" | "snack"
  foods: string[]
  calories?: number
  notes?: string
}

export interface ActivityEntry {
  id: string
  date: string
  time: string
  type: string
  duration: number
  intensity: "low" | "moderate" | "high"
  notes?: string
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
}

export interface AIMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: string
  suggestions?: string[]
  actionItems?: ActionItem[]
}

export interface ActionItem {
  id: string
  type: "symptom" | "medication" | "mood" | "activity" | "appointment"
  title: string
  description: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
}

export interface HealthAlert {
  id: string
  type: "warning" | "info" | "success" | "error"
  title: string
  message: string
  date: string
  read: boolean
  actionRequired: boolean
}

export interface AppState {
  user: User
  symptoms: SymptomEntry[]
  moods: MoodEntry[]
  medications: MedicationLog[]
  nutrition: NutritionEntry[]
  activities: ActivityEntry[]
  healthMetrics: HealthMetrics[]
  aiMessages: AIMessage[]
  actionItems: ActionItem[]
  alerts: HealthAlert[]
  isLoading: boolean
  lastSync: string
}
