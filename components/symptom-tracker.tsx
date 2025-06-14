"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useApp, useConditions } from "@/lib/store/enhanced-context"
import { DatabaseService, authHelpers } from "@/lib/database"
import { toast } from "sonner"
import { X, Plus, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react"

interface SymptomTrackerProps {
  onClose?: () => void
  toolId?: string
  userTool?: any
  onEntry?: (entry: any) => void
}

export function SymptomTracker({ onClose, toolId, userTool, onEntry }: SymptomTrackerProps) {
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
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [duration, setDuration] = useState("")

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

  const validateInputs = (): boolean => {
    const newErrors: string[] = []
    
    if (!symptomType.trim()) {
      newErrors.push("Please enter a symptom type")
    }
    
    if (duration && (isNaN(parseInt(duration)) || parseInt(duration) < 1 || parseInt(duration) > 1440)) {
      newErrors.push("Duration must be between 1-1440 minutes")
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateInputs()) return

    setIsSubmitting(true)

    const now = new Date()
    const symptomEntry = {
      conditionId: conditionId || undefined,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0].substring(0, 5),
      symptom_type: symptomType,
      severity: severity[0],
      location: location.trim() || undefined,
      triggers: triggers.length > 0 ? triggers : undefined,
      duration: duration ? parseInt(duration) : undefined,
      notes: notes.trim() || undefined,
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

                 await DatabaseService.createTrackingEntry(user.id, {
           tool_id: toolId,
           data: symptomEntry,
           timestamp: symptomEntry.timestamp
         })
        
        // Call onEntry callback
        onEntry({
          id: Date.now().toString(),
          user_id: user.id,
          tool_id: toolId,
          data: symptomEntry,
          timestamp: symptomEntry.timestamp
        })

        // Reset form
        setSymptomType("")
        setConditionId("none")
        setSeverity([2])
        setLocation("")
        setTriggers([])
        setDuration("")
        setNotes("")
        setErrors([])
        
        // Reload recent entries
        loadRecentEntries()
        
        toast.success("Symptom logged successfully!")
      } else {
        // Legacy system
        actions.addSymptom(symptomEntry)
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        if (onClose) {
          onClose()
        }
      }
    } catch (error) {
      console.error('Error saving symptom:', error)
      toast.error("Failed to save symptom. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearForm = () => {
    setSymptomType("")
    setConditionId("none")
    setSeverity([2])
    setLocation("")
    setTriggers([])
    setDuration("")
    setNotes("")
    setErrors([])
  }

  // If this is the legacy popup mode
  if (onClose && !toolId) {
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
              <SymptomTrackerContent />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // New tracking system mode
  function SymptomTrackerContent() {
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
                placeholder="Type your symptom or choose below"
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
                placeholder="Where do you feel this? (e.g., chest, head)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-2 rounded-2xl"
              />
            </div>

            {/* Duration - only in new tracking system */}
            {toolId && (
              <div>
                <Label htmlFor="duration" className="text-base font-medium">
                  Duration (minutes) (optional)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="How long did this last?"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-2 rounded-2xl"
                  min="1"
                  max="1440"
                />
              </div>
            )}

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
                  placeholder="What might have triggered this?"
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
                  disabled={!symptomType.trim() || isSubmitting}
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
                      Log Symptom
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Submit Button - legacy mode */}
            {!toolId && (
              <Button
                onClick={handleSubmit}
                disabled={!symptomType.trim() || isSubmitting}
                className="w-full wellness-button-primary"
              >
                {isSubmitting ? "Saving..." : "Log Symptom"}
              </Button>
            )}
          </>
        )
      }

      return (
        <div className="space-y-6">
          <SymptomTrackerContent />
          
          {/* Recent Entries - only in new tracking system */}
          {toolId && recentEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Recent Symptom Entries</span>
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
                          <span className="text-gray-600">Symptom:</span>
                          <span className="font-medium">{entry.data.symptom_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Severity:</span>
                          <span className="font-medium">{severityLabels[entry.data.severity]} ({entry.data.severity}/4)</span>
                        </div>
                        {entry.data.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{entry.data.location}</span>
                          </div>
                        )}
                        {entry.data.duration && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{entry.data.duration} min</span>
                          </div>
                        )}
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
