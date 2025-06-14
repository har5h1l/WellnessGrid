"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Activity, Heart, Target, Search, Plus, TrendingUp, Clock, Bell, Calendar, BarChart3, Settings, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { UserProfile, HealthCondition, UserTool, TrackingEntry } from "@/lib/database"
import { toolPresets } from "@/lib/data/mock-sources"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

export default function TrackPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conditions, setConditions] = useState<HealthCondition[]>([])
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [recentEntries, setRecentEntries] = useState<TrackingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        const userData = await DatabaseService.getUserCompleteData(user.id)
        if (!userData.profile) {
          router.push('/setup')
          return
        }

        setUserProfile(userData.profile)
        setConditions(userData.conditions)
        
        // More robust filtering - handle different possible states
        const enabledTools = userData.tools.filter(t => {
          // If is_enabled is explicitly false, exclude it
          if (t.is_enabled === false) return false
          
          // If is_enabled is true or undefined/null (default to enabled), include it
          return true
        })
        
        setUserTools(enabledTools)
        
        // Debug: Log tool IDs to help with troubleshooting
        console.log('Loaded user tools:', enabledTools.map(t => ({ id: t.tool_id, name: t.tool_name, category: t.tool_category })))
        console.log('Available tool presets:', toolPresets.map(tp => ({ id: tp.id, name: tp.name, type: tp.type })))
        
        // Load recent tracking entries (optional - may fail if table doesn't exist)
        try {
          const entries = await DatabaseService.getRecentTrackingEntries(user.id, 10)
          console.log('Loaded recent entries:', entries.length)
          setRecentEntries(entries)
        } catch (trackingError) {
          console.log('Tracking entries not available:', trackingError)
          setRecentEntries([])
        }
      } catch (error) {
        console.error('Error loading tracking data:', error)
        toast.error('Failed to load tracking data')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // Create a mapping for common tool ID variations
  const getToolPreset = (toolId: string) => {
    // First try exact match
    let preset = toolPresets.find(tp => tp.id === toolId)
    if (preset) return preset
    
    // Try common variations and mappings
    const idMappings = {
      // Common variations that might be in database
      'blood-glucose': 'glucose-tracker',
      'glucose': 'glucose-tracker',
      'blood_glucose': 'glucose-tracker',
      'glucose_tracker': 'glucose-tracker',
      'diabetes-tracker': 'glucose-tracker',
      'bg-tracker': 'glucose-tracker',
      
      'peak-flow': 'peak-flow-tracker',
      'peak_flow': 'peak-flow-tracker',
      'peakflow': 'peak-flow-tracker',
      'lung-function': 'peak-flow-tracker',
      
      'blood-pressure': 'blood-pressure-tracker',
      'blood_pressure': 'blood-pressure-tracker',
      'bp-tracker': 'blood-pressure-tracker',
      'bp_tracker': 'blood-pressure-tracker',
      'hypertension-tracker': 'blood-pressure-tracker',
      
      'mood-tracker': 'mood-tracker',
      'mood': 'mood-tracker',
      'depression-tracker': 'mood-tracker',
      'depression': 'mood-tracker',
      'mental-health': 'mood-tracker',
      'anxiety-tracker': 'mood-tracker',
      
      'pain': 'pain-tracker',
      'pain-symptom': 'pain-tracker',
      'pain_tracker': 'pain-tracker',
      'symptom-tracker': 'symptom-tracker',
      'arthritis-tracker': 'pain-tracker',
      
      'medication': 'medication-reminder',
      'medication-tracker': 'medication-reminder',
      'med-tracker': 'medication-reminder',
      'med_tracker': 'medication-reminder',
      'medication_tracker': 'medication-reminder',
      'pill-tracker': 'medication-reminder',
      'adherence-tracker': 'medication-reminder',
      
      'sleep': 'sleep-tracker',
      'sleep-quality': 'sleep-tracker',
      'sleep_tracker': 'sleep-tracker',
      'sleep_quality': 'sleep-tracker',
      
      'exercise': 'physical-activity-tracker',
      'activity-tracker': 'physical-activity-tracker',
      'fitness-tracker': 'physical-activity-tracker',
      'exercise_tracker': 'physical-activity-tracker',
      'activity_tracker': 'physical-activity-tracker',
      'fitness_tracker': 'physical-activity-tracker',
      'workout-tracker': 'physical-activity-tracker',
      
      'hydration': 'hydration-tracker',
      'water-tracker': 'hydration-tracker',
      'hydration_tracker': 'hydration-tracker',
      'water_tracker': 'hydration-tracker',
      
      'nutrition': 'nutrition-tracker',
      'food-tracker': 'nutrition-tracker',
      'nutrition_tracker': 'nutrition-tracker',
      'food_tracker': 'nutrition-tracker',
      'meal-tracker': 'nutrition-tracker',
      
      'vital-signs': 'vital-signs-tracker',
      'vitals': 'vital-signs-tracker',
      'vital_signs': 'vital-signs-tracker',
      'vital_signs_tracker': 'vital-signs-tracker'
    }
    
    // Try mapped ID
    const mappedId = idMappings[toolId as keyof typeof idMappings]
    if (mappedId) {
      preset = toolPresets.find(tp => tp.id === mappedId)
      if (preset) {
        console.log(`Mapped tool ID "${toolId}" to "${mappedId}"`)
        return preset
      }
    }
    
    return null
  }

  // Filter tools based on search and category
  const filteredTools = userTools.filter(userTool => {
    const toolPreset = getToolPreset(userTool.tool_id)
    if (!toolPreset) {
      console.warn(`No tool preset found for tool_id: ${userTool.tool_id}`)
      // Still show the tool even if preset is not found, using fallback data
      if (searchQuery) {
        const searchMatch = userTool.tool_name.toLowerCase().includes(searchQuery.toLowerCase())
        if (!searchMatch) return false
      }
      return true // Show tools even without presets
    }
    
    if (searchQuery) {
      const searchMatch = toolPreset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         toolPreset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         userTool.tool_name.toLowerCase().includes(searchQuery.toLowerCase())
      if (!searchMatch) return false
    }

    if (selectedCategory !== "all") {
      if (toolPreset.type !== selectedCategory) return false
    }
    
    return true
  })

  // Debug: Log filtering results
  console.log('Filtered tools count:', filteredTools.length)
  console.log('Search query:', searchQuery)
  console.log('Selected category:', selectedCategory)

  // Get categories from tools
  const getCategories = () => {
    const categories = new Set<string>()
    userTools.forEach(userTool => {
      const preset = getToolPreset(userTool.tool_id)
      if (preset) {
        categories.add(preset.type)
      }
    })
    return Array.from(categories)
  }
  
  // Get today's entries for a specific tool
  const getTodayEntries = (toolId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return recentEntries.filter(entry => 
      entry.tool_id === toolId && 
      entry.timestamp.startsWith(today)
    )
  }

  // Get tool icon based on type
  const getToolIcon = (type: string) => {
    switch (type) {
      case 'mood_tracker':
        return <Heart className="w-5 h-5 text-pink-500" />
      case 'custom':
        return <Activity className="w-5 h-5 text-blue-500" />
      case 'medication_reminder':
        return <Target className="w-5 h-5 text-green-500" />
      case 'symptom_tracker':
        return <Activity className="w-5 h-5 text-red-500" />
      case 'sleep_tracker':
        return <Clock className="w-5 h-5 text-purple-500" />
      case 'exercise_tracker':
        return <TrendingUp className="w-5 h-5 text-orange-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  // Get tool progress for today
  const getToolProgress = (userTool: UserTool) => {
    const preset = getToolPreset(userTool.tool_id)
    const effectivePreset = preset || {
      defaultSettings: {
        reminderTimes: ['08:00', '20:00']
      }
    }

    const todayEntries = getTodayEntries(userTool.tool_id)
    const reminderTimes = userTool.settings?.reminderTimes || effectivePreset.defaultSettings.reminderTimes || []
    
    return {
      completed: todayEntries.length,
      total: reminderTimes.length,
      percentage: reminderTimes.length > 0 ? Math.round((todayEntries.length / reminderTimes.length) * 100) : 0
    }
  }

  // Get next reminder time
  const getNextReminder = (userTool: UserTool) => {
    const reminderTimes = userTool.settings?.reminderTimes || []
    if (reminderTimes.length === 0) return null

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    for (const timeStr of reminderTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const reminderTime = hours * 60 + minutes
      
      if (reminderTime > currentTime) {
        return timeStr
      }
    }

    // If no reminders left today, return first reminder for tomorrow
    return reminderTimes[0] + ' (tomorrow)'
  }

  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tracking tools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">Health Tracking</h1>
        </div>
        <Link href="/profile/tools">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{userTools.length}</p>
              <p className="text-xs text-gray-600">Active Tools</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {recentEntries.filter(entry => entry.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}
              </p>
              <p className="text-xs text-gray-600">Today's Entries</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...userTools.map(tool => getTodayEntries(tool.tool_id).length), 0)}
              </p>
              <p className="text-xs text-gray-600">Best Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search your tracking tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-2xl"
            />
          </div>

          {/* Category filters */}
          {getCategories().length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="rounded-full whitespace-nowrap"
              >
                All
              </Button>
              {getCategories().map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full whitespace-nowrap"
                >
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Active Tools */}
        {filteredTools.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Your Tools ({filteredTools.length})
              </h2>
              <Link href="/profile/tools">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {filteredTools.map((userTool) => {
                const toolPreset = getToolPreset(userTool.tool_id)
                const effectivePreset = toolPreset || userTool.preset_config || {
                  id: userTool.tool_id,
                  name: userTool.tool_name,
                  type: userTool.tool_category || 'custom',
                  description: `Track your ${userTool.tool_name.toLowerCase()}`,
                  applicableConditions: ['all'],
                  defaultSettings: {
                    notifications: true,
                    reminderTimes: ['08:00', '20:00'],
                    customFields: []
                  }
                }
                const todayEntries = getTodayEntries(userTool.tool_id)
                const hasReminders = userTool.settings?.reminderEnabled && 
                                   userTool.settings?.reminderTimes?.length > 0
                const progress = getToolProgress(userTool)
                const nextReminder = getNextReminder(userTool)

                // Determine proper route based on tool type
                const getProperRoute = () => {
                  const type = effectivePreset.type
                  const toolName = userTool.tool_name?.toLowerCase() || ''
                  
                  // Check by tool type first
                  switch(type) {
                    case 'hydration_tracker': return 'hydration-tracker'
                    case 'sleep_tracker': return 'sleep-tracker'
                    case 'glucose_tracker': return 'glucose-tracker'
                    case 'vital_signs_tracker': return 'blood-pressure-tracker'
                    case 'nutrition_tracker': return 'nutrition-tracker'
                    case 'mood_tracker': return 'mood-tracker'
                    case 'symptom_tracker': return 'symptom-tracker'
                    case 'medication_reminder': return 'medication-reminder'
                    case 'exercise_tracker': return 'physical-activity-tracker'
                    case 'respiratory_tracker': return 'peak-flow-tracker'
                  }
                  
                  // Fallback to tool name matching for edge cases
                  if (toolName.includes('hydration') || toolName.includes('water')) return 'hydration-tracker'
                  if (toolName.includes('sleep')) return 'sleep-tracker'
                  if (toolName.includes('glucose') || toolName.includes('blood sugar')) return 'glucose-tracker'
                  if (toolName.includes('blood pressure') || toolName.includes('vital') || toolName.includes('bp')) return 'blood-pressure-tracker'
                  if (toolName.includes('nutrition') || toolName.includes('food') || toolName.includes('meal')) return 'nutrition-tracker'
                  if (toolName.includes('mood') || toolName.includes('depression') || toolName.includes('mental')) return 'mood-tracker'
                  if (toolName.includes('symptom') || toolName.includes('pain')) return 'symptom-tracker'
                  if (toolName.includes('medication') || toolName.includes('pill')) return 'medication-reminder'
                  if (toolName.includes('exercise') || toolName.includes('activity') || toolName.includes('workout')) return 'physical-activity-tracker'
                  
                  // Final fallback
                  return userTool.tool_id || 'general'
                }

                // Debug logging (now after getProperRoute is defined)
                if (userTool.tool_name?.toLowerCase().includes('glucose')) {
                  console.log('Glucose tool debug:', {
                    userTool_id: userTool.id,
                    tool_id: userTool.tool_id,
                    tool_name: userTool.tool_name,
                    tool_category: userTool.tool_category,
                    effectivePreset_type: effectivePreset.type,
                    effectivePreset_id: effectivePreset.id,
                    will_route_to: getProperRoute()
                  })
                }

                return (
                  <Card key={userTool.id} className="wellness-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                            {getToolIcon(effectivePreset.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{effectivePreset.name}</h3>
                            <p className="text-sm text-gray-600">{effectivePreset.description}</p>
                          </div>
                        </div>
                        <Link href={`/track/${getProperRoute()}`}>
                          <Button size="sm" className="wellness-button-primary">
                            Track Now
                          </Button>
                        </Link>
                      </div>

                      {/* Progress and Status */}
                                              <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {effectivePreset.type.replace('_', ' ')}
                            </Badge>
                          {hasReminders && (
                            <Badge variant="outline" className="text-xs text-blue-600 flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              Reminders
                            </Badge>
                          )}
                          <div className={`w-2 h-2 rounded-full ${
                            todayEntries.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-xs text-gray-600">
                            {todayEntries.length > 0 ? 'Tracked today' : 'Not tracked today'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        {progress && progress.total > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Progress: {progress.completed}/{progress.total}</span>
                              <span>{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Next reminder */}
                        {nextReminder && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>Next reminder: {nextReminder}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : userTools.length === 0 ? (
          /* No Tools Available */
          <Card className="wellness-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Tools</h3>
              <p className="text-gray-600 mb-4">
                Add some tracking tools to monitor your health conditions and symptoms.
              </p>
              <Link href="/profile/tools">
                <Button className="wellness-button-primary">
                  Browse Available Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* No Search Results */
          <Card className="wellness-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-600 mb-4">
                Try a different search term or browse all your tools.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="mr-2"
              >
                Clear Search
              </Button>
              <Link href="/profile/tools">
                <Button className="wellness-button-primary">
                  Manage Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentEntries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <Link href="/insights">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentEntries.slice(0, 5).map((entry) => {
                const toolPreset = getToolPreset(entry.tool_id)
                if (!toolPreset) return null

                return (
                  <Card key={entry.id} className="wellness-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                            {getToolIcon(toolPreset.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{toolPreset.name}</h4>
                            <p className="text-xs text-gray-600">
                              {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                              {new Date(entry.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Logged
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/profile/tools">
              <Card className="wellness-card cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900">Add Tools</h4>
                  <p className="text-xs text-gray-600">Browse available tracking tools</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/insights">
              <Card className="wellness-card cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900">View Insights</h4>
                  <p className="text-xs text-gray-600">See your health insights</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
