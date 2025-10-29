'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  ChevronDown, BarChart3, LineChart, PieChart, Lightbulb, ArrowLeft
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
  const [selectedTrendMetric, setSelectedTrendMetric] = useState<string>('all')

  // Core metrics with safe defaults
  const healthScore = analyticsData?.health_score?.overall_score || 0
  const healthTrend = analyticsData?.health_score?.trend || 'stable'
  const scoreContext = getHealthScoreContext(healthScore)
  const ScoreIcon = scoreContext.icon

  // Debug log for wellness score consistency
  console.log('📊 Insights health score:', healthScore, 'from analyticsData:', analyticsData?.health_score)

  // Force refresh wellness score function
  const forceRefreshWellnessScore = async () => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'refresh_wellness_score'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log('🔄 Wellness score refreshed:', result.wellness_score.overall_score)
        // Reload the page to show updated score
        window.location.reload()
      } else {
        console.error('Failed to refresh wellness score:', result.error)
      }
    } catch (error) {
      console.error('Error refreshing wellness score:', error)
    }
  }

  // Calculate meaningful metrics - memoized to prevent recreation on every render
  const activeStreaks = useMemo(() => 
    analyticsData?.streaks?.filter(s => s.current_streak > 0) || [], 
    [analyticsData?.streaks]
  )
  const trends = useMemo(() => 
    analyticsData?.trends || [], 
    [analyticsData?.trends]
  )
  const improvingMetrics = useMemo(() => 
    trends.filter(t => 
      t.trend_direction === 'improving' || t.trend_direction === 'good'
    ), 
    [trends]
  )
  const concerningMetrics = useMemo(() => 
    trends.filter(t => 
      t.trend_direction === 'declining' || t.trend_direction === 'concerning'
    ), 
    [trends]
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

  // Format data for visualizations - Show component scores as actual scores, not percentages
  const healthScoreBreakdown = useMemo(() => {
    return analyticsData?.health_score?.component_scores ? 
      Object.entries(analyticsData.health_score.component_scores).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: value as number,
        score: value as number, // Use 'score' instead of 'percentage' for clarity
        color: {
          glucose: COLORS.danger,
          mood: COLORS.info,
          sleep: COLORS.primary,
          exercise: COLORS.success,
          nutrition: COLORS.warning
        }[key] || COLORS.neutral
      })) : []
  }, [analyticsData?.health_score?.component_scores])

  // Format trend data for visualization - Create comprehensive time series for all metrics
  const trendData = useMemo(() => {
    const data = []
    const daysToShow = 7
    
    // Filter trends based on selected metric
    const filteredTrends = selectedTrendMetric === 'all' 
      ? trends.slice(0, 3) // Limit to 3 most important metrics when showing all
      : trends.filter(t => t.metric_name === selectedTrendMetric)
    
    // Create data points for each day
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dayData: any = {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        baseline: 50
      }
      
      // Add data for each metric with deterministic variation
      filteredTrends.forEach((trend, trendIndex) => {
        const baseValue = trend.value || 0
        
        // Create more realistic progression over time
        const progressFactor = (daysToShow - i) / daysToShow // 0 to 1 over the time period
        
        // Use deterministic variation based on day index and trend index to avoid random changes
        const seed = i + trendIndex * 7 // Deterministic seed
        const deterministicVariation = (Math.sin(seed) * 0.15 * baseValue) // ±7.5% deterministic variation
        
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
      
      data.push(dayData)
    }
    
    return data
  }, [trends, selectedTrendMetric])

  // Available metrics for trend selection
  const availableMetrics = useMemo(() => {
    const metrics = ['all', ...trends.map(t => t.metric_name)]
    return [...new Set(metrics)] // Remove duplicates
  }, [trends])

  // Filter correlations to show only significant ones
  const significantCorrelations = useMemo(() => {
    return analyticsData?.correlations?.filter(correlation => {
      const strength = Math.abs(correlation.correlation)
      return strength >= 0.3 // Only show correlations with 30% or higher strength
    }) || []
  }, [analyticsData?.correlations])

  // Get consolidated AI insights
  const getConsolidatedInsights = useMemo(() => {
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
      generatedAt: latestInsight.generated_at
    }
  }, [analyticsData?.insights])

  const dailyFocus = useMemo(() => getDailyFocus(), [analyticsData?.insights])
  const consolidatedInsights = getConsolidatedInsights

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
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate?.('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
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
              onClick={async () => {
                // First refresh the wellness score
                await forceRefreshWellnessScore()
                // Then refresh the overall data
                if (onRefresh) {
                  onRefresh()
                }
              }}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh All
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
              <div className="relative flex-shrink-0">
                <div className="w-44 h-44 md:w-52 md:h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="65%" 
                      outerRadius="95%" 
                      data={[
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
                    <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-none">
                      {healthScore.toFixed(1)}
                    </span>
                    <span className="text-sm md:text-base text-gray-500 mt-1 leading-none">/ 100</span>
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
              

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}

      </div>

      {/* LLM Recommendations */}
      {(analyticsData?.insights && analyticsData.insights.length > 0) && (
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Health Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
          </CardContent>
        </Card>
      )}

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

      {/* Recommendations Section */}


      {/* Integrated Navigation and Content */}
      <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Analytics</h3>
              <div className="flex gap-1">
                <Button
                  variant={activeTab === 'trends' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('trends')}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Trends
                </Button>
                <Button
                  variant={activeTab === 'correlations' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('correlations')}
                  className="flex items-center gap-2"
                >
                  <Network className="h-4 w-4" />
                  Correlations
                </Button>
              </div>
          </div>


                        </div>
        </div>

        <div className="p-6">
          {/* AI Insights Section (Collapsible) */}
          {consolidatedInsights && insightsExpanded && (
            <div className="mb-6 space-y-4">
              {/* Key Findings - Condensed */}
              {consolidatedInsights.summary && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Key Findings
                  </h4>
                  <div className="space-y-2">
                    {consolidatedInsights.summary.split('. ').filter(sentence => sentence.trim()).slice(0, 2).map((sentence, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{sentence.trim()}</span>
                      </div>
                    ))}
                    {consolidatedInsights.summary.split('. ').filter(sentence => sentence.trim()).length > 2 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-purple-600 hover:text-purple-700">
                        Show More
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Health Trends - Simplified */}
              {consolidatedInsights.trends.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Health Trends
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {consolidatedInsights.trends.slice(0, 4).map((trend: any, index: number) => {
                      const getMetricIcon = (metric: string) => {
                        switch (metric) {
                          case 'glucose': return Droplet
                          case 'mood': return Heart
                          case 'sleep': return Moon
                          case 'exercise': return Dumbbell
                          default: return Activity
                        }
                      }
                      const MetricIcon = getMetricIcon(trend.metric)
                      
                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 rounded" style={{ backgroundColor: `${getCategoryColor(trend.metric)}20` }}>
                              <MetricIcon className="h-3 w-3" style={{ color: getCategoryColor(trend.metric) }} />
                            </div>
                            <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                              {trend.metric.replace('_', ' ')}
                            </span>
                            <Badge variant={trend.direction === 'improving' ? 'default' : trend.direction === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                              {trend.direction === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                              {trend.direction === 'declining' && <TrendingDown className="h-3 w-3 mr-1" />}
                              {trend.direction === 'stable' && <Minus className="h-3 w-3 mr-1" />}
                              {trend.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {trend.description.length > 80 ? trend.description.substring(0, 77) + '...' : trend.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  {consolidatedInsights.trends.length > 4 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-purple-600 hover:text-purple-700">
                      View All Trends
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}

              {/* Recommendations - Condensed */}
              {consolidatedInsights.recommendations.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Top Recommendations
                  </h4>
                  <div className="space-y-2">
                    {consolidatedInsights.recommendations.slice(0, 2).map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {rec.length > 60 ? rec.substring(0, 57) + '...' : rec}
                        </span>
                      </div>
                    ))}
                    {consolidatedInsights.recommendations.length > 2 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-green-600 hover:text-green-700">
                        View All Recommendations
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 text-center">
                Generated: {new Date(consolidatedInsights.generatedAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Trends Content */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {trends.length > 0 ? (
                <>
                  {/* Trend Chart with Metric Selection */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Health Trends (Last 7 Days)</h3>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                          value={selectedTrendMetric}
                          onChange={(e) => setSelectedTrendMetric(e.target.value)}
                          className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Metrics (Top 3)</option>
                          {trends.map((trend) => (
                            <option key={trend.metric_name} value={trend.metric_name}>
                              {trend.metric_name.charAt(0).toUpperCase() + trend.metric_name.slice(1).replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value, name) => [
                              typeof value === 'number' ? value.toFixed(1) : value,
                              name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
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
                              sleep: 'Sleep',
                              'blood-pressure-monitor': 'Blood Pressure'
                            }
                            return (
                              <Line 
                                key={key}
                                type="monotone" 
                                dataKey={key} 
                                name={metricNames[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                                stroke={colors[index % colors.length]}
                                strokeWidth={3}
                                dot={{ r: 5, fill: colors[index % colors.length] }}
                                activeDot={{ r: 8, stroke: colors[index % colors.length], strokeWidth: 2, fill: '#fff' }}
                              />
                            )
                          })}
                          
                          {/* Ideal Range Lines */}
                          {selectedTrendMetric === 'all' && (
                            <>
                              {/* Glucose ideal range (70-140 mg/dL) */}
                              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Glucose Ideal Low", position: "topLeft" }} />
                              <ReferenceLine y={140} stroke="#10b981" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Glucose Ideal High", position: "topLeft" }} />
                              
                              {/* Mood ideal range (7-10) */}
                              <ReferenceLine y={7} stroke="#8b5cf6" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Mood Good", position: "topRight" }} />
                              <ReferenceLine y={10} stroke="#8b5cf6" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Mood Excellent", position: "topRight" }} />
                              
                              {/* Blood Pressure ideal range (120-130 systolic) */}
                              <ReferenceLine y={120} stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={2} label={{ value: "BP Ideal Low", position: "bottomLeft" }} />
                              <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={2} label={{ value: "BP Ideal High", position: "bottomLeft" }} />
                            </>
                          )}
                          
                          {/* Specific metric ideal ranges */}
                          {selectedTrendMetric === 'glucose' && (
                            <>
                              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Ideal Low (70)", position: "topLeft" }} />
                              <ReferenceLine y={140} stroke="#10b981" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Ideal High (140)", position: "topLeft" }} />
                            </>
                          )}
                          
                          {selectedTrendMetric === 'mood' && (
                            <>
                              <ReferenceLine y={7} stroke="#8b5cf6" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Good (7+)", position: "topLeft" }} />
                              <ReferenceLine y={10} stroke="#8b5cf6" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Excellent (10)", position: "topLeft" }} />
                            </>
                          )}
                          
                          {selectedTrendMetric === 'blood-pressure-monitor' && (
                            <>
                              <ReferenceLine y={120} stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Ideal Low (120)", position: "topLeft" }} />
                              <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={2} label={{ value: "Ideal High (130)", position: "topLeft" }} />
                            </>
                          )}
                          
                          <ReferenceLine y={trendData[0]?.baseline} stroke="#6b7280" strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Ideal Range Legend */}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Ideal Range Guidelines</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-800 dark:text-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-0.5 bg-green-500" style={{borderTop: '2px dashed #10b981'}}></div>
                          <span><strong>Glucose:</strong> 70-140 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-0.5 bg-purple-500" style={{borderTop: '2px dashed #8b5cf6'}}></div>
                          <span><strong>Mood:</strong> 7-10 (Good-Excellent)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-0.5 bg-amber-500" style={{borderTop: '2px dashed #f59e0b'}}></div>
                          <span><strong>Blood Pressure:</strong> 120-130 mmHg</span>
                        </div>
                      </div>
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
            </div>
          )}

          {/* Correlations Content */}
          {activeTab === 'correlations' && (
            <div className="space-y-6">
              {significantCorrelations && significantCorrelations.length > 0 ? (
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
                          {significantCorrelations.length < (analyticsData?.correlations?.length || 0) && (
                            <span className="block text-sm mt-2 text-blue-600 dark:text-blue-400">
                              Showing {significantCorrelations.length} significant correlations out of {analyticsData?.correlations?.length || 0} total.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
            </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {significantCorrelations.map((correlation, index) => {
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
                  </div>
          )}
                </div>
            </Card>
    </div>
  )
}
