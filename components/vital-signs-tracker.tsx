"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Heart, Activity, Thermometer, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { DatabaseService, authHelpers } from "@/lib/database"
import { toast } from "sonner"

interface VitalSignsTrackerProps {
  toolId: string
  userTool: any
  onEntry: (entry: any) => void
}

export function VitalSignsTracker({ toolId, userTool, onEntry }: VitalSignsTrackerProps) {
  const [systolic, setSystolic] = useState<string>("")
  const [diastolic, setDiastolic] = useState<string>("")
  const [heartRate, setHeartRate] = useState<string>("")
  const [temperature, setTemperature] = useState<string>("")
  const [position, setPosition] = useState<string>("")
  const [medicationTaken, setMedicationTaken] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    loadRecentEntries()
  }, [])

  const loadRecentEntries = async () => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 5)
      setRecentEntries(entries)
    } catch (error) {
      console.error('Error loading recent entries:', error)
    }
  }

  const validateInputs = (): boolean => {
    const newErrors: string[] = []
    
    if (!systolic && !diastolic && !heartRate && !temperature) {
      newErrors.push("Please enter at least one vital sign measurement")
    }
    
    if (systolic) {
      const sys = parseInt(systolic)
      if (isNaN(sys) || sys < 70 || sys > 250) {
        newErrors.push("Systolic pressure must be between 70-250 mmHg")
      }
    }
    
    if (diastolic) {
      const dia = parseInt(diastolic)
      if (isNaN(dia) || dia < 40 || dia > 150) {
        newErrors.push("Diastolic pressure must be between 40-150 mmHg")
      }
    }
    
    if (heartRate) {
      const hr = parseInt(heartRate)
      if (isNaN(hr) || hr < 40 || hr > 200) {
        newErrors.push("Heart rate must be between 40-200 bpm")
      }
    }
    
    if (temperature) {
      const temp = parseFloat(temperature)
      if (isNaN(temp) || temp < 95 || temp > 110) {
        newErrors.push("Temperature must be between 95-110°F")
      }
    }
    
    if (systolic && diastolic) {
      const sys = parseInt(systolic)
      const dia = parseInt(diastolic)
      if (sys <= dia) {
        newErrors.push("Systolic pressure must be higher than diastolic pressure")
      }
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const getBloodPressureCategory = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { category: "Normal", color: "text-green-600", bg: "bg-green-50" }
    if (sys < 130 && dia < 80) return { category: "Elevated", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (sys < 140 || dia < 90) return { category: "Stage 1 High", color: "text-orange-600", bg: "bg-orange-50" }
    if (sys < 180 || dia < 120) return { category: "Stage 2 High", color: "text-red-600", bg: "bg-red-50" }
    return { category: "Crisis", color: "text-red-800", bg: "bg-red-100" }
  }

  const getHeartRateCategory = (hr: number) => {
    if (hr < 60) return { category: "Below Normal", color: "text-blue-600", bg: "bg-blue-50" }
    if (hr <= 100) return { category: "Normal", color: "text-green-600", bg: "bg-green-50" }
    return { category: "Above Normal", color: "text-orange-600", bg: "bg-orange-50" }
  }

  const handleSave = async () => {
    if (!validateInputs()) return

    setSaving(true)
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) {
        toast.error("Please log in to save your data")
        return
      }

      const entryData = {
        systolic: systolic ? parseInt(systolic) : undefined,
        diastolic: diastolic ? parseInt(diastolic) : undefined,
        heart_rate: heartRate ? parseInt(heartRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        position: position || undefined,
        medication_taken: medicationTaken,
        notes: notes || undefined,
        timestamp: new Date().toISOString()
      }

      await DatabaseService.createTrackingEntry({
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: entryData.timestamp
      })
      
      // Call onEntry callback
      onEntry({
        id: Date.now().toString(),
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: entryData.timestamp
      })

      // Reset form
      setSystolic("")
      setDiastolic("")
      setHeartRate("")
      setTemperature("")
      setPosition("")
      setMedicationTaken(false)
      setNotes("")
      setErrors([])
      
      // Reload recent entries
      loadRecentEntries()
      
      toast.success("Vital signs recorded successfully!")
    } catch (error) {
      console.error('Error saving vital signs:', error)
      toast.error("Failed to save vital signs. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const clearForm = () => {
    setSystolic("")
    setDiastolic("")
    setHeartRate("")
    setTemperature("")
    setPosition("")
    setMedicationTaken(false)
    setNotes("")
    setErrors([])
  }

  return (
    <div className="space-y-6">
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

      {/* Blood Pressure Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Blood Pressure</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Systolic (mmHg)</Label>
              <Input
                type="number"
                placeholder="120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                min="70"
                max="250"
              />
            </div>
            <div className="space-y-2">
              <Label>Diastolic (mmHg)</Label>
              <Input
                type="number"
                placeholder="80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                min="40"
                max="150"
              />
            </div>
          </div>
          
          {/* Blood Pressure Analysis */}
          {systolic && diastolic && (
            <div className="mt-4">
              {(() => {
                const sys = parseInt(systolic)
                const dia = parseInt(diastolic)
                if (!isNaN(sys) && !isNaN(dia) && sys > dia) {
                  const category = getBloodPressureCategory(sys, dia)
                  return (
                    <div className={`p-3 rounded-lg ${category.bg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{sys}/{dia} mmHg</p>
                          <p className={`text-sm ${category.color}`}>Category: {category.category}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${category.color.replace('text-', 'bg-')}`}></div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heart Rate Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>Heart Rate</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Heart Rate (bpm)</Label>
            <Input
              type="number"
              placeholder="70"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              min="40"
              max="200"
            />
          </div>
          
          {/* Heart Rate Analysis */}
          {heartRate && (
            <div className="mt-4">
              {(() => {
                const hr = parseInt(heartRate)
                if (!isNaN(hr)) {
                  const category = getHeartRateCategory(hr)
                  return (
                    <div className={`p-3 rounded-lg ${category.bg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{hr} bpm</p>
                          <p className={`text-sm ${category.color}`}>Category: {category.category}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${category.color.replace('text-', 'bg-')}`}></div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temperature Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <span>Temperature</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature (°F)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              min="95"
              max="110"
            />
          </div>
          
          {/* Temperature Analysis */}
          {temperature && (
            <div className="mt-4">
              {(() => {
                const temp = parseFloat(temperature)
                if (!isNaN(temp)) {
                  const isNormal = temp >= 97.0 && temp <= 99.5
                  const isFever = temp > 100.4
                  const isLow = temp < 97.0
                  
                  const category = isFever ? 
                    { category: "Fever", color: "text-red-600", bg: "bg-red-50" } :
                    isLow ? 
                    { category: "Low", color: "text-blue-600", bg: "bg-blue-50" } :
                    { category: "Normal", color: "text-green-600", bg: "bg-green-50" }
                  
                  return (
                    <div className={`p-3 rounded-lg ${category.bg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{temp}°F</p>
                          <p className={`text-sm ${category.color}`}>Category: {category.category}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${category.color.replace('text-', 'bg-')}`}></div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Position During Measurement</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sitting">Sitting</SelectItem>
                <SelectItem value="standing">Standing</SelectItem>
                <SelectItem value="lying_down">Lying Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="medication"
              checked={medicationTaken}
              onCheckedChange={(checked) => setMedicationTaken(checked === true)}
            />
            <Label htmlFor="medication">I have taken my medication today</Label>
          </div>
          
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button 
          variant="outline" 
          onClick={clearForm}
          className="flex-1"
          disabled={saving}
        >
          Clear
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="wellness-button-primary flex-1"
        >
          {saving ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Reading
            </>
          )}
        </Button>
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Recent Readings</span>
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
                    {entry.data.systolic && entry.data.diastolic && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Pressure:</span>
                        <span className="font-medium">{entry.data.systolic}/{entry.data.diastolic} mmHg</span>
                      </div>
                    )}
                    {entry.data.heart_rate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Heart Rate:</span>
                        <span className="font-medium">{entry.data.heart_rate} bpm</span>
                      </div>
                    )}
                    {entry.data.temperature && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temperature:</span>
                        <span className="font-medium">{entry.data.temperature}°F</span>
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