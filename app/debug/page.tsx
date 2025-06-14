"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authHelpers, DatabaseService } from "@/lib/database"
import { toast } from "sonner"

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkAuth = async () => {
    setLoading(true)
    try {
      const currentUser = await authHelpers.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        try {
          const userProfile = await DatabaseService.getUserProfile(currentUser.id)
          setProfile(userProfile)
        } catch (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authHelpers.signOut()
      setUser(null)
      setProfile(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="min-h-screen wellness-gradient p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-x-2">
              <Button onClick={checkAuth} disabled={loading}>
                {loading ? 'Checking...' : 'Check Auth Status'}
              </Button>
              <Button onClick={signOut} variant="outline">
                Sign Out
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Authentication Status:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {user ? JSON.stringify({
                    id: user.id,
                    email: user.email,
                    email_confirmed_at: user.email_confirmed_at,
                    created_at: user.created_at
                  }, null, 2) : 'Not authenticated'}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold">Profile Status:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                  {profile ? JSON.stringify(profile, null, 2) : 'No profile found'}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold">Recommended Action:</h3>
                <p className="bg-blue-50 p-2 rounded text-sm">
                  {!user ? 'Go to login page' : 
                   !profile ? 'Go to setup page' : 
                   'Go to dashboard'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 