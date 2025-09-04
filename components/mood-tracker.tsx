"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/store/safe-context"
import { DatabaseService, authHelpers } from "@/lib/database"
import { toast } from "sonner"
import { X, Heart, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react"

interface MoodTrackerProps {
  onClose?: () => void
  toolId?: string
  userTool?: any
  onEntry?: (entry: any) => void
}

export function MoodTracker({ onClose, toolId, userTool, onEntry }: MoodTrackerProps) {
  const { actions } = useApp()
  const [mood, setMood] = useState<"very-sad" | "sad" | "neutral" | "happy" | "very-happy">("neutral")
  const [energy, setEnergy] = useState([5])
  const [stress, setStress] = useState([5])
  const [notes, setNotes] = useState("")
  const [activities, setActivities] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const moodOptions = [
    { value: "very-sad", emoji: "😢", label: "Very Sad" },
    { value: "sad", emoji: "😔", label: "Sad" },
    { value: "neutral", emoji: "😐", label: "Neutral" },
    { value: "happy", emoji: "😊", label: "Happy" },
    { value: "very-happy", emoji: "😄", label: "Very Happy" },
  ]

  const activityOptions = [
    "work", "exercise", "social", "hobbies", "rest", "therapy", 
    "medication", "family_time", "study", "medical_appointment"
  ]

  useEffect(() => {
    if (toolId) {
      loadRecentEntries()
    }
  }, [toolId])

  const loadRecentEntries = async () => {
    if (!toolId) return
    
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 5)
      setRecentEntries(entries)
    } catch (error) {
      console.error('Error loading recent entries:', error)
    }
  }

  const handleActivityToggle = (activity: string) => {
    setActivities((prev) => (prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]))
  }

  const validateInputs = (): boolean => {
    const newErrors: string[] = []
    
    if (!mood) {
      newErrors.push("Please select your mood")
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateInputs()) return

    setIsSubmitting(true)

    const now = new Date()
    const moodEntry = {
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
      mood,
      energy: energy[0],
      stress: stress[0],
      notes: notes.trim() || undefined,
      activities: activities.length > 0 ? activities : undefined,
      timestamp: now.toISOString()
    }

    try {
      // If this is the new tracking system
      if (toolId && onEntry) {
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          toast.error("Please log in to save your data")
          return
        }

                 await DatabaseService.createTrackingEntry({
          user_id: user.id,
          tool_id: toolId,
          data: moodEntry,
          timestamp: moodEntry.timestamp
        })
        
        // Call onEntry callback
        onEntry({
          id: Date.now().toString(),
          user_id: user.id,
          tool_id: toolId,
          data: moodEntry,
          timestamp: moodEntry.timestamp
        })

        // Reset form
        setMood("neutral")
        setEnergy([5])
        setStress([5])
        setNotes("")
        setActivities([])
        setErrors([])
        
        // Reload recent entries
        loadRecentEntries()
        
        toast.success("Mood logged successfully!")
      } else {
        // Legacy system
        actions.addMood(moodEntry)
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        if (onClose) {
          onClose()
        }
      }
    } catch (error) {
      console.error('Error saving mood:', error)
      toast.error("Failed to save mood. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setMood("neutral")
    setEnergy([5])
    setStress([5])
    setNotes("")
    setActivities([])
    setErrors([])
  }

  // If this is the legacy popup mode
  if (onClose && !toolId) {
    return (
      <div className="wellness-popup-overlay" onClick={onClose}>
        <div className="wellness-popup-content" onClick={(e) => e.stopPropagation()}>
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Track Your Mood</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <MoodTrackerContent />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // New tracking system mode
  function MoodTrackerContent() {
    return (
      <>
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mood Selection */}
        <div>
          <Label className="text-base font-medium">How are you feeling?</Label>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {moodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(option.value as any)}
                className={`p-3 rounded-2xl text-center transition-all ${
                  mood === option.value
                    ? "bg-red-100 border-2 border-red-500"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <Label className="text-base font-medium">Energy Level: {energy[0]}/10</Label>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">Low</span>
            <Slider value={energy} onValueChange={setEnergy} max={10} min={1} step={1} className="flex-1" />
            <span className="text-sm text-gray-500">High</span>
          </div>
        </div>

        {/* Stress Level */}
        <div>
          <Label className="text-base font-medium">Stress Level: {stress[0]}/10</Label>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">Low</span>
            <Slider value={stress} onValueChange={setStress} max={10} min={1} step={1} className="flex-1" />
            <span className="text-sm text-gray-500">High</span>
          </div>
        </div>

        {/* Activities */}
        <div>
          <Label className="text-base font-medium">What did you do today?</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {activityOptions.map((activity) => (
              <button
                key={activity}
                onClick={() => handleActivityToggle(activity)}
                className={`px-3 py-1 rounded-full text-sm transition-all capitalize ${
                  activities.includes(activity)
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                }`}
              >
                {activity.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="mood-notes" className="text-base font-medium">
            Notes (optional)
          </Label>
          <Textarea
            id="mood-notes"
            placeholder="How are you feeling today? Share your thoughts..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 rounded-2xl"
            rows={3}
          />
        </div>

        {/* Action Buttons - only show in new tracking system */}
        {toolId && (
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={clearForm}
              className="flex-1"
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="wellness-button-primary flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Mood Entry
                </>
              )}
            </Button>
          </div>
        )}

        {/* Submit Button - legacy mode */}
        {!toolId && (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full wellness-button-primary">
            {isSubmitting ? "Saving..." : "Save Mood Entry"}
          </Button>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <MoodTrackerContent />
      
      {/* Recent Entries - only in new tracking system */}
      {toolId && recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Recent Mood Entries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.slice(0, 3).map((entry, index) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mood:</span>
                      <span className="font-medium capitalize">
                        {(() => {
                          const moodValue = entry.data.mood
                          // Handle numeric mood values (1-10 scale)
                          if (typeof moodValue === 'number') {
                            if (moodValue <= 2) return "😢 Very Sad"
                            if (moodValue <= 4) return "😔 Sad" 
                            if (moodValue <= 6) return "😐 Neutral"
                            if (moodValue <= 8) return "😊 Happy"
                            return "😄 Very Happy"
                          }
                          // Handle string mood values
                          const option = moodOptions.find(m => m.value === moodValue)
                          return option ? `${option.emoji} ${option.label}` : `${moodValue}`.replace('-', ' ')
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Energy:</span>
                      <span className="font-medium">{entry.data.energy}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stress:</span>
                      <span className="font-medium">{entry.data.stress}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
