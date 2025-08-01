'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { HealthDashboard } from '@/components/analytics/health-dashboard'
import { LoadingScreen } from '@/components/loading-screen'

export default function InsightsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // JSON-LD structured data for health analytics page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Health Analytics Dashboard',
    description: 'Comprehensive health insights and analytics dashboard for tracking wellness metrics, trends, and personalized health recommendations.',
    mainContentOfPage: {
      '@type': 'MedicalCondition',
      name: 'Health Monitoring',
      description: 'Track health metrics including glucose levels, mood, sleep patterns, vital signs, and receive AI-powered insights.'
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient'
    },
    about: {
      '@type': 'MedicalCondition',
      name: 'Chronic Disease Management',
      description: 'Tools and insights for managing chronic health conditions through data tracking and analysis.'
    },
    publisher: {
      '@type': 'Organization',
      name: 'WellnessGrid',
      url: 'https://wellnessgrid.app'
    }
  }

  useEffect(() => {
    const getUser = async () => {
      console.log('🔐 [DEBUG] Getting user authentication status...')
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('🔐 [DEBUG] Auth result:', { user: user?.id, error })
        
        // Handle auth session missing gracefully
        if (error && error.message.includes('Auth session missing')) {
          console.log('ℹ️ [DEBUG] No active session, user needs to sign in')
          setUser(null)
        } else if (error) {
          throw error
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error getting user:', error)
        setUser(null) // Set to null on any error
      } finally {
        console.log('✅ [DEBUG] Auth check complete, loading:', false)
        setLoading(false)
      }
    }

    getUser()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view insights</h1>
          <p className="text-muted-foreground">
            You need to be logged in to access your health insights and analytics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <HealthDashboard userId={user.id} />
      </div>
    </>
  )
}
