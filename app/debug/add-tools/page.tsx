"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Check, X } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import { toolPresets } from "@/lib/data/mock-sources"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

const SPECIALIZED_TOOLS = [
  {
    id: "hydration-tracker",
    name: "Hydration Tracker",
    category: "nutrition",
    description: "Track daily water intake with quick-tap logging and progress visualization"
  },
  {
    id: "sleep-tracker", 
    name: "Sleep Tracker",
    category: "lifestyle",
    description: "Monitor sleep patterns with automatic duration calculation and weekly trends"
  },
  {
    id: "glucose-tracker",
    name: "Glucose Tracker", 
    category: "diabetes",
    description: "Track blood glucose with medical guideline validation and trend analysis"
  },
  {
    id: "vital-signs-tracker",
    name: "Vital Signs Tracker",
    category: "medical",
    description: "Monitor blood pressure, heart rate, and temperature with medical classifications"
  },
  {
    id: "nutrition-tracker",
    name: "Nutrition Tracker",
    category: "nutrition", 
    description: "Log meals with macro tracking and daily nutrition summaries"
  },
  {
    id: "medication-reminder",
    name: "Medication Reminder",
    category: "medical",
    description: "Track medication adherence with scheduling and reminder notifications"
  },
  {
    id: "physical-activity-tracker",
    name: "Physical Activity Tracker", 
    category: "fitness",
    description: "Log workouts with duration, intensity, and activity summaries"
  }
];

export default function AddToolsDebugPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userTools, setUserTools] = useState<any[]>([])
  const [addingTools, setAddingTools] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        const userData = await DatabaseService.getUserCompleteData(user.id)
        setUserTools(userData.tools)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const addTool = async (tool: typeof SPECIALIZED_TOOLS[0]) => {
    if (!currentUser) return

    try {
      setAddingTools(prev => new Set(prev).add(tool.id))

      const toolPreset = toolPresets.find(tp => tp.id === tool.id)
      if (!toolPreset) {
        toast.error(`Tool preset not found for ${tool.name}`)
        return
      }

      const newTool = {
        user_id: currentUser.id,
        tool_id: tool.id,
        tool_name: tool.name,
        tool_category: tool.category,
        is_enabled: true,
        settings: toolPreset.defaultSettings || {}
      }

      const createdTools = await DatabaseService.createUserTools([newTool])
      if (createdTools && createdTools.length > 0) {
        setUserTools(prev => [...prev, createdTools[0]])
        toast.success(`${tool.name} added successfully!`)
      }
    } catch (error) {
      console.error('Error adding tool:', error)
      toast.error(`Failed to add ${tool.name}`)
    } finally {
      setAddingTools(prev => {
        const newSet = new Set(prev)
        newSet.delete(tool.id)
        return newSet
      })
    }
  }

  const isToolAdded = (toolId: string) => {
    return userTools.some(ut => ut.tool_id === toolId)
  }

  const addAllTools = async () => {
    const toolsToAdd = SPECIALIZED_TOOLS.filter(tool => !isToolAdded(tool.id))
    
    for (const tool of toolsToAdd) {
      await addTool(tool)
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

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
          <h1 className="text-lg font-bold text-gray-900">Add Specialized Tools</h1>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-center">
              🚀 Add Advanced Health Tracking Tools
            </CardTitle>
            <p className="text-center text-gray-600">
              These specialized tools have advanced features, medical validation, and smart visualizations
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <Button 
                onClick={addAllTools}
                className="wellness-button-primary"
                disabled={SPECIALIZED_TOOLS.every(tool => isToolAdded(tool.id))}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add All Specialized Tools
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {SPECIALIZED_TOOLS.map((tool) => {
            const isAdded = isToolAdded(tool.id)
            const isAdding = addingTools.has(tool.id)

            return (
              <Card key={tool.id} className="wellness-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                        {isAdded && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Added
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                    </div>
                    <div className="ml-4">
                      {isAdded ? (
                        <Link href={`/track/${tool.id}`}>
                          <Button size="sm" className="wellness-button-primary">
                            Use Now
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => addTool(tool)}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <>
                              <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-sm">
              ℹ️ What makes these tools special?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <div>✅ <strong>Medical Accuracy:</strong> Built-in validation using clinical guidelines</div>
            <div>✅ <strong>Smart Calculations:</strong> Automatic averages, trends, and insights</div>
            <div>✅ <strong>Quick Actions:</strong> One-tap logging for common tasks</div>
            <div>✅ <strong>Visual Progress:</strong> Charts, graphs, and progress indicators</div>
            <div>✅ <strong>Context Awareness:</strong> Time-based recommendations and ranges</div>
            <div>✅ <strong>Goal Tracking:</strong> Built-in targets and achievement tracking</div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/track">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tracking
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 