"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useApp, useUser, useConditions } from "@/lib/store/enhanced-context"
import { ConditionIcon } from "@/components/condition-icon"
import { ArrowLeft, Plus, ChevronRight, FileText, Pill, Target, Settings } from "lucide-react"
import Link from "next/link"

export default function HealthInfoPage() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()

  useEffect(() => {
    if (isReady) {
      actions.navigate("/profile/health-info")
    }
  }, [actions, isReady])

  if (!user) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">Please log in to access your health information</p>
          <Link href="/login">
            <Button className="wellness-button-primary">Log In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">Health Information</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Conditions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Conditions</h2>
            <Button className="wellness-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </Button>
          </div>

          {conditions.length === 0 ? (
            <Card className="wellness-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conditions added yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your health conditions to get personalized tracking and insights.
                </p>
                <Button className="wellness-button-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Condition
                </Button>
              </CardContent>
            </Card>
          ) : (
            conditions.map((condition) => (
              <Card key={condition.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ConditionIcon condition={condition.name} size={40} />
                      <div>
                        <h3 className="wellness-text-primary">{condition.name}</h3>
                        <p className="wellness-text-secondary">
                          Added on {new Date(condition.diagnosedDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
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
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Medications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Medications</h2>
            <Button className="wellness-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {state.medications.filter((m) => m.isActive).length === 0 ? (
            <Card className="wellness-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pill className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No medications added yet</h3>
                <p className="text-gray-600 mb-4">Add your medications to track adherence and get reminders.</p>
                <Button className="wellness-button-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Medication
                </Button>
              </CardContent>
            </Card>
          ) : (
            state.medications
              .filter((m) => m.isActive)
              .map((medication) => (
                <Card key={medication.id} className="wellness-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="wellness-icon-container bg-green-50">
                          <Pill className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <h3 className="wellness-text-primary">{medication.name}</h3>
                          <p className="wellness-text-secondary">
                            {medication.dosage}, {medication.frequency}
                          </p>
                          <p className="text-sm text-green-600">Adherence: {medication.adherence}%</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Health Goals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Health Goals</h2>
            <Button className="wellness-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>

          {state.goals.filter((g) => !g.completed).length === 0 ? (
            <Card className="wellness-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active goals</h3>
                <p className="text-gray-600 mb-4">Set health goals to stay motivated and track your progress.</p>
                <Button className="wellness-button-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Set Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            state.goals
              .filter((g) => !g.completed)
              .map((goal) => (
                <Card key={goal.id} className="wellness-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="wellness-icon-container bg-purple-50">
                          <Target className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="wellness-text-primary">{goal.title}</h3>
                          <p className="wellness-text-secondary">{goal.description}</p>
                          <div className="mt-2">
                            <div className="wellness-progress-bar">
                              <div
                                className="wellness-progress-value transition-all duration-500"
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-purple-600 mt-1">{goal.progress}% complete</p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        {/* Health Data */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Health Data</h2>

          <Link href="/health-records">
            <Card className="wellness-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="wellness-icon-container bg-blue-50">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="wellness-text-primary">Electronic Health Records</h3>
                      <p className="wellness-text-secondary">Import and manage your medical records</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="wellness-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="wellness-icon-container bg-purple-50">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="wellness-text-primary">Genetic Information</h3>
                    <p className="wellness-text-secondary">Upload genetic test results</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-full">
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>

          <Link href="/resources">
            <Card className="wellness-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="wellness-icon-container bg-orange-50">
                      <Settings className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="wellness-text-primary">Protocols & Guidelines</h3>
                      <p className="wellness-text-secondary">Access treatment protocols and educational resources</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
