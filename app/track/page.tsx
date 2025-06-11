"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useApp, useUser, useConditions } from "@/lib/store/enhanced-context"
import { AppSelectors } from "@/lib/store/selectors"
import { WellnessCircle } from "@/components/wellness-circle"
import { EmptyState } from "@/components/empty-state"
import { AppLogo } from "@/components/app-logo"
import { ConditionIcon } from "@/components/condition-icon"
import { ArrowLeft, Activity, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function TrackPage() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()

  useEffect(() => {
    if (isReady) {
      actions.navigate("/track")
    }
  }, [actions, isReady])

  // Show loading if context is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
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
          <p className="text-gray-600 mb-8">Please set up your profile to track your health</p>
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
            <h1 className="text-xl font-bold text-gray-900">Track & Data</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </header>

        <EmptyState
          title="No tracking data yet"
          description="Start logging your symptoms, moods, and medications to see your health trends over time."
          action={{
            label: "Go to Dashboard",
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
          <h1 className="text-xl font-bold text-gray-900">Track & Data</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Wellness Overview */}
        <div className="wellness-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Wellness Overview</h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>

          <div className="flex items-center justify-center mb-6">
            <WellnessCircle score={wellnessScore} size={150} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{recentSymptoms.length}</div>
              <div className="text-sm text-gray-600">Symptoms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{recentMoods.length}</div>
              <div className="text-sm text-gray-600">Mood Logs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{state.medicationLogs.length}</div>
              <div className="text-sm text-gray-600">Medications</div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Your Conditions</h3>
            {conditions.map((condition) => (
              <Card key={condition.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <ConditionIcon condition={condition.name} size={40} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{condition.name}</h4>
                      <p className="text-sm text-gray-600">{condition.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            condition.severity === "mild"
                              ? "bg-green-100 text-green-700"
                              : condition.severity === "moderate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {condition.severity}
                        </span>
                        <span className="text-xs text-gray-500">
                          Since {new Date(condition.diagnosedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Symptoms */}
        {recentSymptoms.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Symptoms</h3>
            {recentSymptoms.slice(0, 5).map((symptom) => (
              <Card key={symptom.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{symptom.type}</h4>
                        <p className="text-sm text-gray-600">
                          Severity: {symptom.severity}/10 • {new Date(symptom.date).toLocaleDateString()}
                        </p>
                        {symptom.notes && <p className="text-sm text-gray-500 mt-1">{symptom.notes}</p>}
                      </div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        symptom.severity <= 2
                          ? "bg-green-400"
                          : symptom.severity <= 5
                            ? "bg-yellow-400"
                            : symptom.severity <= 7
                              ? "bg-orange-400"
                              : "bg-red-400"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recent Moods */}
        {recentMoods.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Moods</h3>
            {recentMoods.slice(0, 3).map((mood) => (
              <Card key={mood.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                      <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 capitalize">{mood.mood.replace("-", " ")}</h4>
                      <p className="text-sm text-gray-600">
                        Energy: {mood.energy}/10 • Stress: {mood.stress}/10
                      </p>
                      <p className="text-sm text-gray-500">{new Date(mood.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/reports" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Detailed Reports</h4>
                <p className="text-xs text-gray-600">View comprehensive data</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Log New Data</h4>
                <p className="text-xs text-gray-600">Track symptoms & mood</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
