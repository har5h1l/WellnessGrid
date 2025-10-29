"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WellnessCircle } from "@/components/wellness-circle"
import { GlitchText } from "@/components/glitch-text"
import { AppLogo } from "@/components/app-logo"
import { MoodTracker } from "@/components/mood-tracker"
import { SymptomTracker } from "@/components/symptom-tracker"
import { MedicationLogger } from "@/components/medication-logger"
import { Activity, Heart, Pill, MessageCircle, TrendingUp, Clock, Bell, AlertTriangle, Target, ChevronRight, Star, Zap, TrendingDown, Moon, Dumbbell } from "lucide-react"
import Link from "next/link"
import type { UserProfile, HealthCondition, UserTool, TrackingEntry } from "@/lib/database"
// Dashboard uses API endpoints, not direct service imports

// Safe dynamic import for services
let authHelpers: any = null
let DatabaseService: any = null

const initializeServices = async () => {
  try {
    const { authHelpers: auth, DatabaseService: db } = await import('@/lib/database')
    authHelpers = auth
    DatabaseService = db
    return true
  } catch (error) {
    console.error('Failed to initialize services:', error)
    return false
  }
}
import { toolPresets } from "@/lib/data/mock-sources"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conditions, setConditions] = useState<HealthCondition[]>([])
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [recentEntries, setRecentEntries] = useState<TrackingEntry[]>([])
  const [dashboardData, setDashboardData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [showMedicationLogger, setShowMedicationLogger] = useState(false)
  const [currentGreeting, setCurrentGreeting] = useState("")

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        console.log('Dashboard: Loading user data...')
        
        // Initialize services first
        const servicesReady = await initializeServices()
        if (!servicesReady) {
          console.error('Dashboard: Failed to initialize services')
          toast.error('System unavailable. Please refresh the page.')
          return
        }
        
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          console.log('Dashboard: No authenticated user, redirecting to login')
          router.push('/login')
          return
        }
        console.log('Dashboard: User authenticated:', user.email)
        setCurrentUser(user)

        const userData = await DatabaseService.getUserCompleteData(user.id)
        console.log('Dashboard: User data retrieved:', userData)
        
        if (!userData.profile) {
          console.log('Dashboard: No profile found, redirecting to setup')
          router.push('/setup')
          return
        }

        console.log('Dashboard: Setting user data')
        setUserProfile(userData.profile)
        setConditions(userData.conditions)
        setUserTools(userData.tools.filter(t => t.is_enabled))
        
        // Load recent tracking entries (optional - may fail if table doesn't exist)
        try {
          const entries = await DatabaseService.getRecentTrackingEntries(user.id, 7) // Load 7 days instead of 3
          setRecentEntries(entries)
          console.log('Dashboard: Tracking entries loaded:', entries.length)
          console.log('Dashboard: Tracking entries details:', entries.map(e => ({
            tool_id: e.tool_id,
            timestamp: e.timestamp,
            date: new Date(e.timestamp).toDateString()
          })))
        } catch (trackingError) {
          console.log('Dashboard: Tracking entries not available (table may not exist yet):', trackingError.message)
          setRecentEntries([])
        }

        // Load integrated dashboard data
        try {
          setAnalyticsLoading(true)
          console.log('🔍 Dashboard: Starting analytics data fetch...')
          const forceRefresh = searchParams.get("forceRefresh") === "true"
          if (forceRefresh) {
            console.log('🔄 Dashboard: Force refresh requested')
          }
          
          // Fetch data from the unified API endpoint with retry logic
          let response, result
          let retries = 0
          const maxRetries = 3
          
          while (retries < maxRetries) {
            try {
              response = await fetch(`/api/analytics/?userId=${user.id}&timeRange=30d&includeInsights=true${forceRefresh ? '&forceRefresh=true' : ''}`)
              result = await response.json()
              
              if (result.success || retries === maxRetries - 1) {
                break
              }
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
              retries++
            } catch (error) {
              console.log(`Dashboard: Analytics fetch attempt ${retries + 1} failed:`, error)
              if (retries === maxRetries - 1) {
                result = { success: false, error: 'Failed to fetch analytics data' }
                break
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
              retries++
            }
          }
          
          if (result.success && result.data) {
            console.log('🔍 Dashboard: Raw API response:', result.data)
            console.log('🔍 Dashboard: Health score from API:', result.data.health_score)
            
            // Map the API response to dashboard data structure
            const mappedData = {
              ...result.data,
              wellnessScore: {
                overall_score: result.data.health_score?.overall_score || 0,
                calculated_at: result.data.health_score?.calculated_at,
                trend: result.data.health_score?.trend || 'stable'
              },
              recentAlerts: result.data.alerts || [],
              healthInsights: result.data.insights || []
            }
            
            console.log('🔍 Dashboard: Mapped wellnessScore:', mappedData.wellnessScore)
            console.log('🔍 Dashboard: Final mapped data:', mappedData)
            
            setDashboardData(mappedData)
            console.log('Dashboard: Analytics data loaded')
            console.log('Dashboard: Wellness score:', result.data.health_score?.overall_score)
            console.log('Dashboard: Wellness score timestamp:', result.data.health_score?.calculated_at)
            console.log('Dashboard: Force refresh requested:', forceRefresh)
          } else {
            // Suppress error logging for demo - just show empty state
            console.log('Dashboard: Analytics data not available, showing empty state')
            setDashboardData(null)
          }
        } catch (integrationError) {
          console.log('Dashboard: Failed to load integrated data:', integrationError)
          setDashboardData(null)
        } finally {
          setAnalyticsLoading(false)
        }
        
        console.log('Dashboard: User data set successfully')
      } catch (error) {
        console.error('Dashboard: Error loading user data:', error)
        toast.error('Failed to load dashboard data')
        router.push('/setup')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Separate effect to reload dashboard data when searchParams change (for force refresh)
  // Removed problematic useEffect that was causing infinite reload loop
  // Force refresh is now handled by the handleForceRefresh function only

  const handleForceRefresh = () => {
    console.log('🔄 Manual force refresh requested')
    const timestamp = Date.now()
    window.location.href = `/dashboard?forceRefresh=true&t=${timestamp}`
  }

  // Handle URL parameters for quick actions
  useEffect(() => {
    const action = searchParams.get("action")
    if (action && !loading) {
      switch (action) {
        case "symptom":
          setShowSymptomTracker(true)
          break
        case "mood":
          setShowMoodTracker(true)
          break
        case "medication":
          setShowMedicationLogger(true)
          break
      }
    }
  }, [searchParams, loading])

  useEffect(() => {
    if (userProfile) {
      const hour = new Date().getHours()
      const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
      const conditionContext = conditions.length > 0 ? `, let's check on your health` : ", ready to track your health?"
      setCurrentGreeting(`${timeGreeting}, ${userProfile.name}${conditionContext}`)
    }
  }, [userProfile, conditions])

  // Listen for real-time refresh events
  useEffect(() => {
    const handleDataRefresh = async (event: CustomEvent) => {
      console.log('🔄 Dashboard: Received refresh event:', event.detail)
      
      if (currentUser) {
        console.log('🔄 Dashboard: Refreshing analytics data...')
        
        // Force refresh analytics
        const timestamp = Date.now()
        window.location.href = `/dashboard?forceRefresh=true&t=${timestamp}`
      }
    }

    // Listen for custom refresh events
    window.addEventListener('analyticsRefreshed', handleDataRefresh as EventListener)
    window.addEventListener('dashboardRefreshed', handleDataRefresh as EventListener)
    window.addEventListener('dataRefreshed', handleDataRefresh as EventListener)

    return () => {
      window.removeEventListener('analyticsRefreshed', handleDataRefresh as EventListener)
      window.removeEventListener('dashboardRefreshed', handleDataRefresh as EventListener)
      window.removeEventListener('dataRefreshed', handleDataRefresh as EventListener)
    }
  }, [currentUser])

  // Generate recommended actions based on user's tools and usage patterns
  const getRecommendedActions = () => {
    const actions = []
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Check which tools haven't been used today
    userTools.forEach(userTool => {
      const toolPreset = toolPresets.find(tp => tp.id === userTool.tool_id)
      if (!toolPreset) return

      const todayEntries = recentEntries.filter(entry => 
        entry.tool_id === userTool.tool_id && 
        entry.timestamp.startsWith(today)
      )

      // If no entries today, recommend using the tool
      if (todayEntries.length === 0) {
        const reminderTimes = userTool.settings?.reminderTimes || toolPreset.defaultSettings.reminderTimes || []
        const nextReminder = reminderTimes.find(time => {
          const [hours, minutes] = time.split(':').map(Number)
          const reminderTime = new Date()
          reminderTime.setHours(hours, minutes, 0, 0)
          return reminderTime > now
        })

        actions.push({
          id: `use-${userTool.tool_id}`,
          type: 'tool_usage',
          title: `Track ${toolPreset.name}`,
          description: nextReminder 
            ? `Next reminder at ${nextReminder}`
            : 'No tracking recorded today',
          priority: 'high',
          toolId: userTool.tool_id,
          toolName: toolPreset.name,
          action: 'track'
        })
      }
    })

    // If no tools are enabled, recommend setting up tools
    if (userTools.length === 0) {
      actions.push({
        id: 'setup-tools',
        type: 'tool_setup',
        title: 'Set Up Tracking Tools',
        description: 'Add health tracking tools to monitor your conditions',
        priority: 'high',
        toolId: null,
        toolName: 'Tools Setup',
        action: 'setup'
      })
    }

    // Check for overdue medications (example for medication tools)
    const medicationTools = userTools.filter(tool => 
      toolPresets.find(tp => tp.id === tool.tool_id)?.type === 'medication_reminder'
    )
    
    medicationTools.forEach(tool => {
      const toolPreset = toolPresets.find(tp => tp.id === tool.tool_id)
      if (!toolPreset) return

      const reminderTimes = tool.settings?.reminderTimes || toolPreset.defaultSettings.reminderTimes || []
      const overdueReminders = reminderTimes.filter(time => {
        const [hours, minutes] = time.split(':').map(Number)
        const reminderTime = new Date()
        reminderTime.setHours(hours, minutes, 0, 0)
        
        // Check if reminder time has passed and no entry recorded
        if (reminderTime < now) {
          const todayEntries = recentEntries.filter(entry => 
            entry.tool_id === tool.tool_id && 
            entry.timestamp.startsWith(today) &&
            new Date(entry.timestamp).getTime() > reminderTime.getTime()
          )
          return todayEntries.length === 0
        }
        return false
      })

      if (overdueReminders.length > 0) {
        actions.push({
          id: `overdue-${tool.tool_id}`,
          type: 'overdue_medication',
          title: `Medication Reminder`,
          description: `${overdueReminders.length} missed reminder(s) for ${toolPreset.name}`,
          priority: 'urgent',
          toolId: tool.tool_id,
          toolName: toolPreset.name,
          action: 'track'
        })
      }
    })

    // Add insights based on recent tracking patterns
    if (recentEntries.length >= 3) {
      const moodEntries = recentEntries.filter(entry => {
        const tool = toolPresets.find(tp => tp.id === entry.tool_id)
        return tool?.type === 'mood_tracker'
      })

      if (moodEntries.length >= 2) {
        const avgMood = moodEntries.reduce((sum, entry) => {
          return sum + (entry.data.mood || 5)
        }, 0) / moodEntries.length

        if (avgMood < 4) {
          actions.push({
            id: 'low-mood-pattern',
            type: 'insight',
            title: 'Mood Pattern Detected',
            description: 'Your recent mood scores are lower than usual. Consider talking to someone.',
            priority: 'medium',
            toolId: null,
            toolName: 'Mood Insight',
            action: 'chat'
          })
        }
      }
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 4)
  }

  const recommendedActions = getRecommendedActions()

  // Enhanced tool mapping with better preset matching
  const getRecommendedTools = () => {
    console.log('🔍 Building recommended tools for user tools:', userTools.length)
    
    if (userTools.length === 0) {
      console.log('🔍 No user tools enabled')
      return []
    }
    
    return userTools.slice(0, 4).map(userTool => {
      // Enhanced tool name mapping - more comprehensive approach
      const toolName = (userTool.tool_name || '').toLowerCase()
      const toolId = (userTool.tool_id || '').toLowerCase()
      
      console.log('🔍 Processing tool:', { id: userTool.tool_id, name: userTool.tool_name })
      
      // Smart preset matching based on both name and ID
      let matchedPreset = null
      
      // First try direct ID match
      matchedPreset = toolPresets.find(tp => tp.id === userTool.tool_id)
      
      // If no direct match, try intelligent name-based matching
      if (!matchedPreset) {
        if (toolName.includes('mood') || toolName.includes('depression') || toolName.includes('mental')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'mood-tracker')
        } else if (toolName.includes('glucose') || toolName.includes('blood sugar') || toolName.includes('blood glucose')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'glucose-tracker')
        } else if (toolName.includes('blood pressure') || toolName.includes('bp monitor') || toolName.includes('pressure monitor')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'blood-pressure-tracker')
        } else if (toolName.includes('sleep') || toolName.includes('rest')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'sleep-tracker')
        } else if (toolName.includes('exercise') || toolName.includes('physical') || toolName.includes('activity') || toolName.includes('workout')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'physical-activity-tracker')
        } else if (toolName.includes('medication') || toolName.includes('pill') || toolName.includes('medicine')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'medication-reminder')
        } else if (toolName.includes('symptom') || toolName.includes('pain')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'symptom-tracker')
        } else if (toolName.includes('nutrition') || toolName.includes('food') || toolName.includes('diet')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'nutrition-tracker')
        } else if (toolName.includes('hydration') || toolName.includes('water')) {
          matchedPreset = toolPresets.find(tp => tp.id === 'hydration-tracker')
        }
      }
      
      console.log('🔍 Tool matching result:', {
        userTool: userTool.tool_name,
        matchedPreset: matchedPreset?.name || 'None',
        presetId: matchedPreset?.id || 'None'
      })
      
      // Get appropriate icon based on tool type
      const getToolIcon = () => {
        if (toolName.includes('mood') || toolName.includes('depression')) return <Heart className="w-5 h-5 text-white" />
        if (toolName.includes('glucose') || toolName.includes('blood')) return <Activity className="w-5 h-5 text-white" />
        if (toolName.includes('sleep')) return <Moon className="w-5 h-5 text-white" />
        if (toolName.includes('exercise') || toolName.includes('activity')) return <Dumbbell className="w-5 h-5 text-white" />
        if (toolName.includes('medication') || toolName.includes('pill')) return <Pill className="w-5 h-5 text-white" />
        if (toolName.includes('symptom') || toolName.includes('pain')) return <AlertTriangle className="w-5 h-5 text-white" />
        return <Target className="w-5 h-5 text-white" />
      }
      
      // Get appropriate color based on tool type
      const getToolBgColor = () => {
        if (toolName.includes('mood') || toolName.includes('depression')) return 'bg-gradient-to-r from-pink-500 to-red-500'
        if (toolName.includes('glucose') || toolName.includes('blood glucose')) return 'bg-gradient-to-r from-red-500 to-pink-500'
        if (toolName.includes('blood pressure')) return 'bg-gradient-to-r from-blue-500 to-cyan-500'
        if (toolName.includes('sleep')) return 'bg-gradient-to-r from-indigo-500 to-purple-500'
        if (toolName.includes('exercise') || toolName.includes('activity')) return 'bg-gradient-to-r from-green-500 to-teal-500'
        if (toolName.includes('medication') || toolName.includes('pill')) return 'bg-gradient-to-r from-purple-500 to-indigo-500'
        if (toolName.includes('symptom') || toolName.includes('pain')) return 'bg-gradient-to-r from-orange-500 to-red-500'
        return 'bg-gradient-to-r from-blue-500 to-teal-500'
      }
      
      // Generate description based on recent usage
      const getDescription = () => {
        const today = new Date().toISOString().split('T')[0]
        const todayEntries = recentEntries.filter(entry => 
          entry.tool_id === userTool.tool_id && 
          entry.timestamp.startsWith(today)
        )
        
        if (todayEntries.length > 0) {
          return 'Tracked today'
        }
        
        const lastEntry = recentEntries
          .filter(entry => entry.tool_id === userTool.tool_id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        
        if (lastEntry) {
          const daysAgo = Math.floor((Date.now() - new Date(lastEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24))
          return daysAgo === 0 ? 'Tracked today' : `Last tracked ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
        }
        
        return 'Ready to track'
      }
      
      return {
        id: userTool.tool_id,
        toolId: userTool.tool_id,
        name: matchedPreset?.name || userTool.tool_name || 'Health Tracker',
        description: getDescription(),
        frequency: 'Daily',
        icon: getToolIcon(),
        bgColor: getToolBgColor(),
        priority: 1
      }
    }).filter(Boolean)
  }

  // Test function to debug the recommended tools logic
  const debugRecommendedTools = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    console.log('🔍 DEBUG: Date comparison test:', {
      now: now.toISOString(),
      today: today,
      userToolsCount: userTools.length,
      recentEntriesCount: recentEntries.length
    })
    
    userTools.forEach(userTool => {
      const toolPreset = toolPresets.find(tp => tp.id === userTool.tool_id)
      if (!toolPreset) return
      
      const todayEntries = recentEntries.filter(entry => 
        entry.tool_id === userTool.tool_id && 
        entry.timestamp.startsWith(today)
      )
      
      console.log('🔍 DEBUG: Tool analysis:', {
        toolId: userTool.tool_id,
        toolName: toolPreset.name,
        todayEntries: todayEntries.length,
        allEntriesForTool: recentEntries.filter(e => e.tool_id === userTool.tool_id).length,
        todayEntriesDetails: todayEntries.map(e => ({
          timestamp: e.timestamp,
          date: new Date(e.timestamp).toDateString()
        }))
      })
    })
  }

  // Call debug function on component mount
  useEffect(() => {
    if (!loading && userTools.length > 0) {
      debugRecommendedTools()
    }
  }, [loading, userTools, recentEntries])

  // Show loading state - wait for both user data and analytics
  if (loading || analyticsLoading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <AppLogo size="lg" className="mb-4" />
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">
            {loading ? "Loading your dashboard..." : "Loading health insights..."}
          </p>
        </div>
      </div>
    )
  }

  // Show setup prompt if user not found (shouldn't happen due to useEffect redirects)
  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessGrid</h2>
          <p className="text-gray-600 mb-8">Your personal health companion for managing chronic conditions</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Use integrated dashboard data (no hardcoded fallbacks for consistency)
  const todayStats = dashboardData?.todayStats || { symptomsLogged: 0, moodEntries: 0, medicationsTaken: 0, trackingEntries: 0 }
  const unreadAlerts = dashboardData?.recentAlerts || []
  const wellnessScore = dashboardData?.wellnessScore?.overall_score || 0
  const healthInsights = dashboardData?.healthInsights || []
  const trackingStreaks = dashboardData?.trackingStreaks || []

  // Debug log for wellness score consistency
  console.log('🏠 Dashboard wellness score:', wellnessScore, 'from dashboardData:', dashboardData?.wellnessScore)
  console.log('🏠 Dashboard data object keys:', dashboardData ? Object.keys(dashboardData) : 'null')
  console.log('🏠 Dashboard health_score:', dashboardData?.health_score)
  console.log('🏠 Current timestamp:', new Date().toISOString())

  // Placeholder for errors
  const errors = []
  const hasErrors = false

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <div className="flex items-center space-x-3">
          <AppLogo variant="icon" size="sm" />
          <h1 className="text-xl font-bold text-gray-900">WellnessGrid</h1>
        </div>
        <div className="relative">
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <Bell className="w-5 h-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">


        {/* Dynamic Header Message */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            <GlitchText text={currentGreeting} />
          </h2>
        </div>

        {/* Wellness Circle */}
        <div className="flex justify-center">
          <div className="text-center">
            <WellnessCircle key={`wellness-${wellnessScore}-${dashboardData?.wellnessScore?.calculated_at}`} score={wellnessScore} />
            <p className="text-sm text-gray-600 mt-2">
              {wellnessScore >= 80
                ? "You're doing great! 🌟"
                : wellnessScore >= 60
                  ? "Keep up the good work! 💪"
                  : "Let's work on feeling better 💙"}
            </p>
            {/* Debug info - remove in production */}
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {dashboardData?.health_score?.calculated_at ? new Date(dashboardData.health_score.calculated_at).toLocaleTimeString() : 'Unknown'}
            </p>
          </div>
        </div>

        {/* Basic Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="wellness-card">
            <CardContent className="p-3 text-center">
              <Activity className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayStats.symptomsLogged}</div>
              <div className="text-xs text-gray-600">symptoms today</div>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-3 text-center">
              <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayStats.moodEntries}</div>
              <div className="text-xs text-gray-600">mood entries</div>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-3 text-center">
              <Pill className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayStats.medicationsTaken}</div>
              <div className="text-xs text-gray-600">meds taken</div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Tools Section - Based on your conditions and tracking patterns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recommended Tools</h3>
            <Badge variant="outline" className="text-xs">
              {userTools.length > 0 ? 'Track today' : 'Get started'}
            </Badge>
          </div>

          <div className="space-y-2">
            {(() => {
              const recommendedTools = getRecommendedTools()
              console.log('🔍 UI rendering recommended tools:', {
                count: recommendedTools.length,
                tools: recommendedTools.map(t => t.name)
              })
              
              if (recommendedTools.length > 0) {
                return recommendedTools.map((tool, index) => (
                  <Card key={`${tool.id}-${index}`} className="wellness-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.bgColor}`}>
                            {tool.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{tool.name}</h4>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                            <p className="text-xs text-blue-600 mt-1">{tool.frequency}</p>
                          </div>
                        </div>
                        <Link href={`/track/${tool.toolId}`}>
                          <Button size="sm" className="wellness-button-primary min-w-[80px]">
                            Track
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              } else if (userTools.length === 0) {
                // No tools enabled yet
                return (
                  <Card className="wellness-card">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-blue-500" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">Set Up Your Tools</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Enable health tracking tools to monitor your conditions
                      </p>
                      <Link href="/profile/tools">
                        <Button size="sm" className="wellness-button-primary">
                          Choose Tools
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              } else {
                // All tools have been tracked today
                return (
                  <Card className="wellness-card">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-green-500" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">Great job!</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        You've completed all your tracking for today
                      </p>
                      <p className="text-xs text-gray-500">
                        Check back later for your next reminders
                      </p>
                    </CardContent>
                  </Card>
                )
              }
            })()}
          </div>
        </div>

        {/* Recent Insights - Improved formatting */}
        {healthInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Insights</h3>
              <Link href="/insights">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View Full Analysis
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              {healthInsights.slice(0, 2).map((insight, index) => {
                const insights = insight.insights || {}
                const summary = insights.summary || 'Health insight available'
                const recommendations = insights.recommendations || []
                const concerns = insights.concerns || []
                
                return (
                  <Link key={insight.id || index} href="/insights">
                    <Card className="wellness-card hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm mb-2">
                              {summary}
                            </h4>
                            {recommendations.length > 0 && (
                              <p className="text-xs text-gray-600 mb-2">
                                💡 {recommendations[0]}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-blue-600">
                                {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
                              </span>
                              {concerns.length > 0 && (
                                <span className="text-orange-600">
                                  • {concerns.length} concern{concerns.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              <span className="text-gray-400 ml-auto">
                                {new Date(insight.generated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
            
            {/* Insufficient data message */}
            {healthInsights.length === 0 && (
              <Card className="wellness-card">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Building Your Health Profile</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Continue tracking your health metrics to get personalized insights
                  </p>
                  <Link href="/insights">
                    <Button variant="outline" size="sm">
                      View Insights Page
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recommended for you</h3>
              <Badge variant="outline" className="text-xs">
                {recommendedActions.length} action{recommendedActions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              {recommendedActions.map((action) => (
                <Card key={action.id} className="wellness-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          action.priority === 'urgent' ? 'bg-red-100' :
                          action.priority === 'high' ? 'bg-orange-100' :
                          action.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          {action.type === 'tool_usage' && <Target className={`w-5 h-5 ${
                            action.priority === 'urgent' ? 'text-red-500' :
                            action.priority === 'high' ? 'text-orange-500' :
                            action.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />}
                          {action.type === 'tool_setup' && <Activity className="w-5 h-5 text-blue-500" />}
                          {action.type === 'overdue_medication' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                          {action.type === 'insight' && <Star className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{action.title}</h4>
                            {action.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                            {action.priority === 'high' && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">High</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {action.action === 'track' && action.toolId && (
                          <Link href={`/track/${action.toolId}`}>
                            <Button size="sm" className="wellness-button-primary">
                              Track Now
                            </Button>
                          </Link>
                        )}
                        {action.action === 'setup' && (
                          <Link href="/profile/tools">
                            <Button size="sm" className="wellness-button-primary">
                              Set Up Tools
                            </Button>
                          </Link>
                        )}
                        {action.action === 'chat' && (
                          <Link href="/chat">
                            <Button size="sm" variant="outline">
                              Get Help
                            </Button>
                          </Link>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}


        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Quick actions</h3>

          <div className="grid gap-3">
            <Button
              onClick={() => setShowSymptomTracker(true)}
              className="wellness-button-primary h-14 rounded-2xl flex items-center justify-start px-6 space-x-4"
            >
              <Activity className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Log a Symptom</div>
                <div className="text-sm opacity-90">Track how you're feeling</div>
              </div>
            </Button>

            <Button
              onClick={() => setShowMoodTracker(true)}
              variant="outline"
              className="wellness-button-secondary h-14 rounded-2xl flex items-center justify-start px-6 space-x-4"
            >
              <Heart className="w-6 h-6 text-red-500" />
              <div className="text-left">
                <div className="font-semibold">Check-In</div>
                <div className="text-sm text-gray-600">How's your mood today?</div>
              </div>
            </Button>

            <Link href="/chat/" className="w-full">
              <Button
                variant="outline"
                className="wellness-button-secondary h-14 rounded-2xl flex items-center justify-start px-6 space-x-4 w-full"
              >
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold">Chat with Assistant</div>
                  <div className="text-sm text-gray-600">
                    Get help with {conditions.length > 0 ? conditions[0].name : "your health"}
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        {recentEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Recent activity</h3>

            {recentEntries.slice(0, 3).map((entry) => (
              <Card key={entry.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        {entry.tool_id.includes('mood') && <Heart className="w-5 h-5 text-pink-500" />}
                        {entry.tool_id.includes('glucose') && <Activity className="w-5 h-5 text-red-500" />}
                        {entry.tool_id.includes('symptom') && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                        {entry.tool_id.includes('medication') && <Pill className="w-5 h-5 text-blue-500" />}
                        {!entry.tool_id.includes('mood') && !entry.tool_id.includes('glucose') && 
                         !entry.tool_id.includes('symptom') && !entry.tool_id.includes('medication') && 
                         <Activity className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {entry.tool_id.replace('-', ' ').replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {entry.tool_id.includes('mood') && entry.data.mood && (() => {
                            const mood = entry.data.mood
                            if (typeof mood === 'number') {
                              if (mood <= 2) return "Mood: Very Sad 😢"
                              if (mood <= 4) return "Mood: Sad 😔"
                              if (mood <= 6) return "Mood: Neutral 😐"
                              if (mood <= 8) return "Mood: Happy 😊"
                              return "Mood: Very Happy 😄"
                            }
                            const moodLabels = {
                              'very-sad': 'Very Sad 😢',
                              'sad': 'Sad 😔',
                              'neutral': 'Neutral 😐',
                              'happy': 'Happy 😊',
                              'very-happy': 'Very Happy 😄'
                            }
                            return `Mood: ${moodLabels[mood] || mood}`
                          })()}
                          {entry.tool_id.includes('glucose') && entry.data.glucose && `${entry.data.glucose} mg/dL`}
                          {entry.tool_id.includes('symptom') && entry.data.type && `${entry.data.type}`}
                          {entry.tool_id.includes('medication') && entry.data.medication && `${entry.data.medication}`}
                          {!entry.tool_id.includes('mood') && !entry.tool_id.includes('glucose') && 
                           !entry.tool_id.includes('symptom') && !entry.tool_id.includes('medication') && 'Tracked'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Navigation Links */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Explore</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/insights" className="w-full">
              <Card className="wellness-card hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Health Analytics</h4>
                  <p className="text-xs text-gray-600">Detailed insights & trends</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/track" className="w-full">
              <Card className="wellness-card hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Track Health</h4>
                  <p className="text-xs text-gray-600">Log your metrics</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Debug Section - Remove this after fixing the issue */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Debug Info</h3>
              <Badge variant="outline" className="text-xs">
                Development Only
              </Badge>
            </div>
            
            <Card className="wellness-card">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div><strong>User Tools:</strong> {userTools.length}</div>
                  <div><strong>Recent Entries:</strong> {recentEntries.length}</div>
                  <div><strong>Today:</strong> {new Date().toISOString().split('T')[0]}</div>
                  <div><strong>Recommended Tools Count:</strong> {getRecommendedTools().length}</div>
                  <div><strong>Available Tool Presets:</strong> {toolPresets.length}</div>
                  
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">User Tools Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(userTools.map(t => ({ id: t.tool_id, name: t.tool_name, enabled: t.is_enabled })), null, 2)}
                    </pre>
                  </details>
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Recent Entries Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(recentEntries.map(e => ({ tool_id: e.tool_id, timestamp: e.timestamp, date: new Date(e.timestamp).toDateString() })), null, 2)}
                    </pre>
                  </details>
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Available Tool Presets</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(toolPresets.map(tp => ({ id: tp.id, name: tp.name, type: tp.type })), null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


      </main>

      {/* Modals */}
      {showMoodTracker && <MoodTracker onClose={() => setShowMoodTracker(false)} />}
      {showSymptomTracker && <SymptomTracker onClose={() => setShowSymptomTracker(false)} />}
      {showMedicationLogger && <MedicationLogger onClose={() => setShowMedicationLogger(false)} />}
    </div>
  )
}
