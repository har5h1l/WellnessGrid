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
  Clock
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

  useEffect(() => {
    if (userId) {
      loadAnalytics()
    }
  }, [userId, timeRange])

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
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      } catch (authError) {
        console.log('No auth session, will use mock data:', authError)
      }
      
      const response = await fetch(
        `/api/analytics?timeRange=${timeRange}&includeInsights=${includeInsights}`,
        { headers }
      )
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      
      const result = await response.json()
      setAnalyticsData(result.data)
      
      // Show a subtle indicator if using real vs mock data
      if (result.source === 'real') {
        console.log('✅ Using your real health data')
      } else {
        console.log('📊 Using sample data (no user data found)')
      }
      
    } catch (err) {
      console.error('Analytics loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [userId, timeRange, supabase])

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
        body: JSON.stringify({ insightType: 'on_demand' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }
      
      const result = await response.json()
      if (analyticsData && result.insights) {
        const updatedData = {
          ...analyticsData,
          insights: [result.insights, ...(analyticsData.insights || [])]
        }
        setAnalyticsData(updatedData)
        setActiveTab('insights') // Switch to insights tab
      }
      await loadAnalytics(true) // Reload analytics to get fresh insights
    } catch (err) {
      console.error('Insights generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setRefreshing(false)
    }
  }, [analyticsData, supabase, setActiveTab])

  // Memoized mock data function for sample analytics - MOVED BEFORE EARLY RETURNS
  const getMockAnalyticsData = useMemo(() => (includeInsights: boolean) => {
    return {
      trends: [
        { metric_name: 'glucose', trend_direction: 'stable', value: 120, confidence: 0.8, data_points: 15 },
        { metric_name: 'mood', trend_direction: 'improving', value: 7, confidence: 0.9, data_points: 12 },
        { metric_name: 'sleep', trend_direction: 'good', value: 7.5, confidence: 0.85, data_points: 18 }
      ],
      correlations: [
        { metric_1: 'sleep', metric_2: 'mood', correlation: 0.7, significance: 0.05, data_points: 25 }
      ],
      health_score: {
        overall_score: 78,
        trend: 'improving',
        component_scores: {
          glucose: 85,
          mood: 75,
          sleep: 80
        }
      },
      insights: includeInsights ? [
        {
          id: 'insight_1',
          insight_type: 'weekly',
          generated_at: new Date().toISOString(),
          insights: {
            summary: 'Your health metrics show positive trends this week with consistent sleep and mood improvements.',
            trends: [
              {
                metric: 'mood',
                direction: 'improving',
                description: 'Your mood ratings have increased by 15% over the past week',
                confidence: 0.9
              }
            ],
            recommendations: [
              {
                category: 'exercise',
                priority: 'medium',
                action: 'Increase morning walks to 30 minutes to boost mood further',
                rationale: 'Exercise correlates with improved mood in your data'
              }
            ],
            achievements: [
              {
                type: 'Sleep Consistency',
                description: 'Maintained 7+ hours of sleep for 6 consecutive days'
              }
            ],
            correlations: [
              {
                finding: 'Better sleep quality strongly correlates with higher mood ratings',
                strength: 'strong',
                actionable: 'Continue prioritizing sleep hygiene'
              }
            ]
          }
        }
      ] : [],
      alerts: [],
      goals: [
        {
          goal_id: 'glucose-consistency',
          goal_name: 'Daily glucose tracking',
          target_value: 30,
          current_value: 15,
          progress_percentage: 50,
          status: 'on_track'
        }
      ],
      streaks: [
        { metric_name: 'exercise', current_streak: 5, best_streak: 12 }
      ],
      data_points: 25,
      source: 'mock'
    }
  }, [])

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
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-xl">
                  <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Health Analytics
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
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

      {/* Smart Summary Bar - Show if we have meaningful data or mock data */}
      {analyticsData && (analyticsData.data_points > 0 || analyticsData.source === 'mock') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            title="Health Score"
            value={analyticsData.health_score?.overall_score || 0}
            suffix="/100"
            trend={analyticsData.health_score?.trend || 'stable'}
            icon={<Activity className="h-4 w-4" />}
            color="red"
          />
          
          <MetricCard
            title="Active Trends"
            value={analyticsData.trends?.length || 0}
            suffix={` metrics`}
            icon={<TrendingUp className="h-4 w-4" />}
            color="green"
          />
          
          <MetricCard
            title="Active Streaks"
            value={analyticsData.streaks?.length || 0}
            suffix={` ongoing`}
            icon={<Award className="h-4 w-4" />}
            color="orange"
          />
          
          <MetricCard
            title="Data Points"
            value={analyticsData.data_points || 0}
            suffix=" this period"
            icon={<Calendar className="h-4 w-4" />}
            color="blue"
          />
        </div>
      )}

      {/* No Data State */}
      {(!analyticsData || (analyticsData.data_points === 0 && analyticsData.source !== 'mock')) && (
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full mb-4">
              <Activity className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Start Your Health Journey</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              Track your health metrics using our tools to see personalized analytics, trends, and insights here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => window.location.href = '/track'} 
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6"
              >
                <Activity className="h-4 w-4 mr-2" />
                Start Tracking
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const mockData = getMockAnalyticsData(false)
                  mockData.source = 'mock'
                  setAnalyticsData(mockData)
                  setActiveTab('overview')
                }}
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl px-6"
              >
                <Brain className="h-4 w-4 mr-2" />
                View Sample Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {analyticsData?.alerts && analyticsData.alerts.length > 0 && (
        <AlertsSection alerts={analyticsData.alerts} />
      )}

      {/* Enhanced Tabs - Only show if we have data or showing sample */}
      {analyticsData && (analyticsData.data_points > 0 || analyticsData.source === 'mock') && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200 rounded-lg"
            >
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200 rounded-lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200 rounded-lg"
            >
              <Brain className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="goals"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all duration-200 rounded-lg"
            >
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <InteractiveOverviewSection analyticsData={analyticsData} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <TrendsSection trends={analyticsData.trends} correlations={analyticsData.correlations} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <InsightsSection insights={analyticsData.insights} onRefresh={generateInsights} />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalsAndStreaksSection 
              goals={analyticsData.goals} 
              streaks={analyticsData.streaks} 
            />
          </TabsContent>
        </Tabs>
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

// Interactive Overview Section Component
function InteractiveOverviewSection({ analyticsData }: { analyticsData: any }) {
  console.log('🎯 [DEBUG] InteractiveOverviewSection - analyticsData:', analyticsData)
  
  if (!analyticsData) {
    console.log('⚠️ [DEBUG] No analytics data, showing skeleton')
    return <AnalyticsSkeleton />
  }

  // Prepare chart data
  const healthScoreData = analyticsData.health_score?.component_scores ? [
    { name: 'Glucose', value: analyticsData.health_score.component_scores.glucose || 0, color: '#ef4444' },
    { name: 'Mood', value: analyticsData.health_score.component_scores.mood || 0, color: '#f97316' },
    { name: 'Sleep', value: analyticsData.health_score.component_scores.sleep || 0, color: '#3b82f6' },
    { name: 'Exercise', value: analyticsData.health_score.component_scores.exercise || 0, color: '#10b981' },
    { name: 'Nutrition', value: analyticsData.health_score.component_scores.nutrition || 0, color: '#8b5cf6' }
  ].filter(item => item.value > 0) : []

  const trendsChartData = analyticsData.trends?.slice(0, 5).map((trend: any, index: number) => ({
    name: trend.metric_name.charAt(0).toUpperCase() + trend.metric_name.slice(1),
    value: trend.value || 0,
    trend: trend.trend_direction,
    confidence: Math.round((trend.confidence || 0) * 100),
    color: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'][index % 5]
  })) || []

  const streakData = analyticsData.streaks?.map((streak: any, index: number) => ({
    name: streak.metric_name.charAt(0).toUpperCase() + streak.metric_name.slice(1),
    current: streak.current_streak || 0,
    best: streak.best_streak || 0,
    color: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'][index % 5]
  })) || []

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
                    formatter={(value: any) => [`${value}%`, 'Score']}
                    labelFormatter={(label) => `${label} Health`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {analyticsData.health_score?.overall_score || 0}/100
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Health Score
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Trends Chart */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Current Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value}`, 
                      `${props.payload.trend} (${props.payload.confidence}% confidence)`
                    ]}
                    labelFormatter={(label) => `${label} Trend`}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f9fafb'
                    }}
                  />
                  <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaks Progress */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="h-5 w-5 text-orange-500" />
            Active Streaks Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={80} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value} days`, 
                    name === 'current' ? 'Current Streak' : 'Best Streak'
                  ]}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Bar dataKey="current" fill="#10b981" name="current" radius={[0, 4, 4, 0]} />
                <Bar dataKey="best" fill="#6b7280" name="best" radius={[0, 4, 4, 0]} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-red-500">{analyticsData.data_points || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Data Points</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-500">{analyticsData.trends?.length || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Trends</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-500">{analyticsData.streaks?.length || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Streaks</div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-500">{analyticsData.insights?.length || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Recent Insights</div>
        </div>
      </div>
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

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate AI-powered insights from your health data to discover patterns and get personalized recommendations
          </p>
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
      {latestInsight.insights.trends && latestInsight.insights.trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.trends.map((trend: any, index: number) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {latestInsight.insights.recommendations && latestInsight.insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.recommendations.map((rec: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{rec.category}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{rec.action}</p>
                  <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {latestInsight.insights.achievements && latestInsight.insights.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestInsight.insights.achievements.map((achievement: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h4 className="font-medium">{achievement.type}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
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
                    <Badge variant={corr.strength === 'strong' ? 'default' : 'secondary'}>
                      {corr.strength} correlation
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{corr.finding}</p>
                  <p className="text-xs text-muted-foreground font-medium">💡 {corr.actionable}</p>
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

function getStreakEmoji(metricName: string): string {
  const emojis = {
    glucose: '🩸',
    mood: '😊',
    sleep: '😴',
    exercise: '💪',
    nutrition: '🥗',
    hydration: '💧',
    medication: '💊',
    symptoms: '📋'
  }
  return emojis[metricName.toLowerCase()] || '📊'
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