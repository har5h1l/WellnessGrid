"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useApp, useUser, useConditions } from "@/lib/store/enhanced-context"
import { WellnessCircle } from "@/components/wellness-circle"
import { GlitchText } from "@/components/glitch-text"
import { AppLogo } from "@/components/app-logo"
import { MoodTracker } from "@/components/mood-tracker"
import { SymptomTracker } from "@/components/symptom-tracker"
import { MedicationLogger } from "@/components/medication-logger"
import { Activity, Heart, Pill, MessageCircle, TrendingUp, Clock, Bell, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()
  const searchParams = useSearchParams()

  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [showMedicationLogger, setShowMedicationLogger] = useState(false)
  const [currentGreeting, setCurrentGreeting] = useState("")

  // Handle URL parameters for quick actions
  useEffect(() => {
    const action = searchParams.get("action")
    if (action && isReady) {
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
  }, [searchParams, isReady])

  useEffect(() => {
    if (isReady) {
      actions.navigate("/dashboard")
    }
  }, [actions, isReady])

  useEffect(() => {
    if (user) {
      const hour = new Date().getHours()
      const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
      const conditionContext = conditions.length > 0 ? `, let's check on your health` : ", ready to track your health?"
      setCurrentGreeting(`${timeGreeting}, ${user.name}${conditionContext}`)
    }
  }, [user, conditions])

  // Show loading state
  if (!isReady) {
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

  // Show setup prompt if user not found
  if (!user) {
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

  // Get today's data
  const todaySymptoms = state.symptoms.filter(
    (s) => s.date === new Date().toISOString().split("T")[0] && s.userId === user.id,
  )
  const todayMoods = state.moods.filter(
    (m) => m.date === new Date().toISOString().split("T")[0] && m.userId === user.id,
  )
  const todayMedicationLogs = state.medicationLogs.filter(
    (l) => l.date === new Date().toISOString().split("T")[0] && l.userId === user.id,
  )
  const unreadAlerts = state.alerts.filter((a) => !a.read && a.userId === user.id)

  // Calculate wellness score (simplified)
  const wellnessScore = 75 // This would be calculated based on recent data

  // Show errors if any
  const errors = state.errors || []
  const hasErrors = errors.length > 0

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
        {/* Error Display */}
        {hasErrors && (
          <Card className="wellness-card border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Issues detected</h4>
                  <div className="space-y-1 mt-1">
                    {errors.slice(0, 2).map((error) => (
                      <p key={error.id} className="text-sm text-red-700">
                        {error.message}
                      </p>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => actions.clearAllErrors()}
                    className="mt-2 text-red-700 border-red-300"
                  >
                    Dismiss All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="text-lg font-bold text-gray-900">{todaySymptoms.length}</div>
              <div className="text-xs text-gray-600">symptoms today</div>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-3 text-center">
              <Heart className="w-5 h-5 text-pink-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayMoods.length}</div>
              <div className="text-xs text-gray-600">mood entries</div>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-3 text-center">
              <Pill className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{todayMedicationLogs.length}</div>
              <div className="text-xs text-gray-600">meds taken</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
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
        {(todaySymptoms.length > 0 || todayMoods.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900">Today's activity</h3>

            {todaySymptoms.slice(0, 2).map((symptom) => (
              <Card key={symptom.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{symptom.type}</h4>
                        <p className="text-sm text-gray-600">Severity: {symptom.severity}/10</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{symptom.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {todayMoods.slice(0, 1).map((mood) => (
              <Card key={mood.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{mood.mood.replace("-", " ")}</h4>
                        <p className="text-sm text-gray-600">Energy: {mood.energy}/10</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{mood.time}</span>
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

          <Link href="/reports" className="w-full">
            <Card className="wellness-card hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900">Health Data</h4>
                <p className="text-xs text-gray-600">Detailed reports</p>
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
