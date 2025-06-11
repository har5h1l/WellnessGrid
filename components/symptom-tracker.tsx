"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp, useConditions } from "@/lib/store/enhanced-context"
import { X, Plus } from "lucide-react"

interface SymptomTrackerProps {
  onClose: () => void
}

export function SymptomTracker({ onClose }: SymptomTrackerProps) {
  const { actions } = useApp()
  const conditions = useConditions()
  const [symptomType, setSymptomType] = useState("")
  const [conditionId, setConditionId] = useState<string>("none")
  const [severity, setSeverity] = useState([2])
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState("")
  const [triggers, setTriggers] = useState<string[]>([])
  const [newTrigger, setNewTrigger] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonSymptoms = [
    "Shortness of breath",
    "Wheezing",
    "Chest tightness",
    "Coughing",
    "Headache",
    "Fatigue",
    "Nausea",
    "Dizziness",
    "Pain",
    "Fever",
  ]

  const commonTriggers = [
    "Exercise",
    "Cold air",
    "Allergens",
    "Stress",
    "Weather change",
    "Smoke",
    "Strong odors",
    "Medication",
    "Food",
    "Sleep deprivation",
  ]

  const severityLabels = ["None", "Mild", "Moderate", "Significant", "Severe"]

  const handleSymptomSelect = (symptom: string) => {
    setSymptomType(symptom)
  }

  const handleTriggerToggle = (trigger: string) => {
    setTriggers((prev) => (prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]))
  }

  const handleAddCustomTrigger = () => {
    if (newTrigger.trim() && !triggers.includes(newTrigger.trim())) {
      setTriggers((prev) => [...prev, newTrigger.trim()])
      setNewTrigger("")
    }
  }

  const handleSubmit = async () => {
    if (!symptomType.trim()) return

    setIsSubmitting(true)

    const now = new Date()
    const symptomEntry = {
      conditionId: conditionId || undefined,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
      type: symptomType,
      severity: severity[0],
      notes: notes.trim() || undefined,
      location: location.trim() || undefined,
      triggers: triggers.length > 0 ? triggers : undefined,
    }

    actions.addSymptom(symptomEntry)

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
            <CardTitle>Log Symptom</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Related Condition */}
            {conditions.length > 0 && (
              <div>
                <Label className="text-base font-medium">Related to which condition? (optional)</Label>
                <Select value={conditionId} onValueChange={setConditionId}>
                  <SelectTrigger className="mt-2 rounded-2xl">
                    <SelectValue placeholder="Select a condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific condition</SelectItem>
                    {conditions.map((condition) => (
                      <SelectItem key={condition.id} value={condition.id}>
                        <div className="flex items-center space-x-2">
                          <span>{condition.icon}</span>
                          <span>{condition.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Symptom Type */}
            <div>
              <Label className="text-base font-medium">What symptom are you experiencing?</Label>
              <Input
                placeholder="Enter symptom or select from below"
                value={symptomType}
                onChange={(e) => setSymptomType(e.target.value)}
                className="mt-2 rounded-2xl"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => handleSymptomSelect(symptom)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      symptomType === symptom
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <Label className="text-base font-medium">
                Severity: {severityLabels[severity[0]]} ({severity[0]}/4)
              </Label>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">Mild</span>
                <Slider value={severity} onValueChange={setSeverity} max={4} min={0} step={1} className="flex-1" />
                <span className="text-sm text-gray-500">Severe</span>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-base font-medium">
                Location (optional)
              </Label>
              <Input
                id="location"
                placeholder="Where do you feel this symptom?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Triggers */}
            <div>
              <Label className="text-base font-medium">Possible triggers</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonTriggers.map((trigger) => (
                  <button
                    key={trigger}
                    onClick={() => handleTriggerToggle(trigger)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      triggers.includes(trigger)
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {trigger}
                  </button>
                ))}
              </div>

              {/* Custom trigger input */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add custom trigger"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="flex-1 rounded-2xl"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomTrigger()}
                />
                <Button onClick={handleAddCustomTrigger} variant="outline" size="icon" className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="symptom-notes" className="text-base font-medium">
                Notes (optional)
              </Label>
              <Textarea
                id="symptom-notes"
                placeholder="Any additional details about this symptom?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 rounded-2xl"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!symptomType.trim() || isSubmitting}
              className="w-full wellness-button-primary"
            >
              {isSubmitting ? "Saving..." : "Log Symptom"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
