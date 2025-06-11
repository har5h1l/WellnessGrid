"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/store/enhanced-context"
import { X } from "lucide-react"

interface MoodTrackerProps {
  onClose: () => void
}

export function MoodTracker({ onClose }: MoodTrackerProps) {
  const { actions } = useApp()
  const [mood, setMood] = useState<"very-sad" | "sad" | "neutral" | "happy" | "very-happy">("neutral")
  const [energy, setEnergy] = useState([5])
  const [stress, setStress] = useState([5])
  const [notes, setNotes] = useState("")
  const [activities, setActivities] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moodOptions = [
    { value: "very-sad", emoji: "😢", label: "Very Sad" },
    { value: "sad", emoji: "😔", label: "Sad" },
    { value: "neutral", emoji: "😐", label: "Neutral" },
    { value: "happy", emoji: "😊", label: "Happy" },
    { value: "very-happy", emoji: "😄", label: "Very Happy" },
  ]

  const activityOptions = [
    "School",
    "Work",
    "Exercise",
    "Friends",
    "Family",
    "Hobbies",
    "Rest",
    "Medical appointment",
    "Therapy",
    "Medication",
    "Sleep",
  ]

  const handleActivityToggle = (activity: string) => {
    setActivities((prev) => (prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]))
  }

  const handleSubmit = async () => {
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
    }

    actions.addMood(moodEntry)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setIsSubmitting(false)
    onClose()
  }

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
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      activities.includes(activity)
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {activity}
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
                placeholder="How was your day? Any thoughts or feelings you'd like to record?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 rounded-2xl"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full wellness-button-primary">
              {isSubmitting ? "Saving..." : "Save Mood Entry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
