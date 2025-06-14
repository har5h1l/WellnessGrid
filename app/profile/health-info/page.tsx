"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, ChevronRight, FileText, Pill, Target, Settings, Database, Book, Shield, Upload, Globe, Users } from "lucide-react"
import Link from "next/link"
import { DatabaseService, authHelpers } from "@/lib/database"
import type { UserProfile, HealthCondition, InformationSource, UserProtocol, HealthData } from "@/lib/database"
import type { User } from '@supabase/supabase-js'
import { toast } from "sonner"

export default function HealthInfoPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conditions, setConditions] = useState<HealthCondition[]>([])
  const [informationSources, setInformationSources] = useState<InformationSource[]>([])
  const [protocols, setProtocols] = useState<UserProtocol[]>([])
  const [healthData, setHealthData] = useState<HealthData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setLoading(true)
        
        const user = await authHelpers.getCurrentUser()
        if (!user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        const userData = await DatabaseService.getUserCompleteData(user.id)
        
        if (!userData.profile) {
          router.push('/setup')
          return
        }

        setUserProfile(userData.profile)
        setConditions(userData.conditions)
        setInformationSources(userData.informationSources)
        setProtocols(userData.protocols)
        setHealthData(userData.healthData)
      } catch (error) {
        console.error('Error loading health data:', error)
        toast.error('Failed to load health information')
      } finally {
        setLoading(false)
      }
    }

    loadHealthData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health information...</p>
        </div>
      </div>
    )
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">Please log in to access your health information</p>
          <Link href="/login">
            <Button className="wellness-button-primary">Log In</Button>
          </Link>
        </div>
      </div>
    )
  }

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
          <h1 className="text-lg font-bold text-gray-900">Your Health Settings</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="wellness-icon-container bg-blue-50 mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Conditions</h3>
              <p className="text-xs text-gray-600">{conditions.length} active</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="wellness-icon-container bg-green-50 mx-auto mb-3">
                <Book className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Sources</h3>
              <p className="text-xs text-gray-600">{informationSources.length} configured</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="wellness-icon-container bg-purple-50 mx-auto mb-3">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Protocols</h3>
              <p className="text-xs text-gray-600">{protocols.length} active</p>
            </CardContent>
          </Card>

          <Card className="wellness-card">
            <CardContent className="p-4 text-center">
              <div className="wellness-icon-container bg-orange-50 mx-auto mb-3">
                <Database className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Data Points</h3>
              <p className="text-xs text-gray-600">{healthData.length} entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="sources" className="text-xs">Sources</TabsTrigger>
            <TabsTrigger value="protocols" className="text-xs">Protocols</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Health Conditions */}
            <Card className="wellness-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  Health Conditions
                  <Button size="sm" className="wellness-button-primary">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conditions.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No conditions added yet</p>
                  </div>
                ) : (
                  conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div>
                          <h4 className="font-medium text-gray-900">{condition.name}</h4>
                          <p className="text-sm text-gray-600">
                            Since {new Date(condition.diagnosed_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={condition.severity === 'severe' ? 'destructive' : condition.severity === 'moderate' ? 'default' : 'secondary'}>
                        {condition.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="wellness-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Health Profile Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{conditions.length}</div>
                    <div className="text-sm text-gray-600">Conditions Tracked</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{informationSources.length}</div>
                    <div className="text-sm text-gray-600">Information Sources</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Information Sources Tab */}
          <TabsContent value="sources" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Information Sources</h3>
              <Button size="sm" className="wellness-button-primary">
                <Plus className="w-4 h-4 mr-1" />
                Add Source
              </Button>
            </div>

            {informationSources.length === 0 ? (
              <Card className="wellness-card">
                <CardContent className="p-6 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">No information sources configured</h4>
                  <p className="text-gray-600 mb-4">Add trusted sources for health information and research</p>
                </CardContent>
              </Card>
            ) : (
              informationSources.map((source) => (
                <Card key={source.id} className="wellness-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="wellness-icon-container bg-green-50">
                          <Globe className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{source.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{source.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{source.type}</Badge>
                            <Badge variant={source.is_trusted ? "default" : "secondary"}>
                              {source.is_trusted ? "Trusted" : "Standard"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Protocols & Guidelines</h3>
              <Button size="sm" className="wellness-button-primary">
                <Plus className="w-4 h-4 mr-1" />
                Add Protocol
              </Button>
            </div>

            {protocols.length === 0 ? (
              <Card className="wellness-card">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">No protocols configured</h4>
                  <p className="text-gray-600 mb-4">Add treatment protocols and care guidelines</p>
                </CardContent>
              </Card>
            ) : (
              protocols.map((protocol) => (
                <Card key={protocol.id} className="wellness-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="wellness-icon-container bg-purple-50">
                          <Shield className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{protocol.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{protocol.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{protocol.type}</Badge>
                            <Badge variant={protocol.is_active ? "default" : "secondary"}>
                              {protocol.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Health Data Tab */}
          <TabsContent value="data" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Health Data Entries</h3>
              <Button size="sm" className="wellness-button-primary">
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </div>

            {healthData.length === 0 ? (
              <Card className="wellness-card">
                <CardContent className="p-6 text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">No health data recorded</h4>
                  <p className="text-gray-600 mb-4">Start tracking your health metrics and observations</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {healthData.slice(0, 10).map((entry) => (
                  <Card key={entry.id} className="wellness-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="wellness-icon-container bg-orange-50">
                            <Database className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{entry.data_type}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(entry.recorded_at).toLocaleDateString()} • 
                              Value: {typeof entry.value === 'object' ? JSON.stringify(entry.value) : entry.value}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{entry.unit || 'N/A'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {healthData.length > 10 && (
                  <div className="text-center py-4">
                    <Button variant="outline" size="sm">
                      View All {healthData.length} Entries
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Data Management Actions */}
        <Card className="wellness-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
              <Button variant="outline" className="flex items-center justify-start space-x-3 p-4 h-auto w-full">
                <Upload className="w-5 h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm">Export Data</div>
                  <div className="text-xs text-gray-600 truncate">Download your health information</div>
                </div>
              </Button>
              
              <Button variant="outline" className="flex items-center justify-start space-x-3 p-4 h-auto w-full">
                <Settings className="w-5 h-5 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm">Privacy Settings</div>
                  <div className="text-xs text-gray-600 truncate">Manage data sharing preferences</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
