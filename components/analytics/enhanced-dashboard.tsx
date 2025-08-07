'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Activity, TrendingUp, TrendingDown, Target, Brain, Calendar, ChevronRight,
  AlertTriangle, CheckCircle, Clock, Info, Heart, Pill, Moon, Dumbbell,
  Droplet, Apple, ArrowUp, ArrowDown, Minus, RefreshCw, MoreVertical,
  Plus, Sparkles, Trophy, Flame, Star, Award, Zap, Bell, Eye, ChevronUp,
  AlertCircle, CheckCircle2, XCircle, Timer, CalendarDays, Users,
  BookOpen, HelpCircle, Settings, Download, Share2, Filter, Search, Network,
  ChevronDown, BarChart3, LineChart, PieChart
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart,
  RadialBar, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts'
import { AnalyticsData } from '@/lib/database/types'

interface EnhancedDashboardProps {
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

export function EnhancedDashboard({ 
  analyticsData, 
  userId, 
  onRefresh,
  onNavigate,
  loading = false 
}: EnhancedDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('trends')
  const [insightsExpanded, setInsightsExpanded] = useState(false)

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
  
  // Get consolidated daily focus from insights
  const getDailyFocus = () => {
    const insights = analyticsData?.insights || []
    if (insights.length > 0) {
      const latestInsight = insights[0]
      const insightData = latestInsight.insights
      
      // Look for priority actions or recommendations
      if (insightData.priority_actions && insightData.priority_actions.length > 0) {
        const primaryAction = insightData.priority_actions[0]
        const secondaryAction = insightData.priority_actions[1]
        
        return {
          primary: {
            title: primaryAction.title || "Primary Focus",
            description: primaryAction.description || "Based on your recent health data analysis",
            category: primaryAction.category || 'general'
          },
          secondary: secondaryAction ? {
            title: secondaryAction.title || "Secondary Action",
            description: secondaryAction.description || "Additional health focus area",
            category: secondaryAction.category || 'general'
          } : null
        }
      }
      
      // Fallback to recommendations
      if (insightData.recommendations && insightData.recommendations.length > 0) {
        return {
          primary: {
            title: insightData.recommendations[0],
            description: "Based on your recent health data analysis",
            category: 'general'
          },
          secondary: insightData.recommendations[1] ? {
            title: insightData.recommendations[1],
            description: "Additional health focus area",
            category: 'general'
          } : null
        }
      }
    }
    
    // Default focus areas
    return {
      primary: {
        title: "Aim for 7-8 hours of sleep",
        description: "Based on your recent sleep data showing improved mood",
        category: 'sleep'
      },
      secondary: {
        title: "Monitor glucose levels consistently",
        description: "Continue tracking for better control",
        category: 'glucose'
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

  // Format trend data for visualization
  const trendData = trends.slice(0, 7).map(trend => {
    const value = trend.value || 0
    const baseline = {
      glucose: 100,
      mood: 5,
      sleep: 7,
      exercise: 3
    }[trend.metric_name] || 50

    return {
      date: new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      [trend.metric_name]: value,
      baseline: baseline
    }
  })

  // Get consolidated AI insights
  const getConsolidatedInsights = () => {
    const insights = analyticsData?.insights || []
    if (insights.length === 0) return null

    const latestInsight = insights[0]
    const insightData = latestInsight.insights

    return {
      summary: insightData.summary,
      trends: insightData.trends || [],
      concerns: insightData.concerns || [],
      recommendations: insightData.recommendations || [],
      achievements: insightData.achievements || [],
      generatedAt: latestInsight.generated_at,
      confidence: latestInsight.metadata?.confidence_score || 0
    }
  }

  const dailyFocus = getDailyFocus()
  const consolidatedInsights = getConsolidatedInsights()

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

      {/* Health Score + Quick Stats (Top Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Health Score Card */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Visual Health Score */}
              <div className="relative">
                <div className="w-40 h-40">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {healthScore}
                    </span>
                    <span className="text-sm text-gray-500">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Score Context and Breakdown */}
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

                {/* Enhanced Component Breakdown */}
                {healthScoreBreakdown.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Contributing Factors</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {healthScoreBreakdown.map((component, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: component.color }} />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {component.name}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {component.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Improving</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {improvingMetrics.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {improvingMetrics.length === 0 ? 'Keep tracking' : 'Great progress!'}
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
                {concerningMetrics.length === 0 ? 'All looking good!' : 'Areas for improvement'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.max(...activeStreaks.map(s => s.best_streak || 0), 0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {Math.max(...activeStreaks.map(s => s.best_streak || 0), 0) === 0 ? 'Start tracking!' : 'Personal record'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Streaks (Horizontal Cards) */}
      {activeStreaks.length > 0 && (
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Your Active Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStreaks.map((streak, index) => (
                <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
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
          </CardContent>
        </Card>
      )}

      {/* Today's Priority Action (Single, Prominent Card) */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Recommendation */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${getCategoryColor(dailyFocus.primary.category)}20` }}>
                  {React.createElement(getCategoryIcon(dailyFocus.primary.category), { 
                    className: "h-5 w-5", 
                    style: { color: getCategoryColor(dailyFocus.primary.category) } 
                  })}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {dailyFocus.primary.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {dailyFocus.primary.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Action */}
            {dailyFocus.secondary && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${getCategoryColor(dailyFocus.secondary.category)}20` }}>
                    {React.createElement(getCategoryIcon(dailyFocus.secondary.category), { 
                      className: "h-5 w-5", 
                      style: { color: getCategoryColor(dailyFocus.secondary.category) } 
                    })}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {dailyFocus.secondary.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {dailyFocus.secondary.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
          </div>
        </CardContent>
      </Card>

      {/* AI Insights (Collapsible Section) */}
      {consolidatedInsights && (
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <Collapsible open={insightsExpanded} onOpenChange={setInsightsExpanded}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    AI Health Insights
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(consolidatedInsights.confidence * 100)}% confidence
                    </Badge>
                    <ChevronDown className={`h-4 w-4 transition-transform ${insightsExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Key Findings */}
                {consolidatedInsights.summary && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Findings</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{consolidatedInsights.summary}</p>
                  </div>
                )}

                {/* Health Trends */}
                {consolidatedInsights.trends.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consolidatedInsights.trends.slice(0, 4).map((trend: any, index: number) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {trend.direction === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {trend.direction === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                          {trend.direction === 'stable' && <Minus className="h-4 w-4 text-blue-600" />}
                          <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                            {trend.metric.replace('_', ' ')}
                          </span>
                          <Badge variant={trend.direction === 'improving' ? 'default' : trend.direction === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                            {trend.direction}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{trend.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {consolidatedInsights.recommendations.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-600" />
                      Personalized Recommendations
                    </h4>
                    <div className="space-y-2">
                      {consolidatedInsights.recommendations.slice(0, 3).map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Generated: {new Date(consolidatedInsights.generatedAt).toLocaleDateString()} • 
                  Service: AI • 
                  Confidence: {Math.round(consolidatedInsights.confidence * 100)}%
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Detailed Metrics (Tabs for Trends, Correlations) */}
      <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200 dark:border-gray-800">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="trends"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trends
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
            {/* Trends Tab */}
            <TabsContent value="trends" className="mt-0 space-y-6">
              {trends.length > 0 ? (
                <>
                  {/* Trend Chart */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Health Metrics Over Time</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          {Object.keys(trendData[0] || {}).filter(key => key !== 'date' && key !== 'baseline').map((key, index) => (
                            <Line 
                              key={key}
                              type="monotone" 
                              dataKey={key} 
                              stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          ))}
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
                            variant={trend.trend_direction === 'improving' ? 'default' : 
                                   trend.trend_direction === 'declining' ? 'destructive' : 'secondary'}
                          >
                            {trend.trend_direction === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                            {trend.trend_direction === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
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
                                  {correlation.metric_1}
                                </span>
                                {isPositive ? (
                                  <ArrowUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {correlation.metric_2}
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
                                    <strong className="text-green-600">Positive correlation:</strong> When your {correlation.metric_1} improves, your {correlation.metric_2} tends to improve as well.
                                  </>
                                ) : (
                                  <>
                                    <strong className="text-red-600">Negative correlation:</strong> When your {correlation.metric_1} improves, your {correlation.metric_2} tends to decline.
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
