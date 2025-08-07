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
import { Activity, Heart, Pill, MessageCircle, TrendingUp, Clock, Bell, AlertTriangle, Target, ChevronRight, Star, Zap, TrendingDown } from "lucide-react"
import Link from "next/link"
import type { UserProfile, HealthCondition, UserTool, TrackingEntry } from "@/lib/database"
import { HomepageIntegrationService, DashboardData } from "@/lib/services/homepage-integration"

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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
          const entries = await DatabaseService.getRecentTrackingEntries(user.id, 3)
          setRecentEntries(entries)
          console.log('Dashboard: Tracking entries loaded:', entries.length)
        } catch (trackingError) {
          console.log('Dashboard: Tracking entries not available (table may not exist yet):', trackingError.message)
          setRecentEntries([])
        }

        // Load integrated dashboard data
        try {
          const integrated = await HomepageIntegrationService.getDashboardData(user.id)
          setDashboardData(integrated)
          console.log('Dashboard: Integrated data loaded')
        } catch (integrationError) {
          console.log('Dashboard: Failed to load integrated data:', integrationError)
          setDashboardData(null)
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <AppLogo size="lg" className="mb-4" />
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
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
            <WellnessCircle score={wellnessScore} />
            <p className="text-sm text-gray-600 mt-2">
              {wellnessScore >= 80
                ? "You're doing great! 🌟"
                : wellnessScore >= 60
                  ? "Keep up the good work! 💪"
                  : "Let's work on feeling better 💙"}
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

        {/* Health Alerts */}
        {unreadAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Health Alerts</h3>
              <Badge variant="destructive" className="text-xs">
                {unreadAlerts.length} alert{unreadAlerts.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {unreadAlerts.slice(0, 3).map((alert) => (
                <Card key={alert.id} className="wellness-card border-l-4 border-l-red-500">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-100' : 
                          alert.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.severity === 'critical' ? 'text-red-500' : 
                            alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {unreadAlerts.length > 3 && (
                <Link href="/notifications">
                  <Button variant="outline" size="sm" className="w-full">
                    View all {unreadAlerts.length} alerts
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Health Insights Summary */}
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

            <div className="grid grid-cols-1 gap-3">
              {healthInsights.slice(0, 3).map((insight, index) => {
                const insights = insight.insights || {}
                const trends = insights.trends || []
                const recommendations = insights.recommendations || []
                const concerns = insights.concerns || []
                
                return (
                  <Card key={insight.id || index} className="wellness-card">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100">
                            <Star className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {insights.summary || `${insight.insight_type} insights`}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              {trends.length > 0 && (
                                <span className="text-xs text-green-600">
                                  {trends.length} trend{trends.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {recommendations.length > 0 && (
                                <span className="text-xs text-blue-600">
                                  {recommendations.length} tip{recommendations.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {concerns.length > 0 && (
                                <span className="text-xs text-orange-600">
                                  {concerns.length} alert{concerns.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
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

        {/* Your Active Tools */}
        {userTools.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Your active tools</h3>
              <Link href="/profile/tools">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {userTools.slice(0, 4).map((userTool) => {
                const toolPreset = toolPresets.find(tp => tp.id === userTool.tool_id)
                if (!toolPreset) return null

                const todayEntries = recentEntries.filter(entry => 
                  entry.tool_id === userTool.tool_id && 
                  entry.timestamp.startsWith(new Date().toISOString().split('T')[0])
                )

                return (
                  <Link key={userTool.id} href={`/track/${toolPreset.id}`}>
                    <Card className="wellness-card hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="text-center space-y-2">
                          <div className="w-8 h-8 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                            {toolPreset.type === 'mood_tracker' && <Heart className="w-4 h-4 text-blue-600" />}
                            {toolPreset.type === 'symptom_tracker' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                            {toolPreset.type === 'medication_reminder' && <Pill className="w-4 h-4 text-purple-600" />}
                            {toolPreset.type === 'glucose_tracker' && <Activity className="w-4 h-4 text-red-600" />}
                            {toolPreset.type === 'exercise_tracker' && <TrendingUp className="w-4 h-4 text-green-600" />}
                            {toolPreset.type === 'custom' && <Target className="w-4 h-4 text-blue-600" />}
                            {!['mood_tracker', 'symptom_tracker', 'medication_reminder', 'glucose_tracker', 'exercise_tracker', 'custom'].includes(toolPreset.type) && 
                              <Activity className="w-4 h-4 text-blue-600" />}
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{toolPreset.name}</h4>
                          <div className="flex items-center justify-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              todayEntries.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs text-gray-600">
                              {todayEntries.length > 0 ? 'Tracked today' : 'Not tracked'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
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

            <Link href="/chat" className="w-full">
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

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/track" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">View Trends</h4>
                <p className="text-xs text-gray-600">See your progress</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/insights" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Health Data</h4>
                <p className="text-xs text-gray-600">Detailed insights</p>
              </CardContent>
            </Card>
          </Link>
        </div>


      </main>

      {/* Modals */}
      {showMoodTracker && <MoodTracker onClose={() => setShowMoodTracker(false)} />}
      {showSymptomTracker && <SymptomTracker onClose={() => setShowSymptomTracker(false)} />}
      {showMedicationLogger && <MedicationLogger onClose={() => setShowMedicationLogger(false)} />}
    </div>
  )
}
