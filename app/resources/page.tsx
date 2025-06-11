"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useApp, useUser } from "@/lib/store/enhanced-context"
import { ResourceLibrary } from "@/components/resources/resource-library"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ResourcesPage() {
  const { actions, isReady } = useApp()
  const user = useUser()

  useEffect(() => {
    if (isReady) {
      actions.navigate("/resources")
    }
  }, [actions, isReady])

  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <AppLogo size="lg" className="mb-4" />
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading resources...</p>
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
          <p className="text-gray-600 mb-8">Please set up your profile to access health resources</p>
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
          <h1 className="text-xl font-bold text-gray-900">Resources</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6">
        <ResourceLibrary />
      </main>
    </div>
  )
}
