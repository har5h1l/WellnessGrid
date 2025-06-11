"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp, useUser, useConditions } from "@/lib/store/enhanced-context"
import { AppLogo } from "@/components/app-logo"
import { ConditionIcon } from "@/components/condition-icon"
import { ArrowLeft, ChevronRight, Settings, FileText, Shield, Bell, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ProfilePage() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()

  const [name, setName] = useState(user?.name || "")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isReady) {
      actions.navigate("/profile")
    }
  }, [actions, isReady])

  useEffect(() => {
    if (user) {
      setName(user.name)
    }
  }, [user])

  // Show loading if context is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  const handleSaveName = () => {
    if (name.trim() && user) {
      actions.updateUser({ name: name.trim() })
      setIsEditing(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessGrid</h2>
          <p className="text-gray-600 mb-8">Please set up your profile to access your account</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <Image src="/images/character.png" alt="Profile" width={60} height={60} className="object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-600">
              Age: {user.age} • {user.gender}
            </p>
            {conditions.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">Managing: {conditions.map((c) => c.name).join(", ")}</p>
            )}
          </div>
        </div>

        {/* Profile Settings */}
        <Card className="wellness-card">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Profile Settings</h3>

            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <div className="flex space-x-2 mt-1">
                {isEditing ? (
                  <>
                    <Input
                      id="display-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 rounded-2xl"
                    />
                    <Button onClick={handleSaveName} className="wellness-button-primary">
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-full">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 p-2 bg-gray-50 rounded-2xl">{user.name}</div>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="icon" className="rounded-full">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Conditions */}
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

        {/* Health Information */}
        <Link href="/profile/health-info">
          <Card className="wellness-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="wellness-icon-container bg-blue-50">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="wellness-text-primary">Manage Health Information</h3>
                    <p className="wellness-text-secondary">Modify conditions, medications, goals</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* App Settings */}
        <Card className="wellness-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="wellness-icon-container bg-gray-50">
                  <Settings className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="wellness-text-primary">App Settings</h3>
                  <p className="wellness-text-secondary">Notifications, theme, language</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="wellness-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="wellness-icon-container bg-green-50">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="wellness-text-primary">Privacy & Security</h3>
                  <p className="wellness-text-secondary">Data sharing, account security</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="wellness-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="wellness-icon-container bg-purple-50">
                  <Bell className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="wellness-text-primary">Notifications</h3>
                  <p className="wellness-text-secondary">Manage alerts and reminders</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button variant="outline" className="w-full rounded-full">
          Sign Out
        </Button>
      </main>
    </div>
  )
}
