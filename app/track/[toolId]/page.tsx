"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Save, Activity, Heart, Target, Clock, AlertTriangle, CheckCircle, Info, TrendingUp, Zap, Settings } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import { toolPresets } from "@/lib/data/mock-sources"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"
import { HydrationTracker } from "@/components/hydration-tracker"
import { SleepTracker } from "@/components/sleep-tracker"
import { GlucoseTracker } from "@/components/glucose-tracker"
import { VitalSignsTracker } from "@/components/vital-signs-tracker"
import { NutritionTracker } from "@/components/nutrition-tracker"
import { MoodTracker } from "@/components/mood-tracker"
import { SymptomTracker } from "@/components/symptom-tracker"
import { MedicationLogger } from "@/components/medication-logger"

interface FieldValue {
  [key: string]: any
}

interface ValidationError {
  field: string
  message: string
}

export default function ToolTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const toolId = params.toolId as string
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fieldValues, setFieldValues] = useState<FieldValue>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [userTool, setUserTool] = useState<any>(null)
  const [todayEntries, setTodayEntries] = useState<any[]>([])
  const [effectivePreset, setEffectivePreset] = useState<any>(null)
  
  const toolPreset = toolPresets.find(tool => tool.id === toolId)

  // Load user data and tool settings
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
        
        // More flexible tool lookup - match by ID, name, or category
        let tool = userData.tools.find(t => t.tool_id === toolId && t.is_enabled)
        
        // If not found by exact ID, try matching by name or category
        if (!tool) {
          const normalizedToolId = toolId.toLowerCase().replace(/[-_]/g, '')
          
          // First try to find any enabled tool matching the pattern
          tool = userData.tools.find(t => {
            if (!t.is_enabled) return false
            
            const toolName = t.tool_name?.toLowerCase().replace(/[-_\s]/g, '') || ''
            const toolCategory = t.tool_category?.toLowerCase().replace(/[-_\s]/g, '') || ''
            const toolId_normalized = t.tool_id?.toLowerCase().replace(/[-_]/g, '') || ''
            
            // More comprehensive matching
            const matches = [
              toolName.includes(normalizedToolId) || normalizedToolId.includes(toolName),
              toolCategory.includes(normalizedToolId) || normalizedToolId.includes(toolCategory),
              toolId_normalized.includes(normalizedToolId) || normalizedToolId.includes(toolId_normalized),
              // Specific mappings for common tool types
              (normalizedToolId.includes('glucose') && (toolName.includes('glucose') || toolName.includes('diabetes') || toolCategory.includes('glucose'))),
              (normalizedToolId.includes('mood') && (toolName.includes('mood') || toolName.includes('depression') || toolName.includes('mental') || toolCategory.includes('mood'))),
                             (normalizedToolId.includes('exercise') && (toolName.includes('exercise') || toolName.includes('fitness') || toolName.includes('workout') || toolCategory.includes('exercise'))),
               (normalizedToolId.includes('physical') && (toolName.includes('physical') || toolName.includes('activity') || toolName.includes('exercise') || toolCategory.includes('physical'))),
               (normalizedToolId.includes('activity') && (toolName.includes('activity') || toolName.includes('physical') || toolName.includes('exercise') || toolCategory.includes('activity'))),
              (normalizedToolId.includes('medication') && (toolName.includes('medication') || toolName.includes('medicine') || toolName.includes('pill') || toolName.includes('adherence') || toolCategory.includes('medication')))
            ]
            
            return matches.some(match => match)
          })
        }
        
        // If still not found, try a more lenient search (case insensitive contains)
        if (!tool) {
          tool = userData.tools.find(t => {
            if (!t.is_enabled) return false
            const toolName = t.tool_name?.toLowerCase() || ''
            const toolCategory = t.tool_category?.toLowerCase() || ''
            const searchTerm = toolId.toLowerCase()
            return toolName.includes(searchTerm) || toolCategory.includes(searchTerm) || searchTerm.includes(toolName) || searchTerm.includes(toolCategory)
          })
        }
        
        if (!tool) {
          console.error('Tool lookup failed for toolId:', toolId)
          console.error('Available tools:', userData.tools.map(t => ({ id: t.tool_id, name: t.tool_name, category: t.tool_category, enabled: t.is_enabled })))
          console.error('Normalized search term:', toolId.toLowerCase().replace(/[-_]/g, ''))
          toast.error(`Tool "${toolId}" not found or not enabled`)
          router.push('/profile/tools')
          return
        }
        
        setUserTool(tool)
        
        // Load today's entries
        const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 10)
        const today = new Date().toISOString().split('T')[0]
        const todayEntries = entries.filter(entry => 
          entry.timestamp.startsWith(today)
        )
        setTodayEntries(todayEntries)
        
        // Create effective preset with tool data
        const preset = toolPreset || {
          id: toolId,
          name: tool?.tool_name || "Health Tracker",
          type: tool?.tool_category || 'custom',
          description: `Track your ${tool?.tool_name?.toLowerCase() || 'health data'}`,
          applicableConditions: ['all'],
          defaultSettings: {
            notifications: true,
            reminderTimes: ['08:00', '20:00'],
            customFields: [
              { id: "value", name: "Value", type: "text", required: true },
              { id: "rating", name: "Rating (1-10)", type: "scale", required: false, min: 1, max: 10 }
            ]
          }
        }
        
        setEffectivePreset(preset)
        
        // Initialize field values with defaults
        if (preset?.defaultSettings?.customFields) {
          const initialValues: FieldValue = {}
          preset.defaultSettings.customFields.forEach(field => {
            // Skip null or invalid fields
            if (!field || !field.id) return
            
            if (field.type === 'boolean') {
              initialValues[field.id] = false
            } else if (field.type === 'multiselect') {
              initialValues[field.id] = []
            } else if (field.type === 'scale') {
              initialValues[field.id] = field.min || 1
            } else {
              initialValues[field.id] = ''
            }
          })
          setFieldValues(initialValues)
        }
      } catch (error) {
        console.error('Error loading tool data:', error)
        toast.error('Failed to load tool data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toolId])

  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationError[] = []
    
    if (effectivePreset?.defaultSettings?.customFields) {
      effectivePreset.defaultSettings.customFields.forEach(field => {
        // Skip null or invalid fields
        if (!field || !field.id || !field.name) return
        
        if (field.required) {
          const value = fieldValues[field.id]
          if (value === '' || value === null || value === undefined || 
              (Array.isArray(value) && value.length === 0)) {
            errors.push({
              field: field.id,
              message: `${field.name} is required`
            })
          }
        }
        
        // Validate number ranges
        if (field.type === 'number' && fieldValues[field.id] !== '') {
          const numValue = Number(fieldValues[field.id])
          if (field.min && numValue < field.min) {
            errors.push({
              field: field.id,
              message: `${field.name} must be at least ${field.min}`
            })
          }
          if (field.max && numValue > field.max) {
            errors.push({
              field: field.id,
              message: `${field.name} must be no more than ${field.max}`
            })
          }
        }
      })
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear validation error for this field
    setValidationErrors(prev => prev.filter(error => error.field !== fieldId))
  }

  // Handle multiselect change
  const handleMultiSelectChange = (fieldId: string, option: string, checked: boolean) => {
    setFieldValues(prev => {
      const currentValues = prev[fieldId] || []
      const newValues = checked
        ? [...currentValues, option]
        : currentValues.filter((v: string) => v !== option)
      return {
        ...prev,
        [fieldId]: newValues
      }
    })
    
    // Clear validation error for this field
    setValidationErrors(prev => prev.filter(error => error.field !== fieldId))
  }

  // Save tracking entry
  const saveEntry = async () => {
    if (!currentUser || !userTool || !effectivePreset) return

    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    setSaving(true)
    try {
      const entry = {
        user_id: currentUser.id,
        tool_id: toolId,
        data: fieldValues,
        timestamp: new Date().toISOString()
      }

      // Create tracking entry in database
      await DatabaseService.createTrackingEntry(entry)
      
      toast.success(`${effectivePreset.name} entry saved successfully`)
      
      // Refresh today's entries
      const entries = await DatabaseService.getTrackingEntries(currentUser.id, toolId, 10)
      const today = new Date().toISOString().split('T')[0]
      const todayEntries = entries.filter(entry => 
        entry.timestamp.startsWith(today)
      )
      setTodayEntries(todayEntries)
      
             // Reset form
       const initialValues: FieldValue = {}
       effectivePreset?.defaultSettings?.customFields?.forEach(field => {
        // Skip null or invalid fields
        if (!field || !field.id) return
        
        if (field.type === 'boolean') {
          initialValues[field.id] = false
        } else if (field.type === 'multiselect') {
          initialValues[field.id] = []
        } else if (field.type === 'scale') {
          initialValues[field.id] = field.min || 1
        } else {
          initialValues[field.id] = ''
        }
      })
      setFieldValues(initialValues)
      
    } catch (error: any) {
      console.error('Error saving tracking entry:', error)
      if (error.message.includes('tracking_entries table not found')) {
        toast.error('Tracking feature not set up yet. Please contact support.')
      } else {
        toast.error('Failed to save entry')
      }
    } finally {
      setSaving(false)
    }
  }

  // Get field validation error
  const getFieldError = (fieldId: string) => {
    return validationErrors.find(error => error.field === fieldId)
  }

  // Get tool-specific insights
  const getToolInsights = () => {
    if (!effectivePreset || todayEntries.length === 0) return null

    switch (effectivePreset.id) {
      case 'glucose-tracker':
        const avgGlucose = todayEntries.reduce((sum, entry) => 
          sum + (entry.data.glucose_level || 0), 0) / todayEntries.length
        return {
          title: "Today's Average",
          value: `${Math.round(avgGlucose)} mg/dL`,
          status: avgGlucose < 70 ? 'low' : avgGlucose > 180 ? 'high' : 'normal'
        }
      
      case 'blood-pressure-tracker':
        const lastEntry = todayEntries[0]
        if (lastEntry?.data.systolic && lastEntry?.data.diastolic) {
          const systolic = lastEntry.data.systolic
          const diastolic = lastEntry.data.diastolic
          return {
            title: "Latest Reading",
            value: `${systolic}/${diastolic} mmHg`,
            status: systolic > 140 || diastolic > 90 ? 'high' : 'normal'
          }
        }
        break
      
      case 'mood-depression-tracker':
        const avgMood = todayEntries.reduce((sum, entry) => 
          sum + (entry.data.mood || 0), 0) / todayEntries.length
        return {
          title: "Average Mood",
          value: `${Math.round(avgMood)}/10`,
          status: avgMood < 4 ? 'low' : avgMood > 7 ? 'high' : 'normal'
        }
      
      case 'pain-tracker':
        const avgPain = todayEntries.reduce((sum, entry) => 
          sum + (entry.data.pain_level || 0), 0) / todayEntries.length
        return {
          title: "Average Pain Level",
          value: `${Math.round(avgPain)}/10`,
          status: avgPain > 7 ? 'high' : avgPain < 3 ? 'low' : 'normal'
        }
    }
    
    return null
  }

  // Render field based on type
  const renderField = (field: any) => {
    // Skip null or invalid fields
    if (!field || !field.id || !field.name) return null
    
    const fieldError = getFieldError(field.id)
    const fieldValue = fieldValues[field.id]

    switch (field.type) {
      case "emoji_select":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <div className="grid grid-cols-5 gap-2">
              {field.options.map((option: any) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange(field.id, option.value)}
                  className={`p-3 rounded-2xl text-center transition-all ${
                    fieldValue === option.value
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </button>
              ))}
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "select_or_text":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <div className="space-y-2">
              <Input
                placeholder="Type your symptom or choose below"
                value={fieldValue || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="rounded-2xl"
              />
              <div className="flex flex-wrap gap-2">
                {field.options.map((option: string) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleFieldChange(field.id, option)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      fieldValue === option
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {option.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "time":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Input
              type="time"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="rounded-2xl"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "time_multi":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <div className="space-y-2">
              {(fieldValue || []).map((time: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...(fieldValue || [])]
                      newTimes[index] = e.target.value
                      handleFieldChange(field.id, newTimes)
                    }}
                    className="rounded-2xl flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTimes = (fieldValue || []).filter((_: any, i: number) => i !== index)
                      handleFieldChange(field.id, newTimes)
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTimes = [...(fieldValue || []), '']
                  handleFieldChange(field.id, newTimes)
                }}
              >
                Add Time
              </Button>
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Input
              type="number"
              placeholder={field.placeholder || ''}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className="rounded-2xl"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "text":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Input
              placeholder={field.placeholder || ''}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="rounded-2xl"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Textarea
              placeholder={field.placeholder || ''}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="rounded-2xl"
              rows={3}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "select":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Select value={fieldValue || ''} onValueChange={(value) => handleFieldChange(field.id, value)}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "multiselect":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {field.options.map((option: string) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMultiSelectChange(field.id, option, !(fieldValue || []).includes(option))}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    (fieldValue || []).includes(option)
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {option.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "boolean":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={fieldValue || false}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="text-sm font-medium">{field.name}</Label>
            </div>
            {field.help_text && (
              <p className="text-xs text-gray-500 ml-6">{field.help_text}</p>
            )}
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      case "scale":
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}: {fieldValue || field.min || 1}/{field.max || 10}
            </Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Low</span>
              <Slider
                value={[fieldValue || field.min || 1]}
                onValueChange={(value) => handleFieldChange(field.id, value[0])}
                max={field.max || 10}
                min={field.min || 1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">High</span>
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{field.name}</Label>
            {field.help_text && (
              <p className="text-xs text-gray-500">{field.help_text}</p>
            )}
            <Input
              placeholder={field.placeholder || ''}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="rounded-2xl"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError.message}</p>}
          </div>
        )
    }
  }

  // Render tool-specific header
  const renderToolHeader = () => {
    if (!effectivePreset) return null

    const getToolIcon = () => {
      switch (effectivePreset.type) {
        case 'mood_tracker':
          return <Heart className="w-8 h-8 text-pink-600" />
        case 'custom':
          return <Activity className="w-8 h-8 text-blue-600" />
        case 'medication_reminder':
          return <Target className="w-8 h-8 text-green-600" />
        case 'symptom_tracker':
          return <Activity className="w-8 h-8 text-red-600" />
        case 'sleep_tracker':
          return <Clock className="w-8 h-8 text-purple-600" />
        case 'exercise_tracker':
          return <TrendingUp className="w-8 h-8 text-orange-600" />
        default:
          return <Activity className="w-8 h-8 text-gray-600" />
      }
    }

    const insights = getToolInsights()

    return (
      <CardHeader className="text-center">
        <div className="wellness-icon-container bg-gray-50 mx-auto mb-4">
          {getToolIcon()}
        </div>
        <CardTitle className="text-xl">{effectivePreset.name}</CardTitle>
        <p className="text-gray-600">{effectivePreset.description}</p>
        
        {/* Current Date and Time */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Today's insights */}
        {insights && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{insights.title}</p>
                <p className="text-lg font-bold text-gray-900">{insights.value}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                insights.status === 'high' ? 'bg-red-500' : 
                insights.status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
            </div>
          </div>
        )}

        {/* Today's entry count */}
        <div className="flex items-center justify-center space-x-2 mt-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600">
            {todayEntries.length} entr{todayEntries.length !== 1 ? 'ies' : 'y'} today
          </span>
        </div>
      </CardHeader>
    )
  }

  // Early return only if still loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tool...</p>
        </div>
      </div>
    )
  }

  // If data loading is complete but required data is missing, show error
  if (!effectivePreset || !userTool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Tool not found or not enabled</p>
          <Link href="/profile/tools">
            <Button>Go to Tools Settings</Button>
          </Link>
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
          <h1 className="text-lg font-bold text-gray-900">Track {effectivePreset.name}</h1>
        </div>
        <Link href="/profile/tools">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      <main className="px-4 py-6">
        <Card className="wellness-card">
          {renderToolHeader()}

          <CardContent className="space-y-6">
            {/* Validation summary */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                </div>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specialized Components for Specific Tools */}
            {(() => {
              // Determine tool type from preset or user tool
              const toolType = effectivePreset?.type || userTool?.tool_category || 'custom'
              
              // More comprehensive tool ID and type matching
              const isHydrationTool = toolType === 'hydration_tracker' || 
                                     toolId === "hydration-tracker" || 
                                     toolId === "hydration" ||
                                     toolId === "water-tracker" ||
                                     userTool?.tool_name?.toLowerCase().includes('hydration') ||
                                     userTool?.tool_name?.toLowerCase().includes('water')
              
              const isSleepTool = toolType === 'sleep_tracker' || 
                                 toolId === "sleep-tracker" || 
                                 toolId === "sleep" ||
                                 userTool?.tool_name?.toLowerCase().includes('sleep')
              
              const isGlucoseTool = toolType === 'glucose_tracker' || 
                                   toolId === "glucose-tracker" || 
                                   toolId === "glucose" ||
                                   toolId === "blood-glucose" ||
                                   userTool?.tool_name?.toLowerCase().includes('glucose') ||
                                   userTool?.tool_name?.toLowerCase().includes('diabetes')
              
              const isVitalSignsTool = toolType === 'vital_signs_tracker' || 
                                      toolId === "vital-signs-tracker" || 
                                      toolId === "blood-pressure-tracker" ||
                                      toolId === "blood-pressure" ||
                                      toolId === "vitals" ||
                                      userTool?.tool_name?.toLowerCase().includes('pressure') ||
                                      userTool?.tool_name?.toLowerCase().includes('vitals')
              
              const isNutritionTool = toolType === 'nutrition_tracker' || 
                                     toolId === "nutrition-tracker" || 
                                     toolId === "nutrition" ||
                                     toolId === "food-tracker" ||
                                     userTool?.tool_name?.toLowerCase().includes('nutrition') ||
                                     userTool?.tool_name?.toLowerCase().includes('food')
              
              const isMoodTool = toolType === 'mood_tracker' || 
                                toolId === "mood-tracker" || 
                                toolId === "mood" ||
                                toolId === "depression-tracker" ||
                                userTool?.tool_name?.toLowerCase().includes('mood') ||
                                userTool?.tool_name?.toLowerCase().includes('mental') ||
                                userTool?.tool_name?.toLowerCase().includes('depression')
              
              const isSymptomTool = toolType === 'symptom_tracker' || 
                                   toolId === "symptom-tracker" || 
                                   toolId === "pain-tracker" ||
                                   toolId === "symptoms" ||
                                   toolId === "pain" ||
                                   userTool?.tool_name?.toLowerCase().includes('symptom') ||
                                   userTool?.tool_name?.toLowerCase().includes('pain')
              
              const isMedicationTool = toolType === 'medication_reminder' || 
                                      toolId === "medication-reminder" || 
                                      toolId === "medication" ||
                                      toolId === "pill-tracker" ||
                                      toolId === "medicine-adherence-tracker" ||
                                      userTool?.tool_name?.toLowerCase().includes('medication') ||
                                      userTool?.tool_name?.toLowerCase().includes('medicine') ||
                                      userTool?.tool_name?.toLowerCase().includes('pill') ||
                                      userTool?.tool_name?.toLowerCase().includes('adherence')
              
              const isExerciseTool = toolType === 'exercise_tracker' || 
                                    toolId === "exercise-tracker" || 
                                    toolId === "exercise" ||
                                    toolId === "fitness-tracker" ||
                                    toolId === "workout-tracker" ||
                                    toolId === "physical-activity-tracker" ||
                                    userTool?.tool_name?.toLowerCase().includes('exercise') ||
                                    userTool?.tool_name?.toLowerCase().includes('fitness') ||
                                    userTool?.tool_name?.toLowerCase().includes('workout') ||
                                    userTool?.tool_name?.toLowerCase().includes('physical') ||
                                    userTool?.tool_name?.toLowerCase().includes('activity')
              
              // Handle "general" tool ID by checking user tool name or defaulting to mood tracker
              const isGeneralTool = toolId === "general"
              
              // Log tool matching for debugging
              console.log('=== TOOL COMPONENT MATCHING DEBUG ===', {
                toolId,
                toolType,
                userToolName: userTool?.tool_name,
                isHydrationTool, isSleepTool, isGlucoseTool, isVitalSignsTool, 
                isNutritionTool, isMoodTool, isSymptomTool, isMedicationTool, isExerciseTool, isGeneralTool
              })
              
              if (isHydrationTool) {

                return (
                  <HydrationTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Hydration logged successfully!')
                    }}
                  />
                )
              } else if (isSleepTool) {
                return (
                  <SleepTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Sleep data logged successfully!')
                    }}
                  />
                )
              } else if (isGlucoseTool) {
                return (
                  <GlucoseTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Glucose reading logged successfully!')
                    }}
                  />
                )
              } else if (isVitalSignsTool) {
                return (
                  <VitalSignsTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Vital signs logged successfully!')
                    }}
                  />
                )
              } else if (isNutritionTool) {
                return (
                  <NutritionTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Nutrition logged successfully!')
                    }}
                  />
                )
              } else if (isSymptomTool) {
                return (
                  <SymptomTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Symptoms logged successfully!')
                    }}
                  />
                )
              } else if (isMedicationTool) {
                return (
                  <div>
                    <MedicationLogger 
                      onClose={() => {
                        // For now, redirect back to track page
                        router.push('/track')
                      }}
                    />
                  </div>
                )
              } else if (isExerciseTool) {
                // Exercise tracker with custom fields
                const exerciseFields = [
                  { id: "exercise_type", name: "Exercise Type", type: "select", required: true, 
                    options: ["Walking", "Running", "Cycling", "Swimming", "Weight Training", "Yoga", "Pilates", "Dancing", "Sports", "Other"] },
                  { id: "duration", name: "Duration (minutes)", type: "number", required: true, min: 1, max: 300 },
                  { id: "intensity", name: "Intensity Level", type: "emoji_select", required: true,
                    options: [
                      { value: "low", emoji: "😌", label: "Low" },
                      { value: "moderate", emoji: "😊", label: "Moderate" },
                      { value: "high", emoji: "😤", label: "High" },
                      { value: "very_high", emoji: "🔥", label: "Very High" }
                    ]
                  },
                  { id: "calories", name: "Calories Burned", type: "number", required: false, min: 0 },
                  { id: "rating", name: "How did you feel? (1-10)", type: "scale", required: false, min: 1, max: 10 }
                ]
                
                // Update the effective preset to use exercise fields
                const exercisePreset = {
                  ...effectivePreset,
                  defaultSettings: {
                    ...effectivePreset.defaultSettings,
                    customFields: exerciseFields
                  }
                }
                
                // Update field values if not already set for exercise
                if (!fieldValues.exercise_type) {
                  const initialValues: FieldValue = {}
                  exerciseFields.forEach(field => {
                    if (field.type === 'scale') {
                      initialValues[field.id] = field.min || 1
                    } else {
                      initialValues[field.id] = ''
                    }
                  })
                  setFieldValues(prev => ({ ...prev, ...initialValues }))
                }
                
                return (
                  <>
                    {exerciseFields.map(field => renderField(field))}
                    
                    {/* Notes field */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
                      <Textarea
                        value={fieldValues.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        placeholder="Any additional notes about your workout..."
                        className="min-h-20"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex space-x-3 pt-4">
                      <Link href="/track" className="flex-1">
                        <Button variant="outline" className="w-full">
                          Cancel
                        </Button>
                      </Link>
                      <Button 
                        onClick={saveEntry} 
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
                            <Save className="w-4 h-4 mr-2" />
                            Save Workout
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )
              } else if (isMoodTool || isGeneralTool) {
                return (
                  <MoodTracker 
                    toolId={toolId} 
                    userTool={userTool}
                    onEntry={(entry) => {
                      setTodayEntries(prev => [entry, ...prev])
                      toast.success('Mood logged successfully!')
                    }}
                  />
                )
              } else {
                // Default to the dynamic form for all other tools
                return (
              /* Standard Dynamic Form for Other Tools */
              <>
                {/* Render form fields */}
                {effectivePreset?.defaultSettings?.customFields?.filter(field => field && field.id && field.name).map(field => renderField(field))}

                {/* Notes field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
                  <Textarea
                    value={fieldValues.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Any additional notes about this entry..."
                    className="min-h-20"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3 pt-4">
                  <Link href="/track" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    onClick={saveEntry} 
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
                        <Save className="w-4 h-4 mr-2" />
                        Save Entry
                      </>
                    )}
                  </Button>
                </div>
              </>
                )
              }
            })()}
          </CardContent>
        </Card>

        {/* Recent entries */}
        {todayEntries.length > 0 && (
          <Card className="wellness-card mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Today's Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayEntries.slice(0, 3).map((entry, index) => (
                  <div key={entry.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Entry #{todayEntries.length - index}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {Object.entries(entry.data).map(([key, value]) => {
                        if (key === 'notes' || !value) return null
                        const field = effectivePreset?.defaultSettings?.customFields?.find(f => f && f.id === key)
                        if (!field || !field.name) return null
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{field.name}:</span>
                            <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 