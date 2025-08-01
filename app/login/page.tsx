"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/app-logo"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

// Dynamic imports to avoid potential SSR issues
import dynamic from 'next/dynamic'

// Safe import with error handling
let authHelpers: any = null
let DatabaseService: any = null

// Initialize services safely
const initializeServices = async () => {
  try {
    const { authHelpers: auth, DatabaseService: db } = await import('@/lib/database')
    authHelpers = auth
    DatabaseService = db
    return true
  } catch (error) {
    console.error('Failed to initialize services:', error)
    return false
  }
}

export default function Login() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Login page: Checking authentication...')
      
      // Initialize services first
      const servicesReady = await initializeServices()
      if (!servicesReady) {
        console.error('Login page: Failed to initialize authentication services')
        toast.error('Authentication system unavailable. Please refresh the page.')
        return
      }

      try {
        const user = await authHelpers.getCurrentUser()
        if (user) {
          console.log('Login page: User is authenticated:', user.email)
          // Check if user has completed setup
          try {
            const userData = await DatabaseService.getUserProfile(user.id)
            console.log('Login page: User profile data:', userData)
            if (userData) {
              console.log('Login page: Redirecting to dashboard')
              router.push('/dashboard')
            } else {
              console.log('Login page: No profile found, redirecting to setup')
              router.push('/setup')
            }
          } catch (error) {
            console.log('Login page: Error fetching profile, redirecting to setup:', error)
            router.push('/setup')
          }
        } else {
          console.log('Login page: No authenticated user found')
        }
      } catch (error) {
        console.error('Login page: Authentication check failed:', error)
      }
    }
    checkAuth()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    // Trim email input automatically
    const processedValue = field === 'email' ? value.trim() : value
    setFormData(prev => ({ ...prev, [field]: processedValue }))
  }

  const validateForm = () => {
    // Trim email for validation
    const trimmedEmail = formData.email.trim()
    
    if (!trimmedEmail || !formData.password) {
      toast.error('Please fill in all fields')
      return false
    }

    // Check for @ symbol first
    if (!trimmedEmail.includes('@')) {
      toast.error('Email must contain an @ symbol')
      return false
    }

    // More comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }

    if (isSignUp) {
      if (!formData.name.trim()) {
        toast.error('Please enter your name')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      // Ensure services are initialized
      const servicesReady = await initializeServices()
      if (!servicesReady) {
        throw new Error('Authentication system is not available. Please refresh the page.')
      }

      if (isSignUp) {
        // Sign up
        const { user } = await authHelpers.signUp(formData.email, formData.password, {
          name: formData.name
        })
        
        if (user) {
          toast.success('Account created successfully! Please check your email to verify your account.')
          // For now, redirect to setup (in production, they'd need to verify email first)
          router.push('/setup')
        }
      } else {
        // Sign in
        const { user } = await authHelpers.signIn(formData.email, formData.password)
        
        if (user) {
          toast.success('Welcome back!')
          
          // Check if user has completed setup
          try {
            const userData = await DatabaseService.getUserProfile(user.id)
            if (userData) {
              router.push('/dashboard')
            } else {
              router.push('/setup')
            }
          } catch (error) {
            router.push('/setup')
          }
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      toast.error(error.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen wellness-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <AppLogo size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Welcome back to your health journey</p>
        </div>

        {/* Login/Signup Form */}
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Your full name" 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 rounded-2xl" 
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your.email@example.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1 rounded-2xl" 
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Your secure password (min 6 characters)" 
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="mt-1 rounded-2xl pr-10" 
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirm your password" 
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="mt-1 rounded-2xl" 
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full wellness-button-primary" 
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="text-center space-y-2 mt-4">
              {!isSignUp && (
                <Link href="#" className="text-sm text-purple-600 hover:underline">
                  Forgot your password?
                </Link>
              )}
              <div className="text-sm text-gray-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{" "}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-purple-600 hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Get started'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Sign Out Button (development only) */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                const servicesReady = await initializeServices()
                if (!servicesReady) {
                  throw new Error('Authentication system not available')
                }
                await authHelpers.signOut()
                toast.success('Signed out successfully')
                window.location.reload()
              } catch (error) {
                console.error('Sign out error:', error)
                toast.error('Failed to sign out')
              }
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Sign Out Current Session
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Safe, secure, and HIPAA-compliant</p>
        </div>
      </div>
    </div>
  )
}
