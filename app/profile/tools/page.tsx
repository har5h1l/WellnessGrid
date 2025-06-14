"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Settings, Plus, Search, Filter, Wrench, Activity, Heart, Brain, Target, Clock, Bell } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { UserTool, HealthCondition } from "@/lib/database"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"
import { toolPresets } from "@/lib/data/mock-sources"

export default function ToolsManagementPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userTools, setUserTools] = useState<UserTool[]>([])
  const [userConditions, setUserConditions] = useState<HealthCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAddTool, setShowAddTool] = useState(false)
  const [editingTool, setEditingTool] = useState<string | null>(null)

  // Load user data
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
        setUserConditions(userData.conditions)
      } catch (error) {
        console.error('Error loading tools data:', error)
        toast.error('Failed to load tools data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Get available tools based on user's conditions
  const getAvailableTools = () => {
    const userConditionIds = userConditions.map(c => c.condition_id)
    const enabledToolIds = userTools.map(t => t.tool_id)
    
    return toolPresets.filter(tool => {
      // Check if tool is applicable to user's conditions or is general
      const isApplicable = tool.applicableConditions.includes('all') || 
                          tool.applicableConditions.some(conditionId => userConditionIds.includes(conditionId))
      
      // Check if tool is not already enabled
      const isNotEnabled = !enabledToolIds.includes(tool.id)
      
      return isApplicable && isNotEnabled
    })
  }

  // Filter tools based on search and category
  const getFilteredTools = (tools: typeof toolPresets) => {
    let filtered = tools

    if (searchQuery) {
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(tool => tool.type === selectedCategory)
    }

    return filtered
  }

  // Toggle tool enable/disable
  const toggleTool = async (tool: UserTool, enabled: boolean) => {
    if (!currentUser) return

    try {
      await DatabaseService.updateUserTool(tool.id!, { is_enabled: enabled })
      
      setUserTools(prev => prev.map(t => 
        t.id === tool.id ? { ...t, is_enabled: enabled } : t
      ))
      
      toast.success(`${tool.tool_name} ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating tool:', error)
      toast.error('Failed to update tool')
    }
  }

  // Add new tool
  const addTool = async (toolPreset: typeof toolPresets[0]) => {
    if (!currentUser) return

    try {
      const newTool = {
        user_id: currentUser.id,
        tool_id: toolPreset.id,
        tool_name: toolPreset.name,
        tool_category: toolPreset.type,
        is_enabled: true,
        settings: toolPreset.defaultSettings || {}
      }

      const createdTools = await DatabaseService.createUserTools([newTool])
      if (createdTools && createdTools.length > 0) {
        setUserTools(prev => [...prev, createdTools[0]])
        toast.success(`${toolPreset.name} added successfully`)
      }
    } catch (error) {
      console.error('Error adding tool:', error)
      toast.error('Failed to add tool')
    }
  }

  // Remove tool
  const removeTool = async (tool: UserTool) => {
    if (!currentUser) return

    try {
      await DatabaseService.updateUserTool(tool.id!, { is_enabled: false })
      setUserTools(prev => prev.filter(t => t.id !== tool.id))
      toast.success(`${tool.tool_name} removed`)
    } catch (error) {
      console.error('Error removing tool:', error)
      toast.error('Failed to remove tool')
    }
  }

  // Get tool categories
  const getCategories = () => {
    const categories = new Set(toolPresets.map(tool => tool.type))
    return Array.from(categories)
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'custom': return <Activity className="w-4 h-4" />
      case 'mood_tracker': return <Brain className="w-4 h-4" />
      case 'symptom_tracker': return <Heart className="w-4 h-4" />
      case 'medication_reminder': return <Target className="w-4 h-4" />
      default: return <Wrench className="w-4 h-4" />
    }
  }

  // Update tool settings
  const updateToolSettings = async (toolId: string, settings: any) => {
    if (!currentUser) return

    try {
      await DatabaseService.updateUserTool(toolId, { settings })
      
      setUserTools(prev => prev.map(t => 
        t.id === toolId ? { ...t, settings: { ...t.settings, ...settings } } : t
      ))
      
      toast.success('Tool settings updated')
    } catch (error) {
      console.error('Error updating tool settings:', error)
      toast.error('Failed to update tool settings')
    }
  }

  // Render tool settings form
  const renderToolSettings = (tool: UserTool, toolPreset: typeof toolPresets[0]) => {
    if (!toolPreset) return null

    const currentSettings = tool.settings || {}

    return (
      <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Tool Settings</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingTool(null)}
          >
            Done
          </Button>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Notifications</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentSettings.notifications !== false}
              onCheckedChange={(checked) => 
                updateToolSettings(tool.id!, { ...currentSettings, notifications: checked })
              }
            />
            <span className="text-sm">Enable reminders</span>
          </div>
        </div>

        {/* Reminder Times */}
        {currentSettings.notifications !== false && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reminder Times</Label>
            <div className="grid grid-cols-2 gap-2">
              {(currentSettings.reminderTimes || toolPreset.defaultSettings.reminderTimes || []).map((time, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const newTimes = [...(currentSettings.reminderTimes || toolPreset.defaultSettings.reminderTimes || [])]
                      newTimes[index] = e.target.value
                      updateToolSettings(tool.id!, { ...currentSettings, reminderTimes: newTimes })
                    }}
                    className="text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newTimes = (currentSettings.reminderTimes || toolPreset.defaultSettings.reminderTimes || []).filter((_, i) => i !== index)
                      updateToolSettings(tool.id!, { ...currentSettings, reminderTimes: newTimes })
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTimes = [...(currentSettings.reminderTimes || toolPreset.defaultSettings.reminderTimes || []), "12:00"]
                  updateToolSettings(tool.id!, { ...currentSettings, reminderTimes: newTimes })
                }}
              >
                Add Time
              </Button>
            </div>
          </div>
        )}

        {/* Custom Fields Settings */}
        {toolPreset.defaultSettings.customFields && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Field Configuration</Label>
            <div className="space-y-2">
              {toolPreset.defaultSettings.customFields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!currentSettings.disabledFields?.includes(field.id)}
                      onCheckedChange={(checked) => {
                        const disabledFields = currentSettings.disabledFields || []
                        const newDisabledFields = checked 
                          ? disabledFields.filter(id => id !== field.id)
                          : [...disabledFields, field.id]
                        updateToolSettings(tool.id!, { ...currentSettings, disabledFields: newDisabledFields })
                      }}
                    />
                    <span className="text-sm">{field.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Sharing */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Data Sharing</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={currentSettings.shareWithDoctor}
                onCheckedChange={(checked) => 
                  updateToolSettings(tool.id!, { ...currentSettings, shareWithDoctor: checked })
                }
              />
              <span className="text-sm">Share with healthcare provider</span>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={currentSettings.exportEnabled}
                onCheckedChange={(checked) => 
                  updateToolSettings(tool.id!, { ...currentSettings, exportEnabled: checked })
                }
              />
              <span className="text-sm">Enable data export</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tools...</p>
        </div>
      </div>
    )
  }

  const availableTools = getAvailableTools()
  const filteredEnabledTools = getFilteredTools(userTools.map(ut => ({
    ...toolPresets.find(tp => tp.id === ut.tool_id) || { id: ut.tool_id, name: ut.tool_name, type: ut.tool_category || 'custom', description: '', applicableConditions: ['all'], defaultSettings: {} },
    userTool: ut
  })))
  const filteredAvailableTools = getFilteredTools(availableTools)

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">Manage Tools</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowAddTool(!showAddTool)}
          className="text-gray-600"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full whitespace-nowrap"
            >
              All
            </Button>
            {getCategories().map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full whitespace-nowrap flex items-center gap-2"
              >
                {getCategoryIcon(category)}
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {/* Enabled Tools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Your Tools ({userTools.filter(t => t.is_enabled).length})
            </h2>
          </div>

          {userTools.filter(t => t.is_enabled).length === 0 ? (
            <Card className="wellness-card">
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tools Enabled</h3>
                <p className="text-gray-600 mb-4">Add some tracking tools to monitor your health</p>
                <Button 
                  onClick={() => setShowAddTool(true)}
                  className="wellness-button-primary"
                >
                  Browse Available Tools
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEnabledTools.map((tool) => {
                const toolPreset = toolPresets.find(tp => tp.id === tool.userTool?.tool_id)
                const isEditing = editingTool === tool.userTool?.id
                
                return (
                  <Card key={tool.userTool?.id} className="wellness-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {getCategoryIcon(tool.type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="capitalize">
                                {tool.type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-green-600">
                                Active
                              </Badge>
                              {tool.userTool?.settings?.notifications && (
                                <Badge variant="outline" className="text-blue-600 flex items-center gap-1">
                                  <Bell className="w-3 h-3" />
                                  Reminders
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTool(isEditing ? null : tool.userTool?.id || null)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Switch
                            checked={tool.userTool?.is_enabled || false}
                            onCheckedChange={(checked) => tool.userTool && toggleTool(tool.userTool, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => tool.userTool && removeTool(tool.userTool)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      
                      {/* Tool Settings */}
                      {isEditing && tool.userTool && toolPreset && renderToolSettings(tool.userTool, toolPreset)}
                      
                      {/* Quick Use Button */}
                      {!isEditing && (
                        <div className="mt-3 pt-3 border-t">
                          <Link href={`/track/${tool.userTool?.tool_id}`}>
                            <Button size="sm" className="wellness-button-primary w-full">
                              <Activity className="w-4 h-4 mr-2" />
                              Use Tool Now
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Tools */}
        {(showAddTool || userTools.filter(t => t.is_enabled).length === 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Available Tools ({filteredAvailableTools.length})
              </h2>
              {showAddTool && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddTool(false)}
                >
                  Hide
                </Button>
              )}
            </div>

            {filteredAvailableTools.length === 0 ? (
              <Card className="wellness-card">
                <CardContent className="p-8 text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Available Tools</h3>
                  <p className="text-gray-600">All applicable tools are already enabled, or try adjusting your search filters.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAvailableTools.map((tool) => (
                  <Card key={tool.id} className="wellness-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {getCategoryIcon(tool.type)}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                            <p className="text-sm text-gray-600">{tool.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="capitalize">
                                {tool.type.replace('_', ' ')}
                              </Badge>
                              {tool.applicableConditions.includes('all') ? (
                                <Badge variant="outline">Universal</Badge>
                              ) : (
                                <Badge variant="outline">
                                  For {userConditions.filter(c => tool.applicableConditions.includes(c.condition_id)).map(c => c.name).join(', ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => addTool(tool)}
                          className="wellness-button-primary"
                          size="sm"
                        >
                          Add Tool
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
} 