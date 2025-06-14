"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/app-logo"
import { ConditionIcon } from "@/components/condition-icon"
import { ArrowLeft, ChevronRight, Settings, FileText, Shield, Bell, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { UserProfile, HealthCondition, UserTool } from "@/lib/database"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conditions, setConditions] = useState<HealthCondition[]>([])
  const [tools, setTools] = useState<UserTool[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        console.log('Profile page: Loading user data...')
        
        // Check authentication
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          console.log('Profile page: No authenticated user, redirecting to login')
          router.push('/login')
          return
        }
        console.log('Profile page: User authenticated:', user.email)
        setCurrentUser(user)

        // Load user data from Supabase
        console.log('Profile page: Fetching user complete data...')
        const userData = await DatabaseService.getUserCompleteData(user.id)
        console.log('Profile page: User data retrieved:', userData)
        
        if (!userData.profile) {
          // User hasn't completed setup, redirect to setup
          console.log('Profile page: No profile found, redirecting to setup')
          router.push('/setup')
          return
        }

        console.log('Profile page: Setting profile data')
        setUserProfile(userData.profile)
        setConditions(userData.conditions)
        setTools(userData.tools)
        setName(userData.profile.name)
        console.log('Profile page: Profile data set successfully')
      } catch (error) {
        console.error('Profile page: Error loading user data:', error)
        toast.error('Failed to load profile data')
        // On error, redirect to setup
        router.push('/setup')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSaveName = async () => {
    if (!name.trim() || !currentUser || !userProfile) return

    try {
      await DatabaseService.updateUserProfile(currentUser.id, { name: name.trim() })
      setUserProfile({ ...userProfile, name: name.trim() })
      setIsEditing(false)
      toast.success('Name updated successfully')
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error('Failed to update name')
    }
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || !userProfile) {
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
          <h1 className="text-lg font-bold text-gray-900">Your Health Information</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-6 py-8 space-y-8 max-w-md mx-auto">
        {/* Profile Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <Image src="/images/character.png" alt="Profile" width={60} height={60} className="object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
            <p className="text-sm text-gray-600">
              Age: {userProfile.age} • {userProfile.gender}
            </p>
            {conditions.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">Managing: {conditions.map((c) => c.name).join(", ")}</p>
            )}
          </div>
        </div>

        {/* Profile Settings */}
        <Card className="wellness-card">
          <CardContent className="p-6 space-y-4">
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
                    <div className="flex-1 p-2 bg-gray-50 rounded-2xl">{userProfile.name}</div>
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="icon" className="rounded-full">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enabled Tools Summary */}
        <div className="pt-4">
          <Link href="/profile/tools">
            <Card className="wellness-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="wellness-icon-container bg-green-50">
                      <Settings className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="wellness-text-primary">
                        {tools.length === 0 
                          ? "No Tools Enabled" 
                          : `${tools.length} Tool${tools.length === 1 ? '' : 's'} Enabled`
                        }
                      </h3>
                      <p className="wellness-text-secondary">
                        {tools.length === 0 
                          ? "Add tracking tools to monitor your health"
                          : tools.length <= 3 
                            ? tools.map(tool => tool.tool_name).join(", ")
                            : `${tools.slice(0, 2).map(tool => tool.tool_name).join(", ")} and ${tools.length - 2} more`
                        }
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Health Settings */}
        <div className="pt-4">
          <Link href="/profile/health-info">
            <Card className="wellness-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="wellness-icon-container bg-blue-50">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="wellness-text-primary">Your Health Settings</h3>
                      <p className="wellness-text-secondary">Manage conditions, sources, protocols & data</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* App Settings */}
        <Card className="wellness-card">
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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
          <CardContent className="p-6">
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
        <Button 
          variant="outline" 
          className="w-full rounded-full mt-8"
          onClick={async () => {
            try {
              await authHelpers.signOut()
              router.push('/login')
              toast.success('Signed out successfully')
            } catch (error) {
              console.error('Sign out error:', error)
              toast.error('Failed to sign out')
            }
          }}
        >
          Sign Out
        </Button>
      </main>
    </div>
  )
}
