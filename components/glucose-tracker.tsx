"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { DatabaseService, authHelpers } from "@/lib/database"
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface GlucoseTrackerProps {
  toolId: string
  userTool: any
  onEntry?: (entry: any) => void
}

export function GlucoseTracker({ toolId, userTool, onEntry }: GlucoseTrackerProps) {
  const [glucoseLevel, setGlucoseLevel] = useState("")
  const [timing, setTiming] = useState("")
  const [carbsConsumed, setCarbsConsumed] = useState("")
  const [insulinTaken, setInsulinTaken] = useState("")
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [exercised, setExercised] = useState(false)
  const [notes, setNotes] = useState("")
  const [isLogging, setIsLogging] = useState(false)
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  const timingOptions = [
    "fasting", "before_meal", "2h_after_meal", "bedtime", "random"
  ]

  const symptomOptions = [
    "none", "hypoglycemia", "hyperglycemia", "nausea", 
    "fatigue", "dizziness", "headache"
  ]

  // Target ranges (mg/dL)
  const targetRanges = {
    fasting: { min: 80, max: 130 },
    before_meal: { min: 80, max: 130 },
    "2h_after_meal": { min: 80, max: 180 },
    bedtime: { min: 100, max: 140 },
    random: { min: 80, max: 140 }
  }

  // Load recent glucose data
  useEffect(() => {
    loadGlucoseData()
  }, [])

  const loadGlucoseData = async () => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 20)
      setRecentEntries(entries)
    } catch (error) {
      console.error('Error loading glucose data:', error)
    }
  }

  const handleSymptomToggle = (symptom: string) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const getGlucoseStatus = (level: number, timing: string) => {
    const range = targetRanges[timing as keyof typeof targetRanges] || targetRanges.random
    
    if (level < range.min) {
      return { status: 'low', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    } else if (level > range.max) {
      return { status: 'high', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    } else {
      return { status: 'normal', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    }
  }

  const logGlucose = async () => {
    try {
      setIsLogging(true)
      
      const user = await authHelpers.getCurrentUser()
      if (!user) {
        toast.error('Please log in to track glucose')
        return
      }

      if (!glucoseLevel || !timing) {
        toast.error('Please enter glucose level and timing')
        return
      }

      const level = parseFloat(glucoseLevel)
      if (level < 40 || level > 600) {
        toast.error('Please enter a valid glucose level (40-600 mg/dL)')
        return
      }

      const entryData = {
        glucose_level: level,
        timing,
        carbs_consumed: carbsConsumed ? parseInt(carbsConsumed) : null,
        insulin_taken: insulinTaken ? parseFloat(insulinTaken) : null,
        symptoms: symptoms.length > 0 ? symptoms : null,
        exercise: exercised,
        notes: notes.trim() || null
      }

      const entry = {
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: new Date().toISOString()
      }

      await DatabaseService.createTrackingEntry(entry)
      
      // Update local state
      setRecentEntries(prev => [entry, ...prev])
      
      // Reset form
      setGlucoseLevel("")
      setTiming("")
      setCarbsConsumed("")
      setInsulinTaken("")
      setSymptoms([])
      setExercised(false)
      setNotes("")
      
      const status = getGlucoseStatus(level, timing)
      toast.success(`Glucose logged: ${level} mg/dL (${status.status})`)
      
      if (onEntry) {
        onEntry(entry)
      }
    } catch (error) {
      console.error('Error logging glucose:', error)
      toast.error('Failed to log glucose data')
    } finally {
      setIsLogging(false)
    }
  }

  const getAverageGlucose = (days: number = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const filteredEntries = recentEntries.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    )
    
    if (filteredEntries.length === 0) return 0
    
    const total = filteredEntries.reduce((sum, entry) => sum + entry.data.glucose_level, 0)
    return Math.round(total / filteredEntries.length)
  }

  const getInRangePercentage = (days: number = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const filteredEntries = recentEntries.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    )
    
    if (filteredEntries.length === 0) return 0
    
    const inRange = filteredEntries.filter(entry => {
      const status = getGlucoseStatus(entry.data.glucose_level, entry.data.timing)
      return status.status === 'normal'
    }).length
    
    return Math.round((inRange / filteredEntries.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Glucose Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Log Blood Glucose
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="glucose">Glucose Level (mg/dL)</Label>
              <Input
                id="glucose"
                type="number"
                placeholder="120"
                value={glucoseLevel}
                onChange={(e) => setGlucoseLevel(e.target.value)}
                min="40"
                max="600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timing">Measurement Timing</Label>
              <Select value={timing} onValueChange={setTiming}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fasting">Fasting</SelectItem>
                  <SelectItem value="before_meal">Before Meal</SelectItem>
                  <SelectItem value="2h_after_meal">2h After Meal</SelectItem>
                  <SelectItem value="bedtime">Bedtime</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Range Info */}
          {timing && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Target Range</span>
              </div>
              <p className="text-sm text-blue-700">
                {targetRanges[timing as keyof typeof targetRanges]?.min} - {targetRanges[timing as keyof typeof targetRanges]?.max} mg/dL
              </p>
            </div>
          )}

          {/* Glucose Level Status */}
          {glucoseLevel && timing && (
            <div className="text-center">
              {(() => {
                const level = parseFloat(glucoseLevel)
                const status = getGlucoseStatus(level, timing)
                return (
                  <div className={`p-3 rounded-lg border ${status.bg} ${status.border}`}>
                    <div className={`text-lg font-semibold ${status.color}`}>
                      {level} mg/dL
                    </div>
                    <div className={`text-sm ${status.color}`}>
                      {status.status === 'normal' ? 'In Target Range' : 
                       status.status === 'low' ? 'Below Target' : 'Above Target'}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbohydrates (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="30"
                value={carbsConsumed}
                onChange={(e) => setCarbsConsumed(e.target.value)}
                min="0"
                max="200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insulin">Insulin Dose (units)</Label>
              <Input
                id="insulin"
                type="number"
                placeholder="4"
                value={insulinTaken}
                onChange={(e) => setInsulinTaken(e.target.value)}
                min="0"
                max="100"
                step="0.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomToggle(symptom)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    symptoms.includes(symptom)
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {symptom.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exercise"
              checked={exercised}
              onCheckedChange={(checked) => setExercised(checked as boolean)}
            />
            <Label htmlFor="exercise">Exercise in last 2 hours</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={logGlucose} 
            disabled={isLogging}
            className="w-full"
          >
            {isLogging ? 'Logging...' : 'Log Glucose Reading'}
          </Button>
        </CardContent>
      </Card>

      {/* Glucose Summary */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              7-Day Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getAverageGlucose()} mg/dL
                </div>
                <div className="text-sm text-gray-600">Average Glucose</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getInRangePercentage()}%
                </div>
                <div className="text-sm text-gray-600">Time in Range</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Glucose Chart */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.slice(0, 10).map((entry, index) => {
                const status = getGlucoseStatus(entry.data.glucose_level, entry.data.timing)
                const date = new Date(entry.timestamp)
                
                return (
                  <div key={index} className={`p-3 rounded-lg border ${status.bg} ${status.border}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`text-lg font-semibold ${status.color}`}>
                          {entry.data.glucose_level} mg/dL
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.data.timing.replace(/_/g, ' ')} • {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {entry.data.carbs_consumed && (
                          <div className="text-xs text-gray-500">
                            Carbs: {entry.data.carbs_consumed}g
                          </div>
                        )}
                        {entry.data.insulin_taken && (
                          <div className="text-xs text-gray-500">
                            Insulin: {entry.data.insulin_taken} units
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {status.status === 'normal' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                    </div>
                    {entry.data.symptoms && entry.data.symptoms.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Symptoms: {entry.data.symptoms.join(', ').replace(/_/g, ' ')}
                      </div>
                    )}
                    {entry.data.notes && (
                      <div className="mt-2 text-xs text-gray-600">
                        {entry.data.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 