"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, TrendingUp, Activity, Heart, Target, Clock, BarChart3, Calendar, AlertTriangle, CheckCircle, Info } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { UserProfile, UserTool, TrackingEntry } from "@/lib/database"
import { toolPresets } from "@/lib/data/mock-sources"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

interface ToolAnalytics {
  toolId: string
  toolName: string
  toolType: string
  totalEntries: number
  averagePerDay: number
  streak: number
  lastEntry: string
  insights: any[]
}

export default function InsightsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [trackingEntries, setTrackingEntries] = useState<TrackingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("7")
  const [selectedTool, setSelectedTool] = useState<string>("all")

  // Load user data and tracking entries
  useEffect(() => {
    const loadData = async () => {
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
        setUserTools(userData.tools.filter(t => t.is_enabled))
        
        // Load tracking entries
        try {
          const entries = await DatabaseService.getTrackingEntries(user.id)
          setTrackingEntries(entries)
        } catch (error) {
          console.log('Tracking entries not available:', error)
          setTrackingEntries([])
        }
      } catch (error) {
        console.error('Error loading insights data:', error)
        toast.error('Failed to load insights data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Get tool preset
  const getToolPreset = (toolId: string) => {
    return toolPresets.find(tp => tp.id === toolId) || 
           toolPresets.find(tp => tp.id === 'glucose-tracker') // fallback
  }

  // Filter entries by period
  const getEntriesInPeriod = (days: number, toolId?: string) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return trackingEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      const matchesPeriod = entryDate >= cutoffDate
      const matchesTool = !toolId || toolId === 'all' || entry.tool_id === toolId
      return matchesPeriod && matchesTool
    })
  }

  // Calculate tool analytics
  const calculateToolAnalytics = (): ToolAnalytics[] => {
    const period = parseInt(selectedPeriod)
    
    return userTools.map(tool => {
      const toolEntries = getEntriesInPeriod(period, tool.tool_id)
      const preset = getToolPreset(tool.tool_id)
      
      // Calculate streak (consecutive days with entries)
      const streak = calculateStreak(tool.tool_id)
      
      // Calculate insights based on tool type
      const insights = generateToolInsights(tool.tool_id, toolEntries, preset)
      
      return {
        toolId: tool.tool_id,
        toolName: tool.tool_name,
        toolType: preset?.type || 'custom',
        totalEntries: toolEntries.length,
        averagePerDay: toolEntries.length / period,
        streak,
        lastEntry: toolEntries.length > 0 ? toolEntries[0].timestamp : '',
        insights
      }
    })
  }

  // Calculate consecutive days streak
  const calculateStreak = (toolId: string): number => {
    const today = new Date()
    let streak = 0
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const hasEntry = trackingEntries.some(entry => 
        entry.tool_id === toolId && entry.timestamp.startsWith(dateStr)
      )
      
      if (hasEntry) {
        streak++
      } else if (i > 0) {
        break // Break on first missing day (but not today)
      }
    }
    
    return streak
  }

  // Generate tool-specific insights
  const generateToolInsights = (toolId: string, entries: TrackingEntry[], preset: any) => {
    if (entries.length === 0) return []
    
    const insights: any[] = []
    
    switch (preset?.id) {
      case 'glucose-tracker':
        const glucoseValues = entries.map(e => e.data.glucose_level).filter(v => v)
        if (glucoseValues.length > 0) {
          const avg = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length
          const high = glucoseValues.filter(v => v > 180).length
          const low = glucoseValues.filter(v => v < 70).length
          
          insights.push({
            type: 'average',
            title: 'Average Glucose',
            value: `${Math.round(avg)} mg/dL`,
            status: avg < 70 ? 'low' : avg > 180 ? 'high' : 'normal'
          })
          
          if (high > 0) {
            insights.push({
              type: 'warning',
              title: 'High Readings',
              value: `${high} readings above 180 mg/dL`,
              status: 'high'
            })
          }
          
          if (low > 0) {
            insights.push({
              type: 'warning',
              title: 'Low Readings',
              value: `${low} readings below 70 mg/dL`,
              status: 'low'
            })
          }
        }
        break
        
      case 'blood-pressure-tracker':
        const bpReadings = entries.filter(e => e.data.systolic && e.data.diastolic)
        if (bpReadings.length > 0) {
          const avgSystolic = bpReadings.reduce((sum, e) => sum + e.data.systolic, 0) / bpReadings.length
          const avgDiastolic = bpReadings.reduce((sum, e) => sum + e.data.diastolic, 0) / bpReadings.length
          const highBP = bpReadings.filter(e => e.data.systolic > 140 || e.data.diastolic > 90).length
          
          insights.push({
            type: 'average',
            title: 'Average BP',
            value: `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`,
            status: avgSystolic > 140 || avgDiastolic > 90 ? 'high' : 'normal'
          })
          
          if (highBP > 0) {
            insights.push({
              type: 'warning',
              title: 'High BP Readings',
              value: `${highBP} readings above normal`,
              status: 'high'
            })
          }
        }
        break
        
      case 'mood-depression-tracker':
        const moodValues = entries.map(e => e.data.mood).filter(v => v)
        const energyValues = entries.map(e => e.data.energy).filter(v => v)
        
        if (moodValues.length > 0) {
          const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length
          const lowMoods = moodValues.filter(v => v <= 3).length
          
          insights.push({
            type: 'average',
            title: 'Average Mood',
            value: `${avgMood.toFixed(1)}/10`,
            status: avgMood < 4 ? 'low' : avgMood > 7 ? 'high' : 'normal'
          })
          
          if (lowMoods > 0) {
            insights.push({
              type: 'info',
              title: 'Low Mood Days',
              value: `${lowMoods} days with mood ≤ 3`,
              status: 'low'
            })
          }
        }
        
        if (energyValues.length > 0) {
          const avgEnergy = energyValues.reduce((a, b) => a + b, 0) / energyValues.length
          insights.push({
            type: 'info',
            title: 'Average Energy',
            value: `${avgEnergy.toFixed(1)}/10`,
            status: avgEnergy < 4 ? 'low' : avgEnergy > 7 ? 'high' : 'normal'
          })
        }
        break
        
      case 'pain-tracker':
        const painValues = entries.map(e => e.data.pain_level).filter(v => v !== undefined)
        if (painValues.length > 0) {
          const avgPain = painValues.reduce((a, b) => a + b, 0) / painValues.length
          const highPain = painValues.filter(v => v >= 7).length
          
          insights.push({
            type: 'average',
            title: 'Average Pain Level',
            value: `${avgPain.toFixed(1)}/10`,
            status: avgPain > 7 ? 'high' : avgPain < 3 ? 'low' : 'normal'
          })
          
          if (highPain > 0) {
            insights.push({
              type: 'warning',
              title: 'High Pain Days',
              value: `${highPain} days with pain ≥ 7`,
              status: 'high'
            })
          }
        }
        break
        
      case 'medication-adherence-tracker':
        const adherenceEntries = entries.filter(e => e.data.adherence !== undefined)
        if (adherenceEntries.length > 0) {
          const adherentCount = adherenceEntries.filter(e => e.data.adherence === true).length
          const adherenceRate = (adherentCount / adherenceEntries.length) * 100
          
          insights.push({
            type: 'percentage',
            title: 'Adherence Rate',
            value: `${Math.round(adherenceRate)}%`,
            status: adherenceRate >= 90 ? 'high' : adherenceRate >= 70 ? 'normal' : 'low'
          })
          
          if (adherenceRate < 80) {
            insights.push({
              type: 'warning',
              title: 'Missed Doses',
              value: `${adherenceEntries.length - adherentCount} doses missed`,
              status: 'low'
            })
          }
        }
        break
    }
    
    return insights
  }

  // Get tool icon
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

  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessGrid</h2>
          <p className="text-gray-600 mb-8">Please set up your profile to view health insights</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  const analytics = calculateToolAnalytics()
  const periodEntries = getEntriesInPeriod(parseInt(selectedPeriod), selectedTool)
  const hasData = trackingEntries.length > 0

  if (!hasData) {
    return (
      <div className="min-h-screen wellness-gradient pb-20">
        <header className="wellness-header">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-gray-900">Health Insights</h1>
          </div>
          <div className="w-10"></div>
        </header>

        <main className="px-4 py-6">
          <Card className="wellness-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tracking data yet</h3>
              <p className="text-gray-600 mb-4">
                Start tracking your health to generate detailed insights and analytics.
              </p>
              <Link href="/track">
                <Button className="wellness-button-primary">
                  Start Tracking
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      <header className="wellness-header">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900">Health Insights</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Filter Controls */}
        <div className="flex space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 2 weeks</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tools</SelectItem>
              {userTools.map(tool => (
                <SelectItem key={tool.tool_id} value={tool.tool_id}>
                  {tool.tool_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{periodEntries.length}</p>
              <p className="text-xs text-gray-600">Total Entries</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((periodEntries.length / parseInt(selectedPeriod)) * 10) / 10}
              </p>
              <p className="text-xs text-gray-600">Avg per Day</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...analytics.map(a => a.streak), 0)}
              </p>
              <p className="text-xs text-gray-600">Best Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Tool Analytics */}
          <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Tool Performance</h2>
          
          {analytics.map(tool => (
            <Card key={tool.toolId} className="wellness-card">
              <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      {getToolIcon(tool.toolType)}
                      </div>
                      <div>
                      <CardTitle className="text-lg">{tool.toolName}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize">
                        {tool.toolType.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{tool.totalEntries}</p>
                    <p className="text-xs text-gray-600">entries</p>
                  </div>
          </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{tool.averagePerDay.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">per day</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{tool.streak}</p>
                    <p className="text-xs text-gray-600">day streak</p>
                  </div>
                </div>

                {/* Insights */}
                {tool.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Insights</h4>
                    {tool.insights.map((insight, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {insight.status === 'high' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {insight.status === 'low' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                          {insight.status === 'normal' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          <span className="text-sm font-medium text-gray-700">{insight.title}</span>
                        </div>
                        <span className="text-sm text-gray-600">{insight.value}</span>
                      </div>
            ))}
          </div>
        )}

                {/* Last entry */}
                {tool.lastEntry && (
                  <div className="text-xs text-gray-500">
                    Last entry: {new Date(tool.lastEntry).toLocaleDateString()} at{' '}
                    {new Date(tool.lastEntry).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>

        {/* Quick Actions */}
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
        <div className="grid grid-cols-2 gap-3">
              <Link href="/track">
                <Button variant="outline" className="w-full">
                  <Activity className="w-4 h-4 mr-2" />
                  Track Now
                </Button>
              </Link>
              <Link href="/profile/tools">
                <Button variant="outline" className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Manage Tools
                </Button>
          </Link>
            </div>
              </CardContent>
            </Card>
      </main>
    </div>
  )
}
