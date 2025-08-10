'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { memo, useMemo, useCallback } from 'react'

// Direct imports for better reliability - no dynamic loading
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Using local function definitions instead of separate files
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Brain,
  Activity,
  Calendar,
  Award,
  RefreshCw,
  Clock,
  Network
} from 'lucide-react'
import { AnalyticsData, HealthTrend, CorrelationData, StreakData, GoalProgress } from '@/lib/database/types'

interface HealthDashboardProps {
  userId: string
  className?: string
}

// Chart Skeleton for loading states
function ChartSkeleton() {
  return (
    <div className="w-full h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-spin border-2 border-transparent border-t-red-500"></div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    </div>
  )
}

// Section Skeleton for major components
function SectionSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const HealthDashboard = memo(function HealthDashboard({ userId, className }: HealthDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [supabase] = useState(() => createClient())

  const loadAnalytics = useCallback(async (includeInsights = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current session for auth token
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 Session check:', { 
          hasSession: !!session, 
          hasToken: !!session?.access_token,
          tokenLength: session?.access_token?.length 
        })
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      } catch (authError) {
        console.log('No auth session found:', authError)
      }
      
      const response = await fetch(
        `/api/analytics?timeRange=${timeRange}&includeInsights=${includeInsights}`,
        { headers }
      )
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load analytics')
      }
      
      if (!result.data || result.data.data_points === 0) {
        setAnalyticsData(null)
        setError('No health data found. Please start tracking to see analytics.')
        return
      }
      
      console.log('✅ Real analytics data loaded:', result.data)
      setAnalyticsData(result.data)
      
    } catch (err) {
      console.error('Analytics loading error:', err)
      setAnalyticsData(null)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [userId, timeRange, supabase])

  useEffect(() => {
    if (userId) {
      loadAnalytics(true) // Include insights by default for better UX
    }
  }, [userId, timeRange, loadAnalytics])

  const generateInsights = useCallback(async () => {
    try {
      setRefreshing(true)
      
      // Get current session for auth token
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      } catch (authError) {
        console.log('No auth session for insights:', authError)
      }
      
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          insightType: 'on_demand',
          forceGenerate: true // Always generate fresh insights when button is clicked
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }
      
      const result = await response.json()
      console.log('🧠 Insights generation result:', result)
      
      if (result.success && result.insights) {
        if (analyticsData) {
          const updatedData = {
            ...analyticsData,
            insights: [result.insights, ...(analyticsData.insights || [])]
          }
          setAnalyticsData(updatedData)
          console.log('✅ Insights added to analytics data')
          // Switch to insights tab after a brief delay to ensure state update
          setTimeout(() => setActiveTab('insights'), 100)
        } else {
          // If no analytics data yet, reload everything
          console.log('🔄 No analytics data, reloading with insights')
          await loadAnalytics(true)
          setTimeout(() => setActiveTab('insights'), 100)
        }
      } else {
        console.log('❌ No insights in response, reloading analytics')
        await loadAnalytics(true) // Reload analytics to get fresh insights  
      }
    } catch (err) {
      console.error('Insights generation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights'
      setError(`Insights generation failed: ${errorMessage}. Please try again or check if you have tracked health data.`)
    } finally {
      setRefreshing(false)
    }
  }, [analyticsData, supabase, setActiveTab])



  if (loading) {
    return <AnalyticsSkeleton />
  }

  if (error) {
    return (
      <Alert className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analyticsData) {
    return <EmptyAnalyticsState onRefresh={() => loadAnalytics()} />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-2xl shadow-sm">
                  <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    Your Health Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mt-1">
                    Insights from your health data over the last {timeRange}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none pr-10"
                  aria-label="Select time range for analytics data"
                  id="time-range-selector"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              <Button 
                onClick={generateInsights} 
                disabled={refreshing}
                className="bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
                size="default"
              >
                <Brain className={`h-4 w-4 mr-2 ${refreshing ? 'animate-pulse' : ''}`} />
                {refreshing ? 'Generating...' : 'Generate Insights'}
              </Button>
            </div>
          </div>
        </div>
      </div>

        {/* Meaningful Summary Dashboard */}
      {analyticsData && (analyticsData.data_points > 0 || analyticsData.health_score) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score with Context */}
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-100 dark:border-red-800 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Health Score</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Your overall wellness</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(typeof analyticsData.health_score === 'object' 
              ? analyticsData.health_score?.overall_score || 0
              : analyticsData.health_score || 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                </div>
                
                {/* Score Interpretation with Context */}
                <div className="space-y-2">
                  {(() => {
                    const score = typeof analyticsData.health_score === 'object' 
                      ? analyticsData.health_score?.overall_score || 0
                      : analyticsData.health_score || 0;
                    const trend = analyticsData.health_score?.trend;
                    
                    // Handle 'insufficient_data' and other technical terms
                    if (score === 0 || trend === 'insufficient_data') {
                      return (
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm font-medium">Start tracking to see your health score!</span>
                        </div>
                      );
                    }
                    
                    if (score >= 80) return (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Excellent health! Keep it up! 🌟</span>
                      </div>
                    );
                    if (score >= 60) return (
                      <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Good progress! Room to improve 💪</span>
                      </div>
                    );
                    if (score > 0) return (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Let's work on this together 🚀</span>
                      </div>
                    );
                    return (
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Start tracking to see your score!</span>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(5, (typeof analyticsData.health_score === 'object' 
                      ? analyticsData.health_score?.overall_score || 0
                      : analyticsData.health_score || 0))}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Activity Summary */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-100 dark:border-blue-800 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Today's Activity</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your health tracking today</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {analyticsData.today_stats ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Health entries</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {(analyticsData.today_stats.symptomsLogged || 0) + 
                         (analyticsData.today_stats.moodEntries || 0) + 
                         (analyticsData.today_stats.medicationsTaken || 0)}
                      </span>
                    </div>
                    
                    {analyticsData.today_stats.symptomsLogged > 0 && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-sm">{analyticsData.today_stats.symptomsLogged} symptoms logged</span>
                      </div>
                    )}
                    
                    {analyticsData.today_stats.moodEntries > 0 && (
                      <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                        <div className="w-2 h-2 bg-pink-500 rounded-full" />
                        <span className="text-sm">{analyticsData.today_stats.moodEntries} mood check-ins</span>
                      </div>
                    )}
                    
                    {analyticsData.today_stats.medicationsTaken > 0 && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm">{analyticsData.today_stats.medicationsTaken} medications taken</span>
                      </div>
                    )}
                    
                    {(analyticsData.today_stats.symptomsLogged || 0) + 
                     (analyticsData.today_stats.moodEntries || 0) + 
                     (analyticsData.today_stats.medicationsTaken || 0) === 0 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No tracking yet today</p>
                        <Button 
                          size="sm" 
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-7"
                          onClick={() => window.location.href = '/track'}
                        >
                          Start Tracking
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No activity data available</p>
                    <Button 
                      size="sm" 
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-7"
                      onClick={() => window.location.href = '/track'}
                    >
                      Start Tracking
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Insights & Next Steps */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-100 dark:border-green-800 shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Key Insights</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">What your data tells us</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {(() => {
                  const trends = analyticsData.trends || [];
                  const streaks = analyticsData.streaks || [];
                  const insights = [];
                  
                  // Generate actionable insights
                  if (trends.length > 0) {
                    const improvingTrends = trends.filter(t => 
                      t.trend_direction === 'improving' || t.trend_direction === 'good'
                    ).length;
                    const decliningTrends = trends.filter(t => 
                      t.trend_direction === 'declining' || t.trend_direction === 'concerning'
                    ).length;
                    
                    if (improvingTrends > 0) {
                      insights.push({
                        type: 'success',
                        message: `${improvingTrends} metric${improvingTrends > 1 ? 's are' : ' is'} improving! 📈`,
                        action: 'Keep up your current routine'
                      });
                    }
                    
                    if (decliningTrends > 0) {
                      insights.push({
                        type: 'warning',
                        message: `${decliningTrends} metric${decliningTrends > 1 ? 's need' : ' needs'} attention 📉`,
                        action: 'Check the Trends tab for details'
                      });
                    }
                  }
                  
                  if (streaks.length > 0) {
                    const activeStreaks = streaks.filter(s => s.current_streak > 0).length;
                    if (activeStreaks > 0) {
                      insights.push({
                        type: 'achievement',
                        message: `${activeStreaks} active streak${activeStreaks > 1 ? 's' : ''}! 🔥`,
                        action: 'Don\'t break the chain!'
                      });
                    }
                  }
                  
                  if (insights.length === 0) {
                    insights.push({
                      type: 'info',
                      message: 'Track more to see insights',
                      action: 'Add health data to get personalized tips'
                    });
                  }
                  
                  return insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.message}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {insight.action}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today Stats - Show consistency with dashboard */}
      {analyticsData?.today_stats && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Today's Activity</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{analyticsData.today_stats.symptomsLogged}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">symptoms today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{analyticsData.today_stats.moodEntries}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">mood entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{analyticsData.today_stats.medicationsTaken}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">meds taken</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Empty State with Guidance */}
      {(!analyticsData || analyticsData.data_points === 0) && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 shadow-sm rounded-xl">
          <CardContent className="py-16 px-8">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Activity className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ready to unlock your health insights?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  Start tracking just one health metric today and watch as your personal health dashboard comes to life with meaningful analytics and AI-powered insights.
                </p>
              </div>
              
              {/* Quick Start Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="text-2xl mb-2">📱</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">1. Pick a Metric</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose one health metric to track (mood, glucose, sleep, etc.)
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">2. Track for 3 Days</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log your data for just 3 days to see your first trends
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="text-2xl mb-2">🧠</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">3. Get Insights</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Return here to see personalized analytics and recommendations
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/track'} 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                  <Activity className="h-5 w-5 mr-2" />
                  Start Tracking Now
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/profile/tools'}
                  className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl px-8 py-3 text-lg font-semibold"
              >
                  <Brain className="h-5 w-5 mr-2" />
                  Explore Tools
              </Button>
              </div>
              
              <div className="mt-8 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 <strong>Pro tip:</strong> The more consistently you track, the better your insights become! 
                  Even tracking just your mood daily can reveal surprising patterns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {analyticsData?.alerts && analyticsData.alerts.length > 0 && (
        <AlertsSection alerts={analyticsData.alerts} />
      )}

      {/* Redesigned Dashboard with Consolidated Layout */}
      {analyticsData && (
        <div className="space-y-6">
          {/* Enhanced Health Score + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Health Score */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-100 dark:border-red-800 shadow-sm rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Health Score</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall wellness rating</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-5xl font-black text-gray-900 dark:text-white">
                    {typeof analyticsData.health_score === 'object' 
                      ? analyticsData.health_score?.overall_score || 0
                      : analyticsData.health_score || 0}
                  </span>
                  <span className="text-xl text-gray-500 dark:text-gray-400">/100</span>
                </div>
                

              </CardContent>
            </Card>
            
            {/* Quick Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {/* Today's Activity */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-100 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Today</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {(analyticsData.today_stats?.symptomsLogged || 0) + 
                     (analyticsData.today_stats?.moodEntries || 0) + 
                     (analyticsData.today_stats?.medicationsTaken || 0)}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">entries logged</p>
                </CardContent>
              </Card>
              
              {/* Data Points */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-100 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Total Data</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {analyticsData.data_points || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">data points</p>
                </CardContent>
              </Card>
              
              {/* Active Streaks */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-100 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Streaks</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {analyticsData.streaks?.filter(s => s.current_streak > 0).length || 0}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">active</p>
                </CardContent>
              </Card>
              
              {/* Trends */}
              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-100 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Improving</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {analyticsData.trends?.filter(t => t.trend_direction === 'improving').length || 0}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">metrics</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Active Streaks - Horizontal Layout */}
          {analyticsData.streaks && analyticsData.streaks.length > 0 && (
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Award className="h-5 w-5 text-orange-500" />
                  Your Active Streaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {analyticsData.streaks.map((streak, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg text-center">
                      <div className="text-2xl mb-2">{getStreakEmoji(streak.metric_name)}</div>
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                        {streak.current_streak}
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300 capitalize font-medium">
                        {streak.metric_name.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Best: {streak.best_streak} days
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Single Priority Action */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Today's Priority Action</h3>
                  </div>
                  
                  {/* Primary Recommendation */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎯 Focus: Get 7-8 hours of sleep tonight</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Based on your recent sleep data showing improved mood patterns. Consistent sleep timing helps stabilize your overall health metrics.
                    </p>
                  </div>
                  
                  {/* Secondary Action */}
                  <div className="mb-4 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg">
                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">📊 Also track: Glucose levels</h5>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Monitor more consistently throughout the day for better pattern analysis
                    </p>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Button 
                    onClick={() => window.location.href = '/track'}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Start Tracking
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Streamlined Tab Navigation */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-1 h-12">
                <TabsTrigger 
                  value="trends" 
                  className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-red-500 transition-all duration-300 rounded-md"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Historical Data</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="insights"
                  className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-red-500 transition-all duration-300 rounded-md"
                >
                  <Brain className="h-4 w-4" />
                  <span className="font-medium">AI Analysis</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="correlations"
                  className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-red-500 transition-all duration-300 rounded-md"
                >
                  <Network className="h-4 w-4" />
                  <span className="font-medium">Correlations</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-6 mt-6">
                <EnhancedTrendsSection trends={analyticsData.trends} correlations={analyticsData.correlations} />
              </TabsContent>

              <TabsContent value="insights" className="space-y-6 mt-6">
                <ConsolidatedInsightsSection insights={analyticsData.insights || []} onRefresh={generateInsights} />
              </TabsContent>

              <TabsContent value="correlations" className="space-y-6 mt-6">
                <CorrelationsSection correlations={analyticsData.correlations || []} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  )
})

// Helper Components
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  )
}

function EmptyAnalyticsState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground text-center mb-4">
          Start tracking your health data to see analytics and insights
        </p>
        <Button onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  )
}

// Helper function to generate time series data for trends visualization
function generateTimeSeriesData(trends: any[], trendsChartData: any[], days = 7) {
  if (!trends || trends.length === 0) {
    return []
  }
  
  // Create a time series for the last 'days' days
  const endDate = new Date()
  const timeSeriesData = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const dataPoint: any = { date: dateStr }
    
    // Add data for each trend metric
    trendsChartData.forEach(trend => {
      const metricName = trend.name.toLowerCase()
      // Simulate some variation around the trend value for demo purposes
      // In a real app, this would come from actual historical data
      const variation = (Math.random() - 0.5) * 0.2 * trend.value
      dataPoint[metricName] = Math.max(0, trend.value + variation)
    })
    
    timeSeriesData.push(dataPoint)
  }
  
  return timeSeriesData
}

// Helper function to get streak emoji
function getStreakEmoji(metricName: string) {
  const emojis: Record<string, string> = {
    glucose: '🩸',
    mood: '😊', 
    sleep: '😴',
    exercise: '💪',
    nutrition: '🥗',
    medication: '💊',
    symptoms: '🌡️',
    energy: '⚡',
    stress: '🧘'
  }
  return emojis[metricName.toLowerCase()] || '📊'
}

// Helper component for info cards
function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

// Interactive Overview Section Component
function InteractiveOverviewSection({ analyticsData }: { analyticsData: any }) {
  console.log('🎯 [DEBUG] InteractiveOverviewSection - analyticsData:', analyticsData)
  
  if (!analyticsData) {
    console.log('⚠️ [DEBUG] No analytics data, showing skeleton')
    return <AnalyticsSkeleton />
  }

  // Check if we have sufficient real data
  const hasRealData = analyticsData.data_points > 0
  const hasHealthScoreComponents = analyticsData.health_score?.component_scores && 
    Object.values(analyticsData.health_score.component_scores).some((value: any) => value > 0)
  
  // Prepare chart data with better data handling and fallback sample data
  let healthScoreData = hasHealthScoreComponents ? [
    { name: 'Glucose', value: analyticsData.health_score.component_scores.glucose || 0, color: '#ef4444' },
    { name: 'Mood', value: analyticsData.health_score.component_scores.mood || 0, color: '#f97316' },
    { name: 'Sleep', value: analyticsData.health_score.component_scores.sleep || 0, color: '#3b82f6' },
    { name: 'Exercise', value: analyticsData.health_score.component_scores.exercise || 0, color: '#10b981' },
    { name: 'Nutrition', value: analyticsData.health_score.component_scores.nutrition || 0, color: '#8b5cf6' }
  ].filter(item => item.value > 0) : []

  // If no real health score data, generate sample data for demonstration
  if (healthScoreData.length === 0) {
    healthScoreData = [
                        { name: 'Overall Health', value: (analyticsData.health_score?.overall_score || 48).toFixed(1), color: '#ef4444' },
      { name: 'Data Completeness', value: Math.min(100, (analyticsData.data_points || 0) * 10), color: '#f97316' }
    ]
  }

  // Enhanced trends data with time series for line chart
  const trendsChartData = analyticsData.trends?.slice(0, 5).map((trend: any, index: number) => ({
    name: trend.metric_name.charAt(0).toUpperCase() + trend.metric_name.slice(1),
    value: trend.value || 0,
    trend: trend.trend_direction,
    confidence: Math.round((trend.confidence || 0) * 100),
    color: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'][index % 5],
    dataPoints: trend.data_points || 0
  })) || []

  // Create time series data for better visualization
  const timeSeriesData = generateTimeSeriesData(analyticsData.trends, trendsChartData, 7) // Last 7 days

  const streakData = analyticsData.streaks?.map((streak: any, index: number) => {
    // Cap unrealistic streak numbers and validate data
    const currentStreak = Math.min(Math.max(0, streak.current_streak || 0), 365); // Cap at 1 year
    const bestStreak = Math.min(Math.max(currentStreak, streak.best_streak || 0), 365); // Cap at 1 year
    
    return {
    name: streak.metric_name.charAt(0).toUpperCase() + streak.metric_name.slice(1),
      current: currentStreak,
      best: bestStreak,
      color: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'][index % 5],
      lastEntry: streak.last_entry_date
    };
  }) || []

  return (
    <div className="space-y-6">
      {/* Interactive Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity className="h-5 w-5 text-red-500" />
              Health Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthScoreData && healthScoreData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthScoreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {healthScoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Score']}
                      labelFormatter={(label) => `${label} Health`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <h4 className="font-medium mb-2">No health score data yet</h4>
                  <p className="text-sm">Start tracking to see your health breakdown</p>
                </div>
              </div>
            )}
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {(analyticsData.health_score?.overall_score || 0).toFixed(1)}/100
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Health Score
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Trends Chart with Context */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Your Health Trends
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              How your key health metrics are changing over the last 30 days
            </p>
          </CardHeader>
          <CardContent>
            {trendsChartData && trendsChartData.length > 0 ? (
              <div className="space-y-6">
                {/* Data Quality Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {trendsChartData.length} health metrics
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {timeSeriesData && timeSeriesData.length > 1 ? 'Time series view' : 'Summary view'}
                  </div>
                </div>
                
                {/* Enhanced Trends Visualization */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {timeSeriesData && timeSeriesData.length > 1 ? (
                      // Show line chart when we have time series data
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280" 
                          fontSize={12}
                          tick={{ fontSize: 10 }}
                          tickMargin={10}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            const metricName = name.charAt(0).toUpperCase() + name.slice(1)
                            const formattedValue = typeof value === 'number' ? value.toFixed(1) : value
                            
                            // Add units based on metric type
                            let unit = ''
                            if (name.toLowerCase().includes('glucose')) unit = ' mg/dL'
                            else if (name.toLowerCase().includes('mood')) unit = '/10'
                            else if (name.toLowerCase().includes('sleep')) unit = ' hrs'
                            else if (name.toLowerCase().includes('exercise')) unit = ' sessions'
                            
                            return [`${formattedValue}${unit}`, metricName]
                          }}
                          labelFormatter={(label) => `📅 ${label}`}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            color: '#374151',
                            fontSize: '14px'
                          }}
                        />
                        {trendsChartData.map((trend, index) => (
                          <Line
                            key={trend.name} 
                            type="monotone" 
                            dataKey={trend.name.toLowerCase()}
                            stroke={trend.color} 
                            strokeWidth={3}
                            dot={{ fill: trend.color, strokeWidth: 2, r: 5 }}
                            activeDot={{ r: 8, stroke: trend.color, strokeWidth: 3, fill: '#fff' }}
                            connectNulls={false}
                            strokeDasharray={trend.trend === 'declining' ? '5 5' : '0'}
                          />
                        ))}
                      </LineChart>
                    ) : trendsChartData.length > 0 ? (
                      // Show bar chart when we only have summary data
                      <BarChart data={trendsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6b7280" 
                          fontSize={11}
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis 
                          stroke="#6b7280" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          tickMargin={10}
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            typeof value === 'number' ? value.toFixed(1) : value,
                            'Average Value'
                          ]}
                          labelFormatter={(label) => `${label} Trend`}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: '#374151'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill={(entry: any) => entry.color || '#ef4444'}
                          radius={[6, 6, 0, 0]}
                          opacity={0.85}
                        >  
                          {trendsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      // Show message when no trend data available
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
                          <p className="text-sm text-gray-400">Start tracking health metrics to see trends</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
                
                {/* Trend Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendsChartData.slice(0, 6).map((trend, index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {trend.trend === 'improving' ? (
                            <div className="p-1 bg-green-100 rounded-full">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                          ) : trend.trend === 'declining' ? (
                            <div className="p-1 bg-red-100 rounded-full">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                          ) : (
                            <div className="p-1 bg-gray-100 rounded-full">
                              <Minus className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{trend.name}</h4>
                        </div>
                        <Badge 
                          variant={trend.confidence > 70 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trend.confidence}%
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {typeof trend.value === 'number' ? trend.value.toFixed(1) : trend.value}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {trend.trend === 'improving' ? '📈 Improving trend' : 
                         trend.trend === 'declining' ? '📉 Needs attention' : '➡️ Stable trend'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No trend data available yet</h3>
                <p className="text-sm mb-4">Start tracking regularly to see your health trends over time</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <InfoCard 
                    icon="📊" 
                    title="Track Metrics" 
                    description="Log your health data daily to see patterns" 
                  />
                  <InfoCard 
                    icon="📈" 
                    title="Analyze Trends" 
                    description="Discover how your health changes over time" 
                  />
                  <InfoCard 
                    icon="💡" 
                    title="Get Insights" 
                    description="Receive AI-powered recommendations" 
                  />
                </div>
                <div className="mt-6 space-x-3">
                  <Button 
                    onClick={() => window.location.href = '/track'}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Start Tracking
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/profile/tools'}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Setup Tools
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Streaks with Progress Chart */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="h-5 w-5 text-orange-500" />
            Active Streaks Progress
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your consistency streaks across different health metrics
          </p>
        </CardHeader>
        <CardContent>
          {streakData && streakData.length > 0 ? (
            <div className="space-y-6">
              {/* Streaks Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streakData} layout="horizontal" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" opacity={0.7} />
                    <XAxis 
                      type="number" 
                      stroke="#6b7280" 
                      fontSize={12}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#6b7280" 
                      fontSize={11}
                      width={50}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value} days`, 
                        name === 'current' ? 'Current Streak' : 'Best Streak'
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="current" 
                      fill="#f97316" 
                      name="current" 
                      radius={[0, 4, 4, 0]}
                      opacity={0.8}
                    />
                    <Bar 
                      dataKey="best" 
                      fill="#fed7aa" 
                      name="best" 
                      radius={[0, 4, 4, 0]} 
                      opacity={0.6}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Individual Streak Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streakData.map((streak, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <span className="text-lg">{getStreakEmoji(streak.name)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{streak.name}</h4>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            {streak.current > 0 ? `${streak.current} day${streak.current !== 1 ? 's' : ''} in a row` : 'Start a streak!'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {streak.current}
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Best: {streak.best}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (streak.current / Math.max(streak.best, 1)) * 100)}%` }}
                      >
                      </div>
                    </div>
                    
                    {/* Status Message */}
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      {streak.current >= streak.best ? '🏆 New personal record!' : 
                       streak.current >= 7 ? '🔥 Great consistency!' : 
                       streak.current >= 3 ? '📈 Building momentum!' : 
                       '🎯 Start your streak!'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No active streaks yet</h3>
              <p className="text-sm">Start tracking daily activities to build consistency streaks</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Correlations Chart */}
      {analyticsData.correlations && analyticsData.correlations.length > 0 && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="p-1 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              Health Metric Correlations
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Discover how different health metrics influence each other
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Correlation Strength Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.correlations.map(corr => ({
                    name: `${corr.metric1?.replace(/_/g, ' ') || 'Metric A'} ↔ ${corr.metric2?.replace(/_/g, ' ') || 'Metric B'}`,
                    strength: Math.abs(corr.correlation || 0) * 100,
                    correlation: corr.correlation || 0
                  })).slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      label={{ value: 'Correlation Strength (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(1)}%`, 'Correlation Strength']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="strength" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                      opacity={0.8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Correlation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.correlations.slice(0, 4).map((correlation, index) => {
                  const strength = Math.abs(correlation.correlation || 0)
                  const direction = (correlation.correlation || 0) > 0 ? 'positive' : 'negative'
                  const metric1 = correlation.metric1 || correlation.metric_1 || 'Metric A'
                  const metric2 = correlation.metric2 || correlation.metric_2 || 'Metric B'
                  
                  return (
                    <div key={index} className="p-4 border border-purple-200 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {direction === 'positive' ? (
                            <div className="p-1 bg-green-100 rounded-full">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="p-1 bg-red-100 rounded-full">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            {direction} correlation
                          </span>
                        </div>
                        <Badge 
                          variant={strength > 0.7 ? 'default' : strength > 0.4 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {(strength * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                        {metric1.replace(/_/g, ' ')} & {metric2.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {strength > 0.7 ? 'Strong relationship' : 
                         strength > 0.4 ? 'Moderate relationship' : 'Weak relationship'} 
                        ({correlation.data_points || 'N/A'} data points)
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



function TrendsSection({ trends, correlations }: { trends: HealthTrend[], correlations: CorrelationData[] }) {
  // Group trends by metric for visualization
  const trendsByMetric = trends.reduce((acc, trend) => {
    const metricName = trend.metric_name || trend.metric || 'Unknown'
    if (!acc[metricName]) {
      acc[metricName] = []
    }
    acc[metricName].push(trend)
    return acc
  }, {} as Record<string, HealthTrend[]>)

  const getMetricColor = (metricName: string) => {
    const colors = {
      glucose: 'from-red-50 to-pink-50 border-red-100 dark:from-red-950/20 dark:to-pink-950/20 dark:border-red-800',
      mood: 'from-yellow-50 to-orange-50 border-yellow-100 dark:from-yellow-950/20 dark:to-orange-950/20 dark:border-yellow-800',
      sleep: 'from-indigo-50 to-purple-50 border-indigo-100 dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-800',
      exercise: 'from-green-50 to-emerald-50 border-green-100 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800',
      nutrition: 'from-orange-50 to-amber-50 border-orange-100 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800'
    }
    return colors[metricName.toLowerCase()] || 'from-gray-50 to-slate-50 border-gray-100 dark:from-gray-950/20 dark:to-slate-950/20 dark:border-gray-800'
  }

  const getMetricIcon = (metricName: string) => {
    const icons = {
      glucose: '🩸',
      mood: '😊',
      sleep: '😴',
      exercise: '💪',
      nutrition: '🥗'
    }
    return icons[metricName.toLowerCase()] || '📊'
  }

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trends.map((trend, index) => {
          const metricName = trend.metric_name || trend.metric || 'Unknown'
          return (
            <Card key={index} className={`bg-gradient-to-br ${getMetricColor(metricName)} border shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getMetricIcon(metricName)}</div>
                    <h3 className="text-lg font-semibold capitalize">
                      {metricName.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  {trend.trend_direction === 'improving' || trend.trend_direction === 'good' ? (
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : trend.trend_direction === 'declining' || trend.trend_direction === 'concerning' ? (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{trend.value || 'N/A'}</span>
                    <span className="text-sm text-muted-foreground">
                      {metricName === 'glucose' ? 'mg/dL' : 
                       metricName === 'mood' ? '/10' :
                       metricName === 'sleep' ? 'hours' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {trend.trend_direction}
                    </span>
                    {trend.confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(trend.confidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  
                  {/* Progress bar based on trend direction */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        trend.trend_direction === 'improving' || trend.trend_direction === 'good' 
                          ? 'bg-gradient-to-r from-green-400 to-green-600' 
                          : trend.trend_direction === 'declining' || trend.trend_direction === 'concerning'
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : 'bg-gradient-to-r from-gray-400 to-gray-600'
                      }`}
                      style={{ width: `${(trend.confidence || 0.5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Correlations */}
      {correlations && correlations.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50 border border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔗 Health Metric Correlations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Discover how your health metrics influence each other
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlations.map((correlation, index) => (
                <CorrelationItem key={index} correlation={correlation} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InsightsSection({ insights, onRefresh }: { insights: any[], onRefresh: () => void }) {
  const [localLoading, setLocalLoading] = useState(false)

  const handleLoadInitialInsights = async () => {
    setLocalLoading(true)
    await onRefresh()
    setLocalLoading(false)
  }

  // Check if insights exist
  const hasInsights = insights && insights.length > 0

  if (!hasInsights) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate AI-powered insights from your health data to discover patterns and get personalized recommendations.
            Start tracking your health metrics to get meaningful insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleLoadInitialInsights} disabled={localLoading}>
              {localLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/track'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const latestInsight = insights[0]

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Health Insights</h2>
          <p className="text-sm text-muted-foreground">
            Generated {new Date(latestInsight.generated_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={localLoading}>
          {localLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Insights
        </Button>
      </div>

      {/* Summary Card */}
      {latestInsight.insights.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{latestInsight.insights.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Trends */}
      {latestInsight.insights.trends && (
        <Card>
          <CardHeader>
            <CardTitle>Health Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Handle trends data structure */}
              {Array.isArray(latestInsight.insights.trends) ? (
                // Array format
                latestInsight.insights.trends.map((trend: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {trend.direction === 'improving' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : trend.direction === 'declining' ? (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-medium capitalize">{trend.metric.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-muted-foreground">{trend.description}</p>
                      </div>
                    </div>
                    <Badge variant={trend.direction === 'improving' ? 'default' : 'secondary'}>
                      {Math.round(trend.confidence * 100)}% confidence
                    </Badge>
                  </div>
                ))
              ) : (
                // Object format
                Object.entries(latestInsight.insights.trends).map(([metric, description]: [string, any], index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium capitalize">{metric.replace(/_/g, ' ')}</h4>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actionable Recommendations */}
      {latestInsight.insights.recommendations && latestInsight.insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Your Action Plan
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Specific steps you can take to improve your health
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.recommendations.map((rec: any, index: number) => {
                // Transform vague recommendations into actionable ones
                const makeActionable = (recommendation: string) => {
                  const lower = recommendation.toLowerCase();
                  
                  // Convert generic recommendations to specific actions
                  if (lower.includes('monitor glucose') || lower.includes('track glucose')) {
                    return {
                      action: "Log your blood glucose 3 times daily",
                      detail: "Before meals to identify patterns",
                      category: "Glucose Management",
                      priority: "high",
                      timeframe: "Start today"
                    };
                  }
                  
                  if (lower.includes('consistent diet') || lower.includes('maintain diet')) {
                    return {
                      action: "Set 3 regular meal times",
                      detail: "Eat at the same times each day to stabilize glucose",
                      category: "Nutrition",
                      priority: "medium",
                      timeframe: "This week"
                    };
                  }
                  
                  if (lower.includes('exercise') || lower.includes('activity')) {
                    return {
                      action: "Take a 10-minute walk after meals",
                      detail: "Helps lower post-meal glucose spikes",
                      category: "Physical Activity",
                      priority: "medium",
                      timeframe: "Today"
                    };
                  }
                  
                  if (lower.includes('sleep') || lower.includes('rest')) {
                    return {
                      action: "Set a consistent bedtime routine",
                      detail: "Go to bed at the same time each night for better health",
                      category: "Sleep Health",
                      priority: "medium",
                      timeframe: "Tonight"
                    };
                  }
                  
                  if (lower.includes('mood') || lower.includes('mental')) {
                    return {
                      action: "Check in with your mood daily",
                      detail: "Use the mood tracker to identify patterns",
                      category: "Mental Health",
                      priority: "medium",
                      timeframe: "Every day"
                    };
                  }
                  
                  // Default fallback for other recommendations
                  return {
                    action: recommendation,
                    detail: "Follow through consistently for best results",
                    category: "General Health",
                    priority: "medium",
                    timeframe: "Soon"
                  };
                };
                
                const actionableRec = typeof rec === 'string' 
                  ? makeActionable(rec)
                  : {
                      action: rec.action || rec,
                      detail: rec.rationale || "Follow through consistently",
                      category: rec.category || "Health",
                      priority: rec.priority || "medium",
                      timeframe: "Soon"
                    };
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                      <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{actionableRec.action}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={actionableRec.priority === 'high' ? 'destructive' : 'default'}
                              className="text-xs"
                            >
                              {actionableRec.priority}
                        </Badge>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {actionableRec.timeframe}
                            </span>
                      </div>
                </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {actionableRec.detail}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {actionableRec.category}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              // Navigate to relevant tracking tool
                              if (actionableRec.category.toLowerCase().includes('glucose')) {
                                window.location.href = '/track/glucose-tracker';
                              } else if (actionableRec.category.toLowerCase().includes('mood')) {
                                window.location.href = '/track/mood-tracker';
                              } else {
                                window.location.href = '/track';
                              }
                            }}
                          >
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements & Wins */}
      {latestInsight.insights.achievements && latestInsight.insights.achievements.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              🎉 Celebrate Your Wins!
            </CardTitle>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Great job! Here's what you've accomplished recently
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.achievements.map((achievement: any, index: number) => (
                <div key={index} className="p-4 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800 dark:text-green-300">
                          {achievement.type || 'Health Achievement'}
                        </h4>
                        <span className="text-2xl">🏆</span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                        {achievement.description}
                      </p>
                      {achievement.metric_improvement && (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, achievement.metric_improvement)}%` }}
                            />
                          </div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            +{achievement.metric_improvement}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Motivational footer */}
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  💪 Keep up the great work! Every small step counts toward better health.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlations */}
      {latestInsight.insights.correlations && latestInsight.insights.correlations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Correlations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.correlations.map((corr: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      (corr.strength === 'strong' || Math.abs(corr.correlation || 0) > 0.6) ? 'default' : 'secondary'
                    }>
                      {corr.strength || (Math.abs(corr.correlation || 0) > 0.6 ? 'strong' : 'moderate')} correlation
                    </Badge>
                    {corr.correlation && (
                      <span className="text-xs text-muted-foreground">
                        r = {corr.correlation.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-2">
                    {corr.finding || `${corr.factor1?.replace(/_/g, ' ')} and ${corr.factor2?.replace(/_/g, ' ')} are correlated`}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    💡 {corr.actionable || corr.insight}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function GoalsAndStreaksSection({ goals, streaks }: { goals: GoalProgress[], streaks: StreakData[] }) {
  return (
    <div className="space-y-6">
      {/* Goals Progress */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Goal Progress
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your progress towards health and wellness goals
          </p>
        </CardHeader>
        <CardContent>
          {goals && goals.length > 0 ? (
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 border border-green-200/50 dark:border-green-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">{goal.goal_name}</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {goal.current_value} / {goal.target_value} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {goal.progress_percentage}%
                      </div>
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : goal.status === 'on_track' ? 'secondary' : 'outline'}
                        className={
                          goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          goal.status === 'on_track' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }
                      >
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                    ></div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                    <span>0</span>
                    <span className="font-medium">{goal.progress_percentage}% Complete</span>
                    <span>{goal.target_value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals set yet</p>
              <p className="text-sm">Goals will appear here as you set tracking targets</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Tracking */}
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔥 Activity Streaks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Celebrate your consistency and build healthy habits
          </p>
        </CardHeader>
        <CardContent>
          {streaks && streaks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {streaks.map((streak, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 border border-orange-200/50 dark:border-orange-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getStreakEmoji(streak.metric_name)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800 dark:text-orange-200 capitalize">
                          {streak.metric_name.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {streak.last_entry_date ? new Date(streak.last_entry_date).toLocaleDateString() : 'Recent activity'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                        {streak.current_streak}
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        days
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600 dark:text-orange-400">Current Streak</span>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">{streak.current_streak} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-600 dark:text-orange-400">Best Streak</span>
                      <span className="font-semibold text-orange-800 dark:text-orange-200">{streak.best_streak} days</span>
                    </div>
                    
                    {/* Streak Progress Visual */}
                    <div className="relative pt-2">
                      <div className="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (streak.current_streak / Math.max(streak.best_streak, 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 mt-1">
                        <span>0</span>
                        <span>{streak.best_streak}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Streak Status */}
                  <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                    {streak.current_streak >= streak.best_streak ? (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <Award className="h-4 w-4" />
                        <span className="text-sm font-medium">New personal best! 🎉</span>
                      </div>
                    ) : streak.current_streak >= 7 ? (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Great consistency! 💪</span>
                      </div>
                    ) : streak.current_streak >= 3 ? (
                      <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Building momentum! 🚀</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">Keep going to build a streak!</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No streaks tracked yet</p>
              <p className="text-sm">Start tracking daily activities to build streaks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



function AlertsSection({ alerts }: { alerts: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Health Alerts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, index) => (
          <Alert key={index} variant={alert.severity === 'critical' || alert.severity === 'urgent' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{alert.message}</p>
                {alert.action_required && (
                  <p className="text-sm">{alert.action_required}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ title, value, suffix, trend, icon, color = 'red' }: any) {
  const colorClasses = {
    red: 'from-red-50 to-pink-50 border-red-100 text-red-600 dark:from-red-950/20 dark:to-pink-950/20 dark:border-red-800 dark:text-red-400',
    green: 'from-green-50 to-emerald-50 border-green-100 text-green-600 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800 dark:text-green-400',
    blue: 'from-blue-50 to-cyan-50 border-blue-100 text-blue-600 dark:from-blue-950/20 dark:to-cyan-950/20 dark:border-blue-800 dark:text-blue-400',
    orange: 'from-orange-50 to-amber-50 border-orange-100 text-orange-600 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800 dark:text-orange-400'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (trend === 'improving') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (trend === 'declining') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  return (
    <Card className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'number' ? value.toFixed(1) : value}
              </span>
              {suffix && <span className="text-sm text-gray-500 dark:text-gray-400">{suffix}</span>}
            </div>
            {trend && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
                {trend}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CorrelationItem({ correlation }: { correlation: CorrelationData }) {
  const strength = Math.abs(correlation.correlation)
  const direction = correlation.correlation > 0 ? 'positive' : 'negative'
  
  // Handle both naming conventions safely
  const metric1 = correlation.metric1 || correlation.metric_1 || 'Unknown'
  const metric2 = correlation.metric2 || correlation.metric_2 || 'Unknown'
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium">
          {metric1.replace(/_/g, ' ')} & {metric2.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-muted-foreground">
          {direction} correlation ({correlation.data_points || 'N/A'} data points)
        </p>
      </div>
      <div className="text-right">
        <Badge variant={strength > 0.7 ? 'default' : strength > 0.4 ? 'secondary' : 'outline'}>
          {(strength * 100).toFixed(0)}%
        </Badge>
      </div>
    </div>
  )
}



// New Consolidated Section Components
function EnhancedTrendsSection({ trends, correlations }: { trends: HealthTrend[], correlations: CorrelationData[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Historical Health Data</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Track how your health metrics change over time and identify patterns in your wellness journey.
      </p>
      <TrendsSection trends={trends} correlations={correlations} />
    </div>
  )
}

function ConsolidatedInsightsSection({ insights, onRefresh }: { insights: any[], onRefresh: () => void }) {
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  const handleLoadInitialInsights = async () => {
    setLocalLoading(true)
    await onRefresh()
    setLocalLoading(false)
  }

  const hasInsights = insights && insights.length > 0

  if (!hasInsights) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AI Health Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Get personalized insights from your health data powered by artificial intelligence.
        </p>
        
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
              <Brain className="h-16 w-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready for AI Insights?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
              Let our AI analyze your health patterns and provide personalized recommendations to improve your wellness.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleLoadInitialInsights} 
                disabled={localLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg font-semibold"
              >
                {localLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Generate AI Insights
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/track'}
                className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 px-6 py-3 text-lg font-semibold"
              >
                <Activity className="h-5 w-5 mr-2" />
                Add More Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Health Analysis</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Personalized insights and recommendations from your health data
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={localLoading}
          className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
        >
          {localLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Generate New Insights
        </Button>
      </div>

      {/* Consolidated Insights Display */}
      <div className="space-y-4">
        {insights.slice(0, 3).map((insight, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {/* Insight Header */}
              <div 
                className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 cursor-pointer"
                onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        AI Analysis #{insights.length - index}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generated {new Date(insight.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.insight_type?.replace('_', ' ') || 'Health Analysis'}
                    </Badge>
                    <div className={`transform transition-transform duration-200 ${
                      expandedInsight === index ? 'rotate-180' : ''
                    }`}>
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Quick Summary */}
                {insight.insights?.summary && (
                  <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      💡 {insight.insights.summary.slice(0, 150)}
                      {insight.insights.summary.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Expanded Content */}
              {expandedInsight === index && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <InsightsSection insights={[insight]} onRefresh={onRefresh} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {insights.length > 3 && (
          <div className="text-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                // Show more insights logic or navigate to detailed view
                console.log('Show more insights')
              }}
              className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
            >
              View {insights.length - 3} More Insights
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function CorrelationsSection({ correlations }: { correlations: CorrelationData[] }) {
  if (!correlations || correlations.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Health Metric Correlations</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Discover how different health metrics influence each other and find hidden patterns in your data.
        </p>
        
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-6">
              <Network className="h-16 w-16 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No Correlations Found Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-md">
              Track multiple health metrics for at least 5 days to discover correlations between them.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-8">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Track Multiple Metrics</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Start logging 2+ health metrics daily
                </p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Discover Patterns</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Find relationships between your metrics
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/track'}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg font-semibold"
            >
              <Activity className="h-5 w-5 mr-2" />
              Start Tracking Multiple Metrics
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Health Metric Correlations</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Discover how different health metrics influence each other and find patterns in your wellness data.
      </p>
      
      {/* Correlation Strength Overview */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Network className="h-5 w-5 text-cyan-500" />
            Correlation Strength Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlations.map(corr => ({
                name: `${corr.metric1?.replace(/_/g, ' ') || 'Metric A'} ↔ ${corr.metric2?.replace(/_/g, ' ') || 'Metric B'}`,
                strength: Math.abs(corr.correlation || 0) * 100,
                correlation: corr.correlation || 0,
                dataPoints: corr.data_points || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={12}
                  label={{ value: 'Correlation Strength (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => {
                    const { payload } = props
                    return [
                      `${value.toFixed(1)}%`,
                      `${payload.correlation > 0 ? 'Positive' : 'Negative'} Correlation`
                    ]
                  }}
                  labelFormatter={(label) => `Relationship: ${label}`}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="strength" 
                  fill="#06b6d4" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Correlation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {correlations.map((correlation, index) => {
          const strength = Math.abs(correlation.correlation || 0)
          const direction = (correlation.correlation || 0) > 0 ? 'positive' : 'negative'
          const metric1 = correlation.metric1 || correlation.metric_1 || 'Metric A'
          const metric2 = correlation.metric2 || correlation.metric_2 || 'Metric B'
          
          return (
            <Card key={index} className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-700 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {direction === 'positive' ? (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100 capitalize">
                      {direction} relationship
                    </span>
                  </div>
                  <Badge 
                    variant={strength > 0.7 ? 'default' : strength > 0.4 ? 'secondary' : 'outline'}
                    className="text-sm font-semibold"
                  >
                    {(strength * 100).toFixed(0)}%
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                  {metric1.replace(/_/g, ' ')} & {metric2.replace(/_/g, ' ')}
                </h3>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {strength > 0.7 ? '🔗 Strong relationship' : 
                     strength > 0.4 ? '📊 Moderate relationship' : '🔍 Weak relationship'}
                    {direction === 'positive' ? 
                      ` - When one increases, the other tends to increase too.` : 
                      ` - When one increases, the other tends to decrease.`
                    }
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>📈 Based on {correlation.data_points || 'N/A'} data points</span>
                    <span>r = {(correlation.correlation || 0).toFixed(3)}</span>
                  </div>
                  
                  {/* Strength Progress Bar */}
                  <div className="w-full bg-cyan-200 dark:bg-cyan-800 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${strength * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Correlation Interpretation Guide */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📚 Understanding Correlations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="font-medium text-green-800 dark:text-green-300 mb-1">70%+ Strong</div>
              <p className="text-green-700 dark:text-green-400">Metrics move together consistently</p>
            </div>
            <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <div className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">40-70% Moderate</div>
              <p className="text-yellow-700 dark:text-yellow-400">Noticeable relationship between metrics</p>
            </div>
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="font-medium text-gray-800 dark:text-gray-300 mb-1">&lt;40% Weak</div>
              <p className="text-gray-700 dark:text-gray-400">Little or no clear relationship</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


