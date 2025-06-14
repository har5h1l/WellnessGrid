"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useApp, useUser } from "@/lib/store/enhanced-context"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Bell, Clock, Pill, Heart, Calendar, AlertCircle, CheckCircle } from "lucide-react"

export default function NotificationsPage() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const [notificationSettings, setNotificationSettings] = useState({
    medication: true,
    symptoms: true,
    mood: true,
    appointments: true,
    reminders: true,
    insights: false,
  })

  useEffect(() => {
    if (isReady) {
      actions.navigate("/notifications")
    }
  }, [actions, isReady])

  // Mock notifications for demonstration
  const recentNotifications = [
    {
      id: "1",
      type: "medication",
      title: "Time for your medication",
      message: "Take your Albuterol inhaler (2 puffs)",
      time: "8:00 AM",
      isRead: false,
      priority: "high" as const,
    },
    {
      id: "2",
      type: "reminder",
      title: "Daily symptom check",
      message: "Don't forget to log how you're feeling today",
      time: "Yesterday",
      isRead: true,
      priority: "medium" as const,
    },
    {
      id: "3",
      type: "insight",
      title: "Weekly insight",
      message: "Your symptoms seem to be improving this week!",
      time: "2 days ago",
      isRead: true,
      priority: "low" as const,
    },
    {
      id: "4",
      type: "appointment",
      title: "Upcoming appointment",
      message: "Doctor visit tomorrow at 2:00 PM",
      time: "3 days ago",
      isRead: false,
      priority: "high" as const,
    },
  ]

  const handleSettingChange = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "medication":
        return <Pill className="w-5 h-5 text-blue-500" />
      case "symptoms":
        return <Heart className="w-5 h-5 text-red-500" />
      case "appointment":
        return <Calendar className="w-5 h-5 text-green-500" />
      case "reminder":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "insight":
        return <CheckCircle className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <AppLogo size="lg" className="mb-4" />
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading notifications...</p>
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
          <p className="text-gray-600 mb-8">Please set up your profile to manage notifications</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      <header className="wellness-header">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <AppLogo />
        <div className="w-8" /> {/* Spacer */}
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Manage your health reminders and alerts</p>
        </div>

        {/* Notification Settings */}
        <Card className="wellness-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Medication Reminders</h4>
                <p className="text-sm text-gray-600">Get notified when it's time to take your medication</p>
              </div>
              <Switch
                checked={notificationSettings.medication}
                onCheckedChange={() => handleSettingChange("medication")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Symptom Tracking</h4>
                <p className="text-sm text-gray-600">Daily reminders to log your symptoms</p>
              </div>
              <Switch
                checked={notificationSettings.symptoms}
                onCheckedChange={() => handleSettingChange("symptoms")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Mood Check-ins</h4>
                <p className="text-sm text-gray-600">Reminders to track your emotional wellbeing</p>
              </div>
              <Switch
                checked={notificationSettings.mood}
                onCheckedChange={() => handleSettingChange("mood")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Appointments</h4>
                <p className="text-sm text-gray-600">Reminders for upcoming medical appointments</p>
              </div>
              <Switch
                checked={notificationSettings.appointments}
                onCheckedChange={() => handleSettingChange("appointments")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Health Insights</h4>
                <p className="text-sm text-gray-600">Weekly summaries and pattern insights</p>
              </div>
              <Switch
                checked={notificationSettings.insights}
                onCheckedChange={() => handleSettingChange("insights")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl transition-colors ${
                    notification.isRead 
                      ? "bg-gray-50 border border-gray-100" 
                      : "bg-red-50 border border-red-100"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {notification.time}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${notification.isRead ? "text-gray-600" : "text-gray-700"}`}>
                      {notification.message}
                    </p>
                    {notification.priority === "high" && !notification.isRead && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-600">High Priority</span>
                      </div>
                    )}
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              ))}
            </div>

            {recentNotifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600">Your health reminders and alerts will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 