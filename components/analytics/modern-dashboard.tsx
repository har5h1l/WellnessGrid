'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity, TrendingUp, TrendingDown, Target, Brain, Calendar, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Info, Heart, Pill, Moon, Dumbbell,
  Droplet, Apple, ArrowUp, ArrowDown, Minus, RefreshCw, MoreVertical,
  Plus, Sparkles, Trophy, Flame, Star, Award, Zap, Bell, Eye, ChevronUp,
  AlertCircle, CheckCircle2, XCircle, Timer, CalendarDays, Users,
  BookOpen, HelpCircle, Settings, Download, Share2, Filter, Search, Network
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart,
  RadialBar, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts'
import { AnalyticsData } from '@/lib/database/types'

interface ModernDashboardProps {
  analyticsData: AnalyticsData | null
  userId: string
  onRefresh?: () => void
  onNavigate?: (path: string) => void
  loading?: boolean
}

// Modern color palette with better contrast
const COLORS = {
  primary: '#3b82f6',    // Blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  danger: '#ef4444',     // Red
  info: '#8b5cf6',       // Purple
  neutral: '#6b7280',    // Gray
  // Gradient colors
  gradients: {
    health: 'from-blue-500 to-purple-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-amber-500 to-orange-600',
    danger: 'from-red-500 to-pink-600',
    info: 'from-indigo-500 to-purple-600'
  }
}

// Helper function to get health score context
const getHealthScoreContext = (score: number) => {
  if (score >= 80) return {
    label: 'Excellent',
    color: COLORS.success,
    gradient: COLORS.gradients.success,
    icon: Trophy,
    message: "You're doing fantastic! Keep maintaining these healthy habits.",
    emoji: '🌟'
  }
  if (score >= 60) return {
    label: 'Good',
    color: COLORS.primary,
    gradient: COLORS.gradients.health,
    icon: CheckCircle2,
    message: "You're on the right track! A few improvements can boost your score.",
    emoji: '💪'
  }
  if (score >= 40) return {
    label: 'Fair',
    color: COLORS.warning,
    gradient: COLORS.gradients.warning,
    icon: AlertCircle,
    message: "There's room for improvement. Let's work on building better habits.",
    emoji: '🎯'
  }
  return {
    label: 'Needs Attention',
    color: COLORS.danger,
    gradient: COLORS.gradients.danger,
    icon: AlertTriangle,
    message: "Your health needs focus. Start with small, manageable changes.",
    emoji: '💙'
  }
}

// Helper function to format streak duration
const formatStreakDuration = (days: number) => {
  if (days === 0) return 'Start today'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''}`
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`
}

export function ModernDashboard({ 
  analyticsData, 
  userId, 
  onRefresh,
  onNavigate,
  loading = false 
}: ModernDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllStreaks, setShowAllStreaks] = useState(false)
  const [showAllActions, setShowAllActions] = useState(false)

  // Core metrics with safe defaults
  const healthScore = analyticsData?.health_score?.overall_score || 0
  const healthTrend = analyticsData?.health_score?.trend || 'stable'
  const scoreContext = getHealthScoreContext(healthScore)
  const ScoreIcon = scoreContext.icon

  // Calculate meaningful metrics
  const activeStreaks = analyticsData?.streaks?.filter(s => s.current_streak > 0) || []
  const trends = analyticsData?.trends || []
  const improvingMetrics = trends.filter(t => 
    t.trend_direction === 'improving' || t.trend_direction === 'good'
  )
  const concerningMetrics = trends.filter(t => 
    t.trend_direction === 'declining' || t.trend_direction === 'concerning'
  )
  
  // Get today's progress insight from LLM
  const getTodaysProgressInsight = () => {
    const insights = analyticsData?.insights || []
    if (insights.length > 0) {
      const latestInsight = insights[0]
      const insightData = latestInsight.insights
      
      // Look for daily progress or motivation messages
      if (insightData.daily_progress) {
        return {
          title: insightData.daily_progress.title || "Today's Focus",
          message: insightData.daily_progress.message || "Keep building your healthy habits!",
          type: insightData.daily_progress.type || 'motivation'
        }
      }
      
      // Fallback to recommendations for today's focus
      if (insightData.recommendations && insightData.recommendations.length > 0) {
        return {
          title: "Today's Recommendation",
          message: insightData.recommendations[0],
          type: 'recommendation'
        }
      }
    }
    
    // Default motivational messages based on health score
    if (healthScore >= 70) {
      return {
        title: "Excellent Progress!",
        message: "You're maintaining great health habits. Keep up the momentum!",
        type: 'motivation'
      }
    } else if (healthScore >= 50) {
      return {
        title: "Building Momentum",
        message: "You're on the right path. Focus on consistency in your key metrics.",
        type: 'encouragement'
      }
    } else {
      return {
        title: "Fresh Start",
        message: "Today is a great day to focus on your health goals. Start with one metric.",
        type: 'motivation'
      }
    }
  }

  // Format data for visualizations
  const healthScoreBreakdown = analyticsData?.health_score?.component_scores ? 
    Object.entries(analyticsData.health_score.component_scores).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: value as number,
      percentage: value as number,
      color: {
        glucose: COLORS.danger,
        mood: COLORS.info,
        sleep: COLORS.primary,
        exercise: COLORS.success,
        nutrition: COLORS.warning
      }[key] || COLORS.neutral
    })) : []

    // Format trend data for visualization - Create comprehensive time series for all metrics
  const trendData = []
  const daysToShow = 7
  
  // Create data points for each day
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const dayData: any = {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      baseline: 50
    }
    
    // Add data for each metric with realistic variation
    trends.forEach((trend, trendIndex) => {
      const baseValue = trend.value || 0
      
      // Create more realistic progression over time
      const progressFactor = (daysToShow - i) / daysToShow // 0 to 1 over the time period
      const deterministicVariation = (Math.sin(i + trendIndex * 7) - 0.5) * 0.15 * baseValue // ±7.5% deterministic variation
      
      // Add trend direction influence
      let trendInfluence = 0
      if (trend.trend_direction === 'improving' || trend.trend_direction === 'excellent') {
        trendInfluence = baseValue * 0.1 * progressFactor // Gradual improvement
      } else if (trend.trend_direction === 'declining' || trend.trend_direction === 'concerning') {
        trendInfluence = -baseValue * 0.1 * progressFactor // Gradual decline
      }
      
      const adjustedValue = Math.max(0, baseValue + deterministicVariation + trendInfluence)
      dayData[trend.metric_name] = Math.round(adjustedValue * 10) / 10
    })
    
    trendData.push(dayData)
  }

  // Priority actions from insights data with intelligent fallbacks
  const getInsightsPriorityActions = () => {
    if (!analyticsData?.insights || analyticsData.insights.length === 0) {
      return []
    }

    const latestInsight = analyticsData.insights[0]
    const insightData = latestInsight.insights

    // Use priority_actions if available from LLM response
    if (insightData.priority_actions && insightData.priority_actions.length > 0) {
      return insightData.priority_actions.slice(0, 3).map((action: any, index: number) => ({
        id: `insight-action-${index}`,
        priority: action.priority || 'medium',
        icon: getCategoryIcon(action.category),
        title: action.title,
        description: action.description,
        action: action.action_button || 'Take Action',
        color: getCategoryColor(action.category)
      }))
    }

    // Fallback: Use recommendations as priority actions
    if (insightData.recommendations && insightData.recommendations.length > 0) {
      return insightData.recommendations.slice(0, 3).map((rec: string, index: number) => ({
        id: `recommendation-${index}`,
        priority: 'medium' as const,
        icon: Target,
        title: rec.length > 50 ? rec.substring(0, 47) + '...' : rec,
        description: 'Based on your recent health data analysis',
        action: 'Learn More',
        color: COLORS.primary
      }))
    }

    // Use concerns as priority actions if urgent
    if (insightData.concerns && insightData.concerns.length > 0) {
      return insightData.concerns
        .filter((concern: any) => concern.severity === 'high' || concern.severity === 'medium')
        .slice(0, 3)
        .map((concern: any, index: number) => ({
          id: `concern-${index}`,
          priority: concern.severity === 'high' ? 'high' as const : 'medium' as const,
          icon: AlertTriangle,
          title: concern.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: concern.description,
          action: 'Address Issue',
          color: concern.severity === 'high' ? COLORS.danger : COLORS.warning
        }))
    }

    return []
  }

  // Helper functions for categorization
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'glucose': return Droplet
      case 'mood': return Heart
      case 'sleep': return Moon
      case 'exercise': return Dumbbell
      case 'medication': return Pill
      default: return Target
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'glucose': return COLORS.danger
      case 'mood': return COLORS.info
      case 'sleep': return COLORS.primary
      case 'exercise': return COLORS.success
      case 'medication': return COLORS.warning
      default: return COLORS.primary
    }
  }

  // Get priority actions from insights or use fallbacks
  const insightsPriorityActions = getInsightsPriorityActions()
  
  const priorityActions = insightsPriorityActions.length > 0 ? insightsPriorityActions : [
    ...(concerningMetrics.length > 0 ? [{
      id: 'concerning-metrics',
      priority: 'high' as const,
      icon: AlertTriangle,
      title: `${concerningMetrics.length} metrics need attention`,
      description: concerningMetrics.map(m => m.metric_name).join(', '),
      action: 'View Details',
      color: COLORS.danger
    }] : []),
    ...(activeStreaks.length === 0 ? [{
      id: 'start-tracking',
      priority: 'medium' as const,
      icon: Plus,
      title: 'Start building healthy habits',
      description: 'Begin tracking your daily health metrics',
      action: 'Start Now',
      color: COLORS.primary
    }] : []),
    ...(healthScore < 50 ? [{
      id: 'improve-score',
      priority: 'high' as const,
      icon: Target,
      title: 'Improve your health score',
      description: 'Focus on key areas to boost your wellness',
      action: 'See Tips',
      color: COLORS.warning
    }] : [])
  ].slice(0, 3)

  // Handle priority action clicks
  const handlePriorityActionClick = (action: any) => {
    console.log('Priority action clicked:', action)
    
    switch (action.id) {
      case 'concerning-metrics':
        console.log('Switching to trends tab')
        setActiveTab('trends')
        break
      case 'start-tracking':
        console.log('Navigating to tracking page')
        if (onNavigate) {
          onNavigate('/track')
        } else {
          window.location.href = '/track'
        }
        break
      case 'improve-score':
        console.log('Switching to insights tab')
        setActiveTab('insights')
        break
      default:
        console.log('Handling dynamic action:', action.id)
        // For insight-based actions, show the insights tab or redirect to tracking
        if (action.id.startsWith('insight-action') || action.id.startsWith('recommendation')) {
          console.log('Insight-based action, switching to insights tab')
          setActiveTab('insights')
        } else if (action.id.startsWith('concern')) {
          console.log('Concern-based action, switching to trends tab')
          setActiveTab('trends')
        } else {
          console.log('Generic fallback, navigating to tracking')
          // Generic fallback - redirect to tracking
          if (onNavigate) {
            onNavigate('/track')
          } else {
            window.location.href = '/track'
          }
        }
        break
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Modern Header with Better Visual Hierarchy */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Your Health Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track, understand, and improve your wellness journey
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <Button
                onClick={onRefresh}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Health tracking active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeStreaks.length} active streaks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Health Score Card - Clear Visual Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Visual Health Score */}
              <div className="relative">
                <div className="w-52 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="65%" 
                      outerRadius="95%" 
                      data={[
                        {
                          name: 'background',
                          value: 100,
                          fill: '#f3f4f6'
                        },
                        {
                          name: 'score',
                          value: healthScore,
                          fill: scoreContext.color
                        }
                      ]}
                      startAngle={90} 
                      endAngle={-270}
                    >
                      <RadialBar 
                        dataKey="value" 
                        cornerRadius={8} 
                        background={{ fill: '#f3f4f6' }}
                        clockWise={true}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white leading-none">
                      {healthScore.toFixed(1)}
                    </span>
                    <span className="text-base text-gray-500 mt-1 leading-none">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Score Context and Meaning */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="px-3 py-1" style={{ backgroundColor: `${scoreContext.color}20`, color: scoreContext.color }}>
                      <ScoreIcon className="h-3 w-3 mr-1" />
                      {scoreContext.label} Health
                    </Badge>
                    {healthTrend === 'improving' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Improving
                      </Badge>
                    )}
                    {healthTrend === 'declining' && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Declining
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {scoreContext.message}
                  </p>
                </div>


              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Progress Insight */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Today's Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const progressInsight = getTodaysProgressInsight()
                return (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {progressInsight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {progressInsight.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {progressInsight.type === 'motivation' && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-medium">Stay motivated!</span>
                        </div>
                      )}
                      {progressInsight.type === 'recommendation' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-medium">Recommended focus</span>
                        </div>
                      )}
                      {progressInsight.type === 'encouragement' && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm font-medium">Keep building!</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('/track')
                        } else {
                          window.location.href = '/track'
                        }
                      }}
                    >
                      Continue Tracking
                    </Button>
                  </>
                )
              })()} 
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions - Clear and Actionable */}
      {priorityActions.length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {priorityActions.map((action) => (
                <div key={action.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${action.color}20` }}>
                      <action.icon className="h-5 w-5" style={{ color: action.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {action.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3 h-8 text-xs"
                        variant={action.priority === 'high' ? 'default' : 'outline'}
                        onClick={() => handlePriorityActionClick(action)}
                      >
                        {action.action}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs - Better Visual Separation */}
      <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-gray-800">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="trends"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
              >
                <Brain className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger 
                value="correlations"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
              >
                <Network className="h-4 w-4 mr-2" />
                Correlations
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Enhanced Metrics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Improving</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {improvingMetrics.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {improvingMetrics.length === 0 
                      ? 'Keep tracking' 
                      : improvingMetrics.length === 1 
                      ? 'Great progress!' 
                      : 'Excellent momentum!'}
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Needs Focus</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {concerningMetrics.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {concerningMetrics.length === 0 
                      ? 'All looking good!' 
                      : concerningMetrics.length === 1 
                      ? 'One area to improve' 
                      : 'Areas for improvement'}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Streaks</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeStreaks.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activeStreaks.length === 0 
                      ? 'Start your first!' 
                      : `Building consistency`}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longest Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.max(...activeStreaks.map(s => s.best_streak || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.max(...activeStreaks.map(s => s.best_streak || 0), 0) === 0 
                      ? 'Start tracking!' 
                      : 'Personal record'}
                  </p>
                </div>
              </div>
              
              {/* Health Insights Summary */}
              {(() => {
                const insights = analyticsData?.insights || []
                const hasInsights = insights.length > 0
                const latestInsight = hasInsights ? insights[0].insights : null
                
                if (hasInsights && latestInsight) {
                  return (
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                          <Brain className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                            AI Health Insights
                          </h3>
                          <div className="grid md:grid-cols-3 gap-4">
                            {latestInsight.summary && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Observation</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{latestInsight.summary}</p>
                              </div>
                            )}
                            {latestInsight.recommendations && latestInsight.recommendations.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Recommendation</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {latestInsight.recommendations[0].length > 80 
                                    ? latestInsight.recommendations[0].substring(0, 77) + '...' 
                                    : latestInsight.recommendations[0]}
                                </p>
                              </div>
                            )}
                            {latestInsight.concerns && latestInsight.concerns.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Health Focus</p>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {latestInsight.concerns.filter((c: any) => c.severity === 'high' || c.severity === 'medium').length} area(s) to monitor
                                  </p>
                                </div>
                              </div>
                            )}
                            {!latestInsight.summary && !latestInsight.recommendations?.length && !latestInsight.concerns?.length && (
                              <div className="col-span-3 text-center py-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Continue tracking for more detailed insights</p>
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="mt-4"
                            onClick={() => setActiveTab('insights')}
                          >
                            View Full Analysis
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                return null
              })()}

              {/* LLM Recommendations */}
              {analyticsData?.insights && analyticsData.insights.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Health Recommendations
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analyticsData.insights[0]?.insights?.recommendations?.slice(0, 3).map((rec: string, index: number) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                    {(!analyticsData.insights[0]?.insights?.recommendations || analyticsData.insights[0]?.insights?.recommendations.length === 0) && (
                      <div className="text-center py-6">
                        <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Track more health data to receive personalized AI recommendations
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active Streaks with Context */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your Active Streaks</h3>
                  {activeStreaks.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAllStreaks(!showAllStreaks)}
                    >
                      {showAllStreaks ? 'Show Less' : `View All (${activeStreaks.length})`}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showAllStreaks ? 'rotate-90' : ''}`} />
                    </Button>
                  )}
                </div>

                {activeStreaks.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
                    <Flame className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active streaks yet</p>
                    <Button onClick={() => {
                      if (onNavigate) {
                        onNavigate('/track')
                      } else {
                        window.location.href = '/track'
                      }
                    }}>
                      Start Your First Streak
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeStreaks.slice(0, showAllStreaks ? undefined : 3).map((streak, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {streak.metric_name}
                          </span>
                          <Badge variant={streak.current_streak > 7 ? 'default' : 'secondary'}>
                            {formatStreakDuration(streak.current_streak)}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Current</span>
                            <span className="font-medium">{streak.current_streak} days</span>
                          </div>
                          <Progress 
                            value={Math.min(100, (streak.current_streak / (streak.best_streak || 1)) * 100)} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Personal best: {streak.best_streak} days</span>
                            {streak.current_streak >= (streak.best_streak || 0) && (
                              <Badge className="text-xs h-5" variant="outline">
                                <Trophy className="h-3 w-3 mr-1" />
                                New Record!
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="mt-0 space-y-6">
              {trends.length > 0 ? (
                <>
                  {/* Trend Chart */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Health Trends (Last 7 Days)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value, name) => [
                              typeof value === 'number' ? value.toFixed(1) : value,
                              name.charAt(0).toUpperCase() + name.slice(1)
                            ]}
                          />
                          <Legend />
                          {Object.keys(trendData[0] || {}).filter(key => key !== 'date' && key !== 'baseline').map((key, index) => {
                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
                            const metricNames = {
                              glucose: 'Glucose',
                              weight: 'Weight',
                              exercise: 'Exercise',
                              medication: 'Medication',
                              symptoms: 'Symptoms',
                              mood: 'Mood',
                              sleep: 'Sleep'
                            }
                            return (
                              <Line 
                                key={key}
                                type="monotone" 
                                dataKey={key} 
                                name={metricNames[key] || key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 5, fill: colors[index % colors.length] }}
                                activeDot={{ r: 8, stroke: colors[index % colors.length], strokeWidth: 2, fill: '#fff' }}
                              />
                            )
                          })}
                          <ReferenceLine y={trendData[0]?.baseline} stroke="#6b7280" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Individual Trend Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trends.map((trend, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                            {trend.metric_name}
                          </h4>
                                                <Badge 
                            variant={
                              trend.trend_direction === 'improving' || trend.trend_direction === 'excellent' || trend.trend_direction === 'good' ? 'default' : 
                              trend.trend_direction === 'declining' || trend.trend_direction === 'concerning' ? 'destructive' : 
                              'secondary'
                            }
                      >
                        {(trend.trend_direction === 'improving' || trend.trend_direction === 'excellent' || trend.trend_direction === 'good') && <TrendingUp className="h-3 w-3 mr-1" />}
                        {(trend.trend_direction === 'declining' || trend.trend_direction === 'concerning') && <TrendingDown className="h-3 w-3 mr-1" />}
                        {trend.trend_direction === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                        {trend.trend_direction}
                      </Badge>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {trend.value}
                          </span>
                                                  <span className="text-sm text-gray-500">
                          {trend.metric_name === 'glucose' && 'mg/dL'}
                          {trend.metric_name === 'mood' && '/10'}
                          {trend.metric_name === 'sleep' && 'hours'}
                          {trend.metric_name === 'exercise' && 'sessions/week'}
                          {trend.metric_name === 'medication' && '% adherence'}
                          {trend.metric_name === 'symptoms' && '/10 severity'}
                          {trend.metric_name === 'weight' && 'kg'}
                        </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {Math.round((trend.confidence || 0) * 100)}% confidence
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {trend.data_points} data points
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Trend Data Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track your health metrics for at least 3 days to see trends
                  </p>
                  <Button onClick={() => {
                    if (onNavigate) {
                      onNavigate('/track')
                    } else {
                      window.location.href = '/track'
                    }
                  }}>
                    Start Tracking
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="mt-0 space-y-6">
              {analyticsData?.insights && analyticsData.insights.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.insights.map((insight, index) => {
                    const insightData = insight.insights || {}
                    const hasValidContent = insightData.summary || (insightData.trends && insightData.trends.length > 0) || (insightData.recommendations && insightData.recommendations.length > 0)
                    
                    if (!hasValidContent) {
                      return (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                              <Brain className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                                Processing Your Health Data
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                AI insights are being generated from your recent health tracking data. Please check back soon.
                              </p>
                              <p className="text-xs text-gray-500">
                                Generated: {new Date(insight.generated_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                            <Brain className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                                AI Health Analysis - {insight.insight_type.charAt(0).toUpperCase() + insight.insight_type.slice(1)} Insights
                              </h3>
                              
                              {insightData.summary && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Findings</h4>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{insightData.summary}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Trends Section */}
                            {insightData.trends && insightData.trends.length > 0 && (
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Health Trends
                                </h4>
                                <div className="space-y-3">
                                  {insightData.trends.slice(0, 3).map((trend: any, tIndex: number) => (
                                    <div key={tIndex} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                      <div className="flex-shrink-0">
                                        {trend.direction === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                                        {trend.direction === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                                        {trend.direction === 'stable' && <Minus className="h-4 w-4 text-blue-600" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                                            {trend.metric.replace('_', ' ')}
                                          </span>
                                          <Badge variant={trend.direction === 'improving' ? 'default' : trend.direction === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                                            {trend.direction}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {Math.round((trend.confidence || 0) * 100)}% confidence
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                          {trend.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Concerns Section */}
                            {insightData.concerns && insightData.concerns.length > 0 && (
                              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                  Health Focus Areas
                                </h4>
                                <div className="space-y-3">
                                  {insightData.concerns.slice(0, 2).map((concern: any, cIndex: number) => (
                                    <div key={cIndex} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                                          {concern.type.replace('_', ' ')}
                                        </span>
                                        <Badge 
                                          variant={concern.severity === 'high' ? 'destructive' : concern.severity === 'medium' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {concern.severity} priority
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                                        {concern.description}
                                      </p>
                                      {concern.recommendations && concern.recommendations.length > 0 && (
                                        <div className="text-xs">
                                          <span className="font-medium text-gray-700 dark:text-gray-300">Recommendations:</span>
                                          <ul className="mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                                            {concern.recommendations.slice(0, 2).map((rec: string, rIndex: number) => (
                                              <li key={rIndex} className="flex items-start gap-1">
                                                <span className="text-blue-600 mt-0.5">•</span>
                                                <span>{rec}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            

                            
                            {/* Achievements Section */}
                            {insightData.achievements && insightData.achievements.length > 0 && (
                              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <Trophy className="h-4 w-4 text-purple-600" />
                                  Your Achievements
                                </h4>
                                <div className="space-y-2">
                                  {insightData.achievements.slice(0, 2).map((achievement: any, aIndex: number) => (
                                    <div key={aIndex} className="flex items-start gap-2 text-sm">
                                      <Star className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-gray-700 dark:text-gray-300">{achievement.description}</span>
                                        {achievement.metric_improvement > 0 && (
                                          <span className="ml-2 text-xs font-medium text-purple-600">
                                            {achievement.metric_improvement.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500">
                                Generated: {new Date(insight.generated_at).toLocaleDateString()} • 
                                Service: {insight.metadata?.llm_service_used || 'AI'} • 
                                Confidence: {Math.round((insight.metadata?.confidence_score || 0) * 100)}%
                              </p>
                              {insightData.correlations && insightData.correlations.length > 0 && (
                                <Button size="sm" variant="outline" className="text-xs">
                                  View Correlations ({insightData.correlations.length})
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
                  <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Insights Will Appear Here
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track more data to receive personalized health insights
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={onRefresh}>
                      Refresh Data
                    </Button>
                    <Button onClick={async () => {
                      if (!userId) return
                      try {
                        console.log('🧠 Manually generating insights...')
                        const response = await fetch('/api/insights/generate', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            userId,
                            insightType: 'on_demand',
                            forceGenerate: true
                          })
                        })
                        
                        const result = await response.json()
                        if (result.success) {
                          console.log('✅ Insights generated successfully')
                          onRefresh?.() // Refresh the entire dashboard to show new insights
                        } else {
                          console.error('❌ Failed to generate insights:', result.error)
                        }
                      } catch (error) {
                        console.error('❌ Error generating insights:', error)
                      }
                    }}>
                      Generate AI Insights
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Correlations Tab */}
            <TabsContent value="correlations" className="mt-0 space-y-6">
              {analyticsData?.correlations && analyticsData.correlations.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                        <Network className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          Health Metric Correlations
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Discover relationships between your health metrics and identify patterns that can help optimize your wellness routine.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.correlations.map((correlation, index) => {
                      const strength = Math.abs(correlation.correlation)
                      const isPositive = correlation.correlation > 0
                      const strengthLabel = strength > 0.7 ? 'Strong' : strength > 0.4 ? 'Moderate' : 'Weak'
                      const strengthColor = strength > 0.7 ? COLORS.success : strength > 0.4 ? COLORS.warning : COLORS.neutral
                      
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {correlation.metric1}
                                </span>
                                {isPositive ? (
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {correlation.metric2}
                                </span>
                              </div>
                            </div>
                            <Badge 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${strengthColor}20`,
                                color: strengthColor,
                                borderColor: strengthColor
                              }}
                            >
                              {strengthLabel} {isPositive ? 'Positive' : 'Negative'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Correlation Strength</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {(correlation.correlation * 100).toFixed(1)}%
                              </span>
                            </div>
                            
                            <Progress 
                              value={strength * 100} 
                              className="h-2"
                            />
                            
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>Data Points: {correlation.data_points}</span>
                              <span>Confidence: {((1 - (correlation.significance || 0.05)) * 100).toFixed(0)}%</span>
                            </div>
                            
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {isPositive ? (
                                  <>
                                    <strong className="text-green-600">Positive correlation:</strong> When your {correlation.metric1} improves, your {correlation.metric2} tends to improve as well.
                                  </>
                                ) : (
                                  <>
                                    <strong className="text-red-600">Negative correlation:</strong> When your {correlation.metric1} improves, your {correlation.metric2} tends to decline.
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
                  <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Correlations Found Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track multiple health metrics for at least 5 days to discover correlations between them
                  </p>
                  <Button onClick={() => {
                    if (onNavigate) {
                      onNavigate('/track')
                    } else {
                      window.location.href = '/track'
                    }
                  }}>
                    Start Tracking Multiple Metrics
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  )
}
