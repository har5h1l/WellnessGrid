// Comprehensive type definitions for the entire application
export interface User {
  id: string
  name: string
  age: string
  gender: string
  height: string
  weight: string
  email?: string
  avatar?: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
  emergencyContacts: EmergencyContact[]
}

export interface UserPreferences {
  theme: "light" | "dark"
  notifications: {
    medication: boolean
    symptoms: boolean
    mood: boolean
    appointments: boolean
    reminders: boolean
  }
  privacy: {
    shareData: boolean
    analytics: boolean
    dataRetention: number // days
  }
  language: string
  timezone: string
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
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
  protocols: Protocol[]
  medications: string[] // medication IDs
  triggers: string[]
  symptoms: string[]
}

export interface Protocol {
  id: string
  name: string
  description: string
  steps: ProtocolStep[]
  conditionId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProtocolStep {
  id: string
  title: string
  description: string
  order: number
  isRequired: boolean
  estimatedDuration?: number // minutes
  resources?: Resource[]
}

export interface Resource {
  id: string
  title: string
  type: "article" | "video" | "pdf" | "link" | "image"
  url?: string
  content?: string
  description?: string
  tags: string[]
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedReadTime?: number // minutes
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
  prescribedBy?: string
  instructions?: string
  refillReminder?: boolean
  stockCount?: number
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
  category: "medication" | "symptom" | "lifestyle" | "mental-health" | "education"
  milestones: Milestone[]
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  completed: boolean
  completedAt?: string
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
  duration?: number // minutes
  intensity?: "mild" | "moderate" | "severe"
  photos?: string[] // photo URLs
}

export interface MoodEntry {
  id: string
  mood: "very-sad" | "sad" | "neutral" | "happy" | "very-happy"
  energy: number
  stress: number
  anxiety?: number
  notes?: string
  activities?: string[]
  date: string
  time: string
  userId: string
  sleepQuality?: number
  socialInteraction?: number
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
  location?: string
  skippedReason?: string
}

export interface HealthRecord {
  id: string
  type: "ehr" | "genetic" | "lab" | "imaging" | "visit"
  title: string
  description?: string
  date: string
  provider?: string
  fileUrl?: string
  data?: Record<string, any>
  tags: string[]
  userId: string
  isVerified: boolean
  uploadedAt: string
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
    resourceId?: string
  }
  sentiment?: "positive" | "neutral" | "negative"
  confidence?: number
}

export interface ActionItem {
  id: string
  type: "medication" | "symptom" | "mood" | "activity" | "appointment" | "reminder" | "education"
  title: string
  description: string
  completed: boolean
  dueDate?: string
  priority: "low" | "medium" | "high"
  relatedId?: string
  userId: string
  createdAt: string
  completedAt?: string
  recurringPattern?: RecurringPattern
}

export interface RecurringPattern {
  type: "daily" | "weekly" | "monthly"
  interval: number
  daysOfWeek?: number[] // 0-6, Sunday = 0
  endDate?: string
}

export interface HealthAlert {
  id: string
  type: "warning" | "info" | "success" | "error" | "critical"
  title: string
  message: string
  date: string
  read: boolean
  actionRequired: boolean
  relatedData?: {
    conditionId?: string
    symptomId?: string
    medicationId?: string
    goalId?: string
  }
  userId: string
  expiresAt?: string
  actions?: AlertAction[]
}

export interface AlertAction {
  id: string
  label: string
  action: "navigate" | "call" | "email" | "dismiss"
  target?: string
  isPrimary: boolean
}

export interface AppState {
  // User data
  user: User | null
  conditions: HealthCondition[]
  medications: Medication[]
  goals: HealthGoal[]
  healthRecords: HealthRecord[]
  protocols: Protocol[]
  resources: Resource[]

  // Health tracking data
  symptoms: SymptomEntry[]
  moods: MoodEntry[]
  medicationLogs: MedicationLog[]
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
  navigationHistory: string[]

  // Error handling
  errors: AppError[]

  // Cache and performance
  cache: {
    [key: string]: {
      data: any
      timestamp: string
      expiresAt: string
    }
  }
}

export interface AppError {
  id: string
  type: "network" | "validation" | "storage" | "permission" | "unknown"
  message: string
  details?: string
  timestamp: string
  resolved: boolean
  userId?: string
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
  dataSource?: "manual" | "device" | "estimated"
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Navigation types
export interface NavigationItem {
  href: string
  label: string
  icon: any
  badge?: number
  disabled?: boolean
}

// Form types
export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "checkbox" | "radio" | "date" | "time"
  required: boolean
  validation?: ValidationRule[]
  options?: { value: string; label: string }[]
  placeholder?: string
  helpText?: string
}

export interface ValidationRule {
  type: "required" | "email" | "min" | "max" | "pattern"
  value?: any
  message: string
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}
