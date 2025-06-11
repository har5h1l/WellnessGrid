"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/store/enhanced-context"
import { AppLogo } from "@/components/app-logo"
import { Heart, User, ChevronRight, ChevronLeft, Plus, Stethoscope, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const router = useRouter()
  const { state, actions, isReady } = useApp()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showConditionSelector, setShowConditionSelector] = useState(false)
  const [showGoalDetail, setShowGoalDetail] = useState(false)
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState("")

  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  })

  // Conditions state
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])

  // Goals state
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [goalDetails, setGoalDetails] = useState<{ [key: string]: string }>({})

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  // Show loading if context is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading setup...</p>
        </div>
      </div>
    )
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleConditionToggle = (conditionId: string) => {
    setSelectedConditions((prev) =>
      prev.includes(conditionId) ? prev.filter((id) => id !== conditionId) : [...prev, conditionId],
    )
  }

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const handleGoalDetailSave = (goal: string, detail: string) => {
    setGoalDetails((prev) => ({ ...prev, [goal]: detail }))
    setShowGoalDetail(false)
    setSelectedGoalForDetail("")
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      // Create user profile
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const user = {
        id: userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        weight: profile.weight,
        email: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: "light" as const,
          notifications: {
            medication: true,
            symptoms: true,
            mood: true,
            appointments: true,
            reminders: true,
          },
          privacy: {
            shareData: false,
            analytics: true,
            dataRetention: 365,
          },
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        emergencyContacts: [],
      }

      actions.setUser(user)

      // Add selected conditions
      selectedConditions.forEach((conditionId) => {
        const condition = conditions.find((c) => c.id === conditionId)
        if (condition) {
          // In a real app, this would call actions.addCondition
          console.log("Adding condition:", condition.name)
        }
      })

      // Add selected goals
      selectedGoals.forEach((goalTitle) => {
        // In a real app, this would call actions.addGoal
        console.log("Adding goal:", goalTitle, goalDetails[goalTitle] || "")
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      router.push("/dashboard")
    } catch (error) {
      console.error("Setup failed:", error)
      actions.setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const conditions = [
    { id: "asthma", name: "Asthma", icon: "🫁", description: "Chronic lung condition causing breathing difficulties" },
    {
      id: "diabetes1",
      name: "Type 1 Diabetes",
      icon: "🩸",
      description: "Autoimmune condition affecting insulin production",
    },
    {
      id: "diabetes2",
      name: "Type 2 Diabetes",
      icon: "🩸",
      description: "Metabolic disorder affecting how body uses insulin",
    },
    { id: "epilepsy", name: "Epilepsy", icon: "🧠", description: "Neurological disorder causing seizures" },
    {
      id: "arthritis",
      name: "Juvenile Arthritis",
      icon: "🦴",
      description: "Joint inflammation in children and teens",
    },
    { id: "ibd", name: "IBD/Crohn's", icon: "🫄", description: "Inflammatory bowel diseases" },
    { id: "celiac", name: "Celiac Disease", icon: "🍞", description: "Immune reaction to eating gluten" },
    { id: "other", name: "Other", icon: "❓", description: "Custom condition not listed" },
  ]

  const goals = [
    "Better medication adherence",
    "Improved symptom tracking",
    "Better sleep quality",
    "More physical activity",
    "Stress management",
    "Better communication with doctors",
    "Understanding my condition better",
    "Managing side effects",
  ]

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <AppLogo variant="icon" size="sm" />
        </div>
        <div className="text-sm text-gray-500">
          Step {step} of {totalSteps}
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-blue-50 mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Welcome to WellnessGrid</CardTitle>
                <p className="text-gray-600">Let's start by getting to know you</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">What's your name?</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="mt-1 rounded-2xl"
                  />
                </div>

                <div>
                  <Label htmlFor="age">How old are you?</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={profile.age}
                    onChange={(e) => handleProfileChange("age", e.target.value)}
                    className="mt-1 rounded-2xl"
                    min="13"
                    max="19"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    className="wellness-button-primary"
                    onClick={() => setStep(2)}
                    disabled={!profile.name || !profile.age}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Physical Info */}
          {step === 2 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-green-50 mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Tell us about yourself</CardTitle>
                <p className="text-gray-600">This helps us personalize your health journey</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="block mb-2">Gender</Label>
                  <RadioGroup
                    value={profile.gender}
                    onValueChange={(value) => handleProfileChange("gender", value)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-binary" id="non-binary" />
                      <Label htmlFor="non-binary">Non-binary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer-not" id="prefer-not" />
                      <Label htmlFor="prefer-not">Prefer not to say</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Height in cm"
                      value={profile.height}
                      onChange={(e) => handleProfileChange("height", e.target.value)}
                      className="mt-1 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Weight in kg"
                      value={profile.weight}
                      onChange={(e) => handleProfileChange("weight", e.target.value)}
                      className="mt-1 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="wellness-button-primary" onClick={() => setStep(3)} disabled={!profile.gender}>
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Health Conditions */}
          {step === 3 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-purple-50 mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Health Conditions</CardTitle>
                <p className="text-gray-600">Select the conditions you're managing</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Selected Conditions */}
                {selectedConditions.map((conditionId) => {
                  const condition = conditions.find((c) => c.id === conditionId)
                  return (
                    <Card key={conditionId} className="border border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{condition?.icon}</span>
                            <div>
                              <h4 className="font-medium">{condition?.name}</h4>
                              <p className="text-sm text-gray-600">{condition?.description}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleConditionToggle(conditionId)}>
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Add Condition Button */}
                <Card
                  className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-400 transition-colors"
                  onClick={() => setShowConditionSelector(true)}
                >
                  <CardContent className="p-6 text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Add Condition</p>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    className="wellness-button-primary"
                    onClick={() => setStep(4)}
                    disabled={selectedConditions.length === 0}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-orange-50 mx-auto mb-4">
                  <Settings className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl">Health Goals</CardTitle>
                <p className="text-gray-600">What would you like to focus on?</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Goals Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <span className="text-2xl mr-2">🎯</span>
                    Health Goals
                  </h3>
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div key={goal} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={goal}
                            checked={selectedGoals.includes(goal)}
                            onCheckedChange={() => handleGoalToggle(goal)}
                          />
                          <Label htmlFor={goal} className="text-sm">
                            {goal}
                          </Label>
                        </div>
                        {selectedGoals.includes(goal) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedGoalForDetail(goal)
                              setShowGoalDetail(true)
                            }}
                          >
                            Detail
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={handleComplete} disabled={loading} className="wellness-button-primary">
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Creating Your Dashboard
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Condition Selector Popup */}
          {showConditionSelector && (
            <div className="wellness-popup-overlay" onClick={() => setShowConditionSelector(false)}>
              <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Select Condition</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {conditions.map((condition) => (
                      <div
                        key={condition.id}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedConditions.includes(condition.id)
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-red-300"
                        }`}
                        onClick={() => {
                          handleConditionToggle(condition.id)
                          setShowConditionSelector(false)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{condition.icon}</span>
                          <div>
                            <h4 className="font-medium">{condition.name}</h4>
                            <p className="text-sm text-gray-600">{condition.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => setShowConditionSelector(false)} className="rounded-full">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Goal Detail Popup */}
          {showGoalDetail && (
            <div className="wellness-popup-overlay" onClick={() => setShowGoalDetail(false)}>
              <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Goal Details</h3>
                  <p className="text-gray-600 mb-4">{selectedGoalForDetail}</p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="goal-detail">Add specific details or targets for this goal:</Label>
                      <Textarea
                        id="goal-detail"
                        placeholder="e.g., Take medication at 8 AM and 8 PM daily, track side effects..."
                        className="mt-1 rounded-2xl"
                        defaultValue={goalDetails[selectedGoalForDetail] || ""}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setShowGoalDetail(false)} className="rounded-full">
                      Cancel
                    </Button>
                    <Button
                      className="wellness-button-primary"
                      onClick={() => {
                        const textarea = document.getElementById("goal-detail") as HTMLTextAreaElement
                        handleGoalDetailSave(selectedGoalForDetail, textarea.value)
                      }}
                    >
                      Save Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
