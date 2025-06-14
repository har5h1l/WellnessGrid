"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function QuickFixPage() {
  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/track">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">Tool Issue Fix</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Issue Detected:</strong> Your current tools are using generic IDs that don't match the specialized tool components. This causes all tools to show the same basic form.
          </AlertDescription>
        </Alert>

        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-center">
              🚨 Why You're Seeing "mood-depression-tracker" for Everything
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-3">
              <p>
                <strong>The Problem:</strong> Your existing tools have generic IDs (like "general") instead of specific tool IDs needed for the specialized components.
              </p>
              
              <p>
                <strong>The Solution:</strong> Add the new specialized tools that have advanced features, medical validation, and smart interfaces.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="wellness-card">
          <CardHeader>
            <CardTitle>🔧 Quick Fix - 2 Easy Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Add Specialized Tools</h3>
                  <p className="text-sm text-gray-600">Add the advanced tracking tools with smart features</p>
                </div>
                <Link href="/debug/add-tools">
                  <Button size="sm" className="wellness-button-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tools
                  </Button>
                </Link>
              </div>

              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Use the New Tools</h3>
                  <p className="text-sm text-gray-600">Go back to tracking and use the specialized tools</p>
                </div>
                <Link href="/track">
                  <Button size="sm" variant="outline">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Track Page
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-sm">✨ What You'll Get with Specialized Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span><strong>Hydration Tracker:</strong> Quick-tap buttons (250ml, 500ml, 750ml) + progress bars</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span><strong>Sleep Tracker:</strong> Automatic duration calculation + weekly patterns</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span><strong>Glucose Tracker:</strong> Medical validation + target ranges + trends</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span><strong>Vital Signs:</strong> BP classifications + heart rate monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><strong>Nutrition:</strong> Meal tracking + macro calculations + daily totals</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Link href="/debug/add-tools">
            <Button className="wellness-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Fix This Issue - Add Specialized Tools
            </Button>
          </Link>
          
          <div>
            <Link href="/track">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tracking
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 