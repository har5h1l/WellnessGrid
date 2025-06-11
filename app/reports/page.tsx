"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useApp, useUser } from "@/lib/store/enhanced-context"
import { AppSelectors } from "@/lib/store/selectors"
import { EmptyState } from "@/components/empty-state"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const { state, actions, isReady } = useApp()
  const user = useUser()

  useEffect(() => {
    if (isReady) {
      actions.navigate("/reports")
    }
  }, [actions, isReady])

  // Show loading if context is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessGrid</h2>
          <p className="text-gray-600 mb-8">Please set up your profile to view health reports</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get data using selectors
  const recentSymptoms = AppSelectors.getRecentSymptoms(state, 30)
  const recentMoods = AppSelectors.getRecentMoods(state, 30)
  const wellnessScore = AppSelectors.getCurrentWellnessScore(state)
  const symptomStats = AppSelectors.getSymptomStats(state, 30)
  const medicationStats = AppSelectors.getMedicationAdherenceStats(state)

  // Check if there's enough data to show
  const hasData = recentSymptoms.length > 0 || recentMoods.length > 0

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
            <h1 className="text-xl font-bold text-gray-900">Health Reports</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </header>

        <EmptyState
          title="No data to report yet"
          description="Start tracking your health to generate detailed reports and insights about your condition."
          action={{
            label: "Start Tracking",
            href: "/dashboard",
          }}
          className="mt-12"
        />
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
          <h1 className="text-xl font-bold text-gray-900">Health Reports</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{wellnessScore}%</div>
              <div className="text-sm text-gray-600">Wellness Score</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{recentSymptoms.length}</div>
              <div className="text-sm text-gray-600">Symptoms Logged</div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </CardContent>
          </Card>
        </div>

        {/* Symptom Statistics */}
        {symptomStats.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Top Symptoms</h3>
            {symptomStats.slice(0, 5).map((stat, index) => (
              <Card key={stat.type} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{stat.type}</h4>
                        <p className="text-sm text-gray-600">
                          {stat.count} occurrences • Avg severity: {stat.avgSeverity.toFixed(1)}/10
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        stat.avgSeverity <= 3 ? "bg-green-400" : stat.avgSeverity <= 6 ? "bg-yellow-400" : "bg-red-400"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Medication Adherence */}
        {medicationStats.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Medication Adherence</h3>
            {medicationStats.map((stat) => (
              <Card key={stat.medication} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{stat.medication}</h4>
                    <span
                      className={`font-bold ${
                        stat.adherence >= 90
                          ? "text-green-600"
                          : stat.adherence >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {Math.round(stat.adherence)}%
                    </span>
                  </div>
                  <div className="wellness-progress-bar">
                    <div
                      className="wellness-progress-value transition-all duration-500"
                      style={{ width: `${stat.adherence}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {stat.actual} of {stat.expected} doses taken (last 7 days)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mood Trends */}
        {recentMoods.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Mood Trends</h3>
            <Card className="wellness-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(recentMoods.reduce((sum, m) => sum + m.energy, 0) / recentMoods.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Energy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(recentMoods.reduce((sum, m) => sum + m.stress, 0) / recentMoods.length).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Stress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{recentMoods.length}</div>
                    <div className="text-sm text-gray-600">Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/track" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">View Trends</h4>
                <p className="text-xs text-gray-600">See detailed tracking</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Add Data</h4>
                <p className="text-xs text-gray-600">Log new entries</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
