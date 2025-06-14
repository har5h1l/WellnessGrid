"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { AppLogo } from "@/components/app-logo"
import { Heart, User, ChevronRight, ChevronLeft, ArrowLeft, Plus, X, Stethoscope, Database, FileText, Shield, Upload, Book, Lightbulb, Settings, Wrench } from "lucide-react"
import Link from "next/link"
import { diseasePresets, mockInformationSources, mockProtocols, toolPresets } from "@/lib/data/mock-sources"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

// Group diseases by category
const diseasesByCategory = diseasePresets.reduce((acc, disease) => {
  if (!acc[disease.category]) {
    acc[disease.category] = []
  }
  acc[disease.category].push(disease)
  return acc
}, {} as Record<string, typeof diseasePresets>)

interface HealthCondition {
  id: string
  name: string
  type: "preset" | "custom"
  description: string
  category: string
  icon: string
}

interface InformationSource {
  id: string
  title: string
  type: string
  content: string
  url?: string
  author: string
  selected?: boolean
}

interface Protocol {
  id: string
  name: string
  description: string
  conditionId: string
  type: string
  selected?: boolean
}

interface HealthData {
  id: string
  type: 'ehr' | 'genetic' | 'lab_results' | 'imaging' | 'doctor_notes' | 'family_history' | 'other'
  title: string
  description: string
  content?: string
  fileName?: string
  fileSize?: string
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showConditionSelector, setShowConditionSelector] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Modal states
  const [showSourcesModal, setShowSourcesModal] = useState(false)
  const [showProtocolsModal, setShowProtocolsModal] = useState(false)
  const [showHealthDataModal, setShowHealthDataModal] = useState(false)
  const [activeConditionId, setActiveConditionId] = useState<string>("")

  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
  })

  // Health conditions state
  const [selectedConditions, setSelectedConditions] = useState<HealthCondition[]>([])
  const [customConditionName, setCustomConditionName] = useState("")

  // Knowledge base state
  const [selectedSources, setSelectedSources] = useState<Record<string, string[]>>({})
  const [customSources, setCustomSources] = useState<Record<string, InformationSource[]>>({})
  const [selectedProtocols, setSelectedProtocols] = useState<Record<string, string[]>>({})
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [newHealthData, setNewHealthData] = useState({
    type: 'ehr' as const,
    title: '',
    description: '',
    content: '',
    fileName: '',
    fileSize: ''
  })

  // Custom source/protocol state
  const [newCustomSource, setNewCustomSource] = useState({
    title: '',
    content: '',
    author: '',
    url: '',
    fileName: '',
    fileSize: ''
  })

  // Custom protocol state
  const [newCustomProtocol, setNewCustomProtocol] = useState({
    name: '',
    description: '',
    steps: '',
    fileName: '',
    fileSize: ''
  })

  // Tools state
  const [selectedTools, setSelectedTools] = useState<Record<string, string[]>>({})
  const [showToolsModal, setShowToolsModal] = useState(false)

  const totalSteps = 6
  const progress = (step / totalSteps) * 100

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await authHelpers.getCurrentUser()
        setCurrentUser(user)
        if (!user) {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [])

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleConditionAdd = (conditionId: string, isCustom = false, customName = "") => {
    const preset = diseasePresets.find(d => d.id === conditionId)
    if (!preset && !isCustom) return

    // Check for duplicates
    const exists = selectedConditions.some(c => 
      (isCustom && c.name.toLowerCase() === customName.toLowerCase()) ||
      (!isCustom && c.id === conditionId)
    )
    
    if (exists) return

    const newCondition: HealthCondition = {
      id: isCustom ? `custom-${Date.now()}` : conditionId,
      name: isCustom ? customName : preset!.name,
      type: isCustom ? "custom" : "preset",
      description: isCustom ? `Custom condition: ${customName}` : preset!.description,
      category: isCustom ? "Custom" : preset!.category,
      icon: isCustom ? "❓" : preset!.icon
    }

    setSelectedConditions(prev => [...prev, newCondition])
  }

  const handleConditionRemove = (conditionId: string) => {
    setSelectedConditions(prev => prev.filter(c => c.id !== conditionId))
  }

  const handleSourceToggle = (conditionId: string, sourceId: string) => {
    setSelectedSources(prev => ({
      ...prev,
      [conditionId]: prev[conditionId]?.includes(sourceId)
        ? prev[conditionId].filter(id => id !== sourceId)
        : [...(prev[conditionId] || []), sourceId]
    }))
  }

  const handleProtocolToggle = (conditionId: string, protocolId: string) => {
    setSelectedProtocols(prev => ({
      ...prev,
      [conditionId]: prev[conditionId]?.includes(protocolId)
        ? prev[conditionId].filter(id => id !== protocolId)
        : [...(prev[conditionId] || []), protocolId]
    }))
  }

  const addCustomSource = (conditionId: string) => {
    if (newCustomSource.title && newCustomSource.content) {
      const source: InformationSource = {
        id: `custom-source-${Date.now()}`,
        title: newCustomSource.title,
        type: "custom",
        content: newCustomSource.content,
        author: newCustomSource.author || "User",
        url: newCustomSource.url
      }
      
      setCustomSources(prev => ({
        ...prev,
        [conditionId]: [...(prev[conditionId] || []), source]
      }))
      
      // Auto-select the new custom source
      handleSourceToggle(conditionId, source.id)
      
      setNewCustomSource({
        title: '',
        content: '',
        author: '',
        url: '',
        fileName: '',
        fileSize: ''
      })
    }
  }

  const addCustomProtocol = (conditionId: string) => {
    if (newCustomProtocol.name && newCustomProtocol.description) {
      const protocol: Protocol = {
        id: `custom-protocol-${Date.now()}`,
        name: newCustomProtocol.name,
        description: newCustomProtocol.description,
        conditionId: conditionId,
        type: "custom",
        selected: true
      }
      
      // Auto-select the new custom protocol
      handleProtocolToggle(conditionId, protocol.id)
      
      setNewCustomProtocol({
        name: '',
        description: '',
        steps: '',
        fileName: '',
        fileSize: ''
      })
    }
  }

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev => ({
      ...prev,
      general: prev.general?.includes(toolId)
        ? prev.general.filter(id => id !== toolId)
        : [...(prev.general || []), toolId]
    }))
  }

  const addHealthData = () => {
    if (newHealthData.title && newHealthData.description) {
      const data: HealthData = {
        id: `data-${Date.now()}`,
        ...newHealthData
      }
      setHealthData(prev => [...prev, data])
      setNewHealthData({
        type: 'ehr',
        title: '',
        description: '',
        content: '',
        fileName: '',
        fileSize: ''
      })
    }
  }

  const removeHealthData = (id: string) => {
    setHealthData(prev => prev.filter(d => d.id !== id))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'health' | 'protocol') => {
    const file = event.target.files?.[0]
    if (file) {
      const fileName = file.name
      const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' MB'
      
      if (type === 'source') {
        setNewCustomSource(prev => ({ ...prev, fileName, fileSize }))
      } else if (type === 'health') {
        setNewHealthData(prev => ({ ...prev, fileName, fileSize }))
      } else if (type === 'protocol') {
        setNewCustomProtocol(prev => ({ ...prev, fileName, fileSize }))
      }
      
      // In a real app, you'd upload the file here and get a URL
      console.log('File selected:', fileName, fileSize)
    }
  }

  const handleComplete = async () => {
    if (!currentUser) {
      toast.error("Authentication required")
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      // Prepare data for Supabase
      const setupData = {
        profile: {
          id: currentUser.id,
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          wellness_score: 0,
        },
        conditions: selectedConditions.map(condition => ({
          condition_id: condition.id,
          name: condition.name,
          category: condition.category,
          description: condition.description,
          is_custom: condition.type === 'custom',
          icon: condition.icon,
        })),
        tools: Object.entries(selectedTools).flatMap(([toolId, toolNames]) =>
          toolNames.map(toolName => {
            const tool = toolPresets.find(t => t.name === toolName)
            return {
              tool_id: toolId,
              tool_name: toolName,
              tool_category: tool?.type || 'general',
            }
          })
        ),
        informationSources: Object.entries(selectedSources).flatMap(([conditionId, sourceIds]) =>
          sourceIds.map(sourceId => {
            const source = mockInformationSources.find(s => s.id === sourceId) ||
                          Object.values(customSources).flat().find(s => s.id === sourceId)
            return {
              condition_id: conditionId,
              source_id: sourceId,
              source_title: source?.title || 'Unknown Source',
              source_type: source?.type || 'custom',
              source_content: source?.content || '',
              source_url: source?.url || '',
              author: source?.author || '',
              is_custom: !mockInformationSources.find(s => s.id === sourceId),
            }
          })
        ),
        protocols: Object.entries(selectedProtocols).flatMap(([conditionId, protocolIds]) =>
          protocolIds.map(protocolId => {
            const protocol = mockProtocols.find(p => p.id === protocolId)
            return {
              condition_id: conditionId,
              protocol_id: protocolId,
              protocol_name: protocol?.name || 'Unknown Protocol',
              description: protocol?.description || '',
              protocol_type: protocol?.type || 'custom',
              steps: protocol?.steps || [],
              is_custom: false,
            }
          })
        ),
        healthData: healthData.map(data => ({
          data_type: data.type,
          title: data.title,
          description: data.description,
          content: data.content,
          file_name: data.fileName,
          file_size: data.fileSize,
        }))
      }

      // Save to Supabase
      console.log("Calling DatabaseService.completeUserSetup with:", setupData)
      const result = await DatabaseService.completeUserSetup(setupData)
      console.log("Setup completed successfully:", result)
      
      // Add a small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Setup completed successfully!")
      
      // Redirect to dashboard with a clean route
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Setup failed:")
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      console.error("Error message:", error?.message)
      console.error("Error stack:", error?.stack)
      console.error("Full error object:", error)
      
      // Show more specific error message to user
      const errorMessage = error?.message || "Setup failed. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Get relevant sources and protocols for a specific condition
  const getRelevantSources = (conditionId: string) => {
    const condition = selectedConditions.find(c => c.id === conditionId)
    if (!condition) return []
    
    return mockInformationSources.filter(source => 
      source.tags.some(tag => 
        condition.name.toLowerCase().includes(tag) || 
        condition.id.includes(tag)
      )
    )
  }

  const getRelevantProtocols = (conditionId: string) => {
    return mockProtocols.filter(protocol => protocol.conditionId === conditionId)
  }

  const openSourcesModal = (conditionId: string) => {
    setActiveConditionId(conditionId)
    setShowSourcesModal(true)
  }

  const openProtocolsModal = (conditionId: string) => {
    setActiveConditionId(conditionId)
    setShowProtocolsModal(true)
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated (this shouldn't render due to useEffect)
  if (!currentUser) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <AppLogo variant="icon" size="sm" />
        </div>
        <div className="text-sm text-gray-500">
          Step {step} of {totalSteps}
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress} className="h-3 rounded-full" />
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-red-50 mx-auto mb-4">
                  <User className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Welcome to WellnessGrid</CardTitle>
                <p className="text-gray-600">Let's start by getting to know you</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">What's your name?</Label>
                  <Input
                    id="name"
                    placeholder="Your first name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="mt-1 rounded-2xl"
                  />
                </div>

                <div>
                  <Label htmlFor="age">How old are you?</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Your age"
                    value={profile.age}
                    onChange={(e) => handleProfileChange("age", e.target.value)}
                    className="mt-1 rounded-2xl"
                    min="13"
                    max="120"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    className="wellness-button-primary"
                    onClick={() => setStep(2)}
                    disabled={!profile.name || !profile.age}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Additional Info */}
          {step === 2 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-pink-50 mx-auto mb-4">
                  <User className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl">Tell us more about yourself</CardTitle>
                <p className="text-gray-600">This helps us personalize your experience</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select 
                    id="gender"
                    value={profile.gender}
                    onChange={(e) => handleProfileChange("gender", e.target.value)}
                    className="mt-1 w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="e.g., 165"
                      value={profile.height}
                      onChange={(e) => handleProfileChange("height", e.target.value)}
                      className="mt-1 rounded-2xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="e.g., 60"
                      value={profile.weight}
                      onChange={(e) => handleProfileChange("weight", e.target.value)}
                      className="mt-1 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button className="wellness-button-primary" onClick={() => setStep(3)} disabled={!profile.gender}>
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Health Conditions */}
          {step === 3 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-red-50 mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Health Conditions</CardTitle>
                <p className="text-gray-600">Select the conditions you're managing</p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Selected Conditions */}
                {selectedConditions.map((condition) => (
                  <Card key={condition.id} className="border border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{condition.icon}</span>
                          <div>
                            <h4 className="font-medium">{condition.name}</h4>
                            <p className="text-sm text-gray-600">{condition.description}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {condition.category}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleConditionRemove(condition.id)}>
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Condition Button */}
                <Card
                  className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-red-400 transition-colors"
                  onClick={() => setShowConditionSelector(true)}
                >
                  <CardContent className="p-6 text-center">
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Add Condition</p>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    className="wellness-button-primary"
                    onClick={() => setStep(4)}
                    disabled={selectedConditions.length === 0}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Knowledge Base Configuration */}
          {step === 4 && (
            <div className="space-y-8">
              <Card className="wellness-card">
                <CardHeader className="text-center">
                  <div className="wellness-icon-container bg-blue-50 mx-auto mb-4">
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Configure Your Knowledge Base</CardTitle>
                  <p className="text-gray-600">Set up information sources, health data, and protocols</p>
                </CardHeader>
              </Card>

              {/* Information Sources per Condition */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Book className="w-5 h-5 mr-2" />
                    Medical Information Sources
                  </CardTitle>
                  <p className="text-sm text-gray-600">Configure information sources for each condition</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedConditions.map((condition) => (
                    <Card key={condition.id} className="border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{condition.icon}</span>
                            <div>
                              <h4 className="font-medium">{condition.name}</h4>
                              <p className="text-sm text-gray-600">
                                {selectedSources[condition.id]?.length || 0} sources selected
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => openSourcesModal(condition.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Health Records & Data */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Health Records & Data
                  </CardTitle>
                  <p className="text-sm text-gray-600">Manage your health records and genetic information</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing health data */}
                  {healthData.map((data) => (
                    <Card key={data.id} className="border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{data.title}</h4>
                            <p className="text-sm text-gray-600">{data.description}</p>
                            {data.fileName && (
                              <p className="text-xs text-gray-500 mt-1">
                                📄 {data.fileName} ({data.fileSize})
                              </p>
                            )}
                            <Badge variant="outline" className="mt-1 text-xs">
                              {data.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeHealthData(data.id)}>
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Add health data button */}
                  <Card
                    className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => setShowHealthDataModal(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Add Health Data</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Treatment Protocols per Condition */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Treatment Protocols & Guidelines
                  </CardTitle>
                  <p className="text-sm text-gray-600">Configure treatment protocols for each condition</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedConditions.map((condition) => (
                    <Card key={condition.id} className="border border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{condition.icon}</span>
                            <div>
                              <h4 className="font-medium">{condition.name}</h4>
                              <p className="text-sm text-gray-600">
                                {selectedProtocols[condition.id]?.length || 0} protocols selected
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => openProtocolsModal(condition.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)} className="rounded-full">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button className="wellness-button-primary" onClick={() => setStep(5)}>
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Tools Configuration */}
          {step === 5 && (
            <div className="space-y-8">
              <Card className="wellness-card">
                <CardHeader className="text-center">
                  <div className="wellness-icon-container bg-purple-50 mx-auto mb-4">
                    <Wrench className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">Configure Health Tools</CardTitle>
                  <p className="text-gray-600">Select tracking tools and reminders for your conditions</p>
                </CardHeader>
              </Card>

              {/* Health Tracking Tools */}
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Health Tracking Tools
                  </CardTitle>
                  <p className="text-sm text-gray-600">Choose tools to track your symptoms, medications, and progress</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Tools Display */}
                  {(selectedTools.general || []).map((toolId) => {
                    const tool = toolPresets.find(t => t.id === toolId)
                    if (!tool) return null
                    
                    return (
                      <Card key={toolId} className="border border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{tool.name}</h4>
                              <p className="text-sm text-gray-600">{tool.description}</p>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {tool.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleToolToggle(toolId)}>
                              Remove
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {/* Add Tools Button */}
                  <Card
                    className="border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-400 transition-colors"
                    onClick={() => setShowToolsModal(true)}
                  >
                    <CardContent className="p-6 text-center">
                      <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Add Health Tool</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(4)} className="rounded-full">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button className="wellness-button-primary" onClick={() => setStep(6)}>
                  Continue <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Complete Setup */}
          {step === 6 && (
            <Card className="wellness-card">
              <CardHeader className="text-center">
                <div className="wellness-icon-container bg-green-50 mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Almost Done!</CardTitle>
                <p className="text-gray-600">We're setting up your personalized health journey</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Hi {profile.name}! We're preparing your wellness dashboard.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    You'll be managing: {selectedConditions.map(c => c.name).join(", ")}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Information sources: {Object.values(selectedSources).flat().length} selected
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Health records: {healthData.length} added
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Treatment protocols: {Object.values(selectedProtocols).flat().length} selected
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Health tools: {selectedTools.general?.length || 0} selected
                  </p>
                  <p className="text-sm text-gray-500">
                    This will help you track your health and manage your conditions effectively.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(5)} className="rounded-full">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button
                    className="wellness-button-primary px-8 py-6 text-lg"
                    onClick={handleComplete}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    ) : (
                      <Heart className="w-5 h-5 mr-2" />
                    )}
                    {loading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Condition Selector Modal */}
        {showConditionSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Select Health Conditions</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowConditionSelector(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Choose from 20+ major chronic conditions</p>
              </div>
              <div className="p-6">
                {/* Custom Condition Input */}
                <div className="mb-6">
                  <Label className="text-sm font-medium">Add Custom Condition</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Enter condition name (e.g., Fibromyalgia)"
                      value={customConditionName}
                      onChange={(e) => setCustomConditionName(e.target.value)}
                      className="rounded-2xl"
                    />
                    <Button
                      onClick={() => {
                        if (customConditionName.trim()) {
                          handleConditionAdd("", true, customConditionName.trim())
                          setCustomConditionName("")
                          setShowConditionSelector(false)
                        }
                      }}
                      disabled={!customConditionName.trim()}
                      className="wellness-button-primary"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Disease Categories */}
                <div className="space-y-6">
                  {Object.entries(diseasesByCategory).map(([category, diseases]) => (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-full mr-2">{diseases.length}</span>
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {diseases.map((disease) => {
                          const isSelected = selectedConditions.some(c => c.id === disease.id)
                          return (
                            <Card
                              key={disease.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'border-red-300 bg-red-50 shadow-sm' : 'hover:border-red-200'
                              }`}
                              onClick={() => {
                                if (!isSelected) {
                                  handleConditionAdd(disease.id)
                                  setShowConditionSelector(false)
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">{disease.icon}</span>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{disease.name}</h5>
                                    <p className="text-sm text-gray-600 line-clamp-2">{disease.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedConditions.length} condition{selectedConditions.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button onClick={() => setShowConditionSelector(false)} className="wellness-button-primary">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Information Sources Modal */}
        {showSourcesModal && activeConditionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Configure Information Sources</h3>
                    <p className="text-sm text-gray-600">
                      {selectedConditions.find(c => c.id === activeConditionId)?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowSourcesModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Add Custom Source */}
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="p-4 space-y-4">
                    <h4 className="font-medium">Add Custom Source</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g., My Doctor's Notes"
                          value={newCustomSource.title}
                          onChange={(e) => setNewCustomSource(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Author</Label>
                        <Input
                          placeholder="e.g., Dr. Smith"
                          value={newCustomSource.author}
                          onChange={(e) => setNewCustomSource(prev => ({ ...prev, author: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Content/Description</Label>
                      <Textarea
                        placeholder="Describe the information source..."
                        value={newCustomSource.content}
                        onChange={(e) => setNewCustomSource(prev => ({ ...prev, content: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>URL (optional)</Label>
                      <Input
                        placeholder="https://..."
                        value={newCustomSource.url}
                        onChange={(e) => setNewCustomSource(prev => ({ ...prev, url: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Upload File (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          onChange={(e) => handleFileUpload(e, 'source')}
                          className="mt-1"
                          accept=".pdf,.doc,.docx,.txt"
                        />
                        {newCustomSource.fileName && (
                          <span className="text-sm text-gray-500">
                            📄 {newCustomSource.fileName}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => addCustomSource(activeConditionId)}
                      disabled={!newCustomSource.title || !newCustomSource.content}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Source
                    </Button>
                  </CardContent>
                </Card>

                {/* Preset Sources */}
                <div>
                  <h4 className="font-medium mb-4">Available Sources</h4>
                  <div className="space-y-3">
                    {getRelevantSources(activeConditionId).map((source) => (
                      <div key={source.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedSources[activeConditionId]?.includes(source.id) || false}
                          onCheckedChange={() => handleSourceToggle(activeConditionId, source.id)}
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{source.title}</h5>
                          <p className="text-sm text-gray-600">{source.content}</p>
                          <p className="text-xs text-gray-500 mt-1">By {source.author}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {source.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Custom Sources */}
                    {customSources[activeConditionId]?.map((source) => (
                      <div key={source.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-blue-50">
                        <Checkbox
                          checked={selectedSources[activeConditionId]?.includes(source.id) || false}
                          onCheckedChange={() => handleSourceToggle(activeConditionId, source.id)}
                        />
                        <div className="flex-1">
                          <h5 className="font-medium">{source.title}</h5>
                          <p className="text-sm text-gray-600">{source.content}</p>
                          <p className="text-xs text-gray-500 mt-1">By {source.author}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            Custom Source
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedSources[activeConditionId]?.length || 0} sources selected
                  </p>
                  <Button onClick={() => setShowSourcesModal(false)} className="wellness-button-primary">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Data Modal */}
        {showHealthDataModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Health Data</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowHealthDataModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <select
                      value={newHealthData.type}
                      onChange={(e) => setNewHealthData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="ehr">Electronic Health Records</option>
                      <option value="genetic">Genetic Information</option>
                      <option value="lab_results">Lab Results</option>
                      <option value="imaging">Medical Imaging</option>
                      <option value="doctor_notes">Doctor Notes</option>
                      <option value="family_history">Family History</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g., Recent Blood Work"
                      value={newHealthData.title}
                      onChange={(e) => setNewHealthData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of the data..."
                    value={newHealthData.description}
                    onChange={(e) => setNewHealthData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'health')}
                      className="mt-1"
                      accept=".pdf,.doc,.docx,.jpg,.png,.dicom"
                    />
                    {newHealthData.fileName && (
                      <span className="text-sm text-gray-500">
                        📄 {newHealthData.fileName}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any additional notes or context..."
                    value={newHealthData.content}
                    onChange={(e) => setNewHealthData(prev => ({ ...prev, content: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowHealthDataModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      addHealthData()
                      setShowHealthDataModal(false)
                    }}
                    disabled={!newHealthData.title || !newHealthData.description}
                    className="wellness-button-primary"
                  >
                    Add Health Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Protocols Modal */}
        {showProtocolsModal && activeConditionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Configure Treatment Protocols</h3>
                    <p className="text-sm text-gray-600">
                      {selectedConditions.find(c => c.id === activeConditionId)?.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowProtocolsModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
                             <div className="p-6 space-y-6">
                 {/* Add Custom Protocol */}
                 <Card className="border-2 border-dashed border-gray-300">
                   <CardContent className="p-4 space-y-4">
                     <h4 className="font-medium">Add Custom Protocol</h4>
                     <div className="grid grid-cols-1 gap-4">
                       <div>
                         <Label>Protocol Name</Label>
                         <Input
                           placeholder="e.g., My Daily Routine"
                           value={newCustomProtocol.name}
                           onChange={(e) => setNewCustomProtocol(prev => ({ ...prev, name: e.target.value }))}
                           className="mt-1"
                         />
                       </div>
                       <div>
                         <Label>Description</Label>
                         <Textarea
                           placeholder="Describe your custom protocol..."
                           value={newCustomProtocol.description}
                           onChange={(e) => setNewCustomProtocol(prev => ({ ...prev, description: e.target.value }))}
                           className="mt-1"
                         />
                       </div>
                       <div>
                         <Label>Steps/Instructions</Label>
                         <Textarea
                           placeholder="List the steps or instructions for this protocol..."
                           value={newCustomProtocol.steps}
                           onChange={(e) => setNewCustomProtocol(prev => ({ ...prev, steps: e.target.value }))}
                           className="mt-1"
                         />
                       </div>
                       <div>
                         <Label>Upload File (optional)</Label>
                         <div className="flex items-center gap-2">
                           <Input
                             type="file"
                             onChange={(e) => handleFileUpload(e, 'protocol')}
                             className="mt-1"
                             accept=".pdf,.doc,.docx,.txt"
                           />
                           {newCustomProtocol.fileName && (
                             <span className="text-sm text-gray-500">
                               📄 {newCustomProtocol.fileName}
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                     <Button
                       onClick={() => addCustomProtocol(activeConditionId)}
                       disabled={!newCustomProtocol.name || !newCustomProtocol.description}
                       className="w-full"
                       variant="outline"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Add Custom Protocol
                     </Button>
                   </CardContent>
                 </Card>

                 {/* Preset Protocols */}
                 <div>
                   <h4 className="font-medium mb-4">Available Protocols</h4>
                   <div className="space-y-3">
                     {getRelevantProtocols(activeConditionId).map((protocol) => (
                       <div key={protocol.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                         <Checkbox
                           checked={selectedProtocols[activeConditionId]?.includes(protocol.id) || false}
                           onCheckedChange={() => handleProtocolToggle(activeConditionId, protocol.id)}
                         />
                         <div className="flex-1">
                           <h4 className="font-medium">{protocol.name}</h4>
                           <p className="text-sm text-gray-600">{protocol.description}</p>
                           <Badge variant="outline" className="mt-1 text-xs">
                             Evidence-Based Protocol
                           </Badge>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedProtocols[activeConditionId]?.length || 0} protocols selected
                  </p>
                  <Button onClick={() => setShowProtocolsModal(false)} className="wellness-button-primary">
                    Done
                  </Button>
                </div>
              </div>
            </div>
                     </div>
         )}

         {/* Tools Modal */}
         {showToolsModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
               <div className="p-6 border-b">
                 <div className="flex items-center justify-between">
                   <h3 className="text-lg font-semibold">Select Health Tools</h3>
                   <Button variant="ghost" size="sm" onClick={() => setShowToolsModal(false)}>
                     <X className="w-4 h-4" />
                   </Button>
                 </div>
                 <p className="text-sm text-gray-600 mt-1">Choose tools to track your health and manage your conditions</p>
               </div>
               <div className="p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {toolPresets.map((tool) => {
                     const isSelected = selectedTools.general?.includes(tool.id) || false
                     const hasRelevantConditions = tool.applicableConditions.includes('all') || 
                       selectedConditions.some(condition => 
                         tool.applicableConditions.includes(condition.id)
                       )
                     
                     return (
                       <Card
                         key={tool.id}
                         className={`cursor-pointer transition-all hover:shadow-md ${
                           isSelected ? 'border-purple-300 bg-purple-50 shadow-sm' : 'hover:border-purple-200'
                         }`}
                         onClick={() => {
                           if (!isSelected) {
                             handleToolToggle(tool.id)
                           }
                         }}
                       >
                         <CardContent className="p-4">
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <h4 className="font-medium mb-2">{tool.name}</h4>
                               <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
                               <Badge variant="outline" className="text-xs mb-2">
                                 {tool.type.replace('_', ' ').toUpperCase()}
                               </Badge>
                               {tool.applicableConditions.includes('all') ? (
                                 <p className="text-xs text-gray-500">✅ Universal Tool</p>
                               ) : hasRelevantConditions ? (
                                 <div className="flex flex-wrap gap-1">
                                   {tool.applicableConditions.map(conditionId => {
                                     const condition = selectedConditions.find(c => c.id === conditionId)
                                     return condition ? (
                                       <span key={conditionId} className="text-xs text-green-600">
                                         ✅ {condition.name}
                                       </span>
                                     ) : null
                                   })}
                                 </div>
                               ) : (
                                 <p className="text-xs text-gray-500">📊 General Health Tool</p>
                               )}
                             </div>
                             {isSelected && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={(e) => {
                                   e.stopPropagation()
                                   handleToolToggle(tool.id)
                                 }}
                               >
                                 Remove
                               </Button>
                             )}
                           </div>
                         </CardContent>
                       </Card>
                     )
                   })}
                 </div>
               </div>
               <div className="p-6 border-t bg-gray-50">
                 <div className="flex justify-between items-center">
                   <p className="text-sm text-gray-600">
                     {selectedTools.general?.length || 0} tools selected
                   </p>
                   <Button onClick={() => setShowToolsModal(false)} className="wellness-button-primary">
                     Done
                   </Button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </main>
    </div>
  )
}
