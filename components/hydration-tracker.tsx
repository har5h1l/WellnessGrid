"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatabaseService, authHelpers } from "@/lib/database"
import { Droplet, Plus, Target } from "lucide-react"
import { toast } from "sonner"

interface HydrationTrackerProps {
  toolId: string
  userTool: any
  onEntry?: (entry: any) => void
}

export function HydrationTracker({ toolId, userTool, onEntry }: HydrationTrackerProps) {
  const [todayIntake, setTodayIntake] = useState(0)
  const [selectedServing, setSelectedServing] = useState("glass_250ml")
  const [customAmount, setCustomAmount] = useState("")
  const [drinkType, setDrinkType] = useState("water")
  const [isLogging, setIsLogging] = useState(false)
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  const dailyGoal = userTool?.settings?.dailyGoal || 2000 // ml
  const servingSizes = userTool?.settings?.servingSizes || [
    { name: "Glass", ml: 250 },
    { name: "Bottle", ml: 500 },
    { name: "Large Bottle", ml: 750 },
    { name: "Cup", ml: 200 }
  ]

  // Load today's intake
  useEffect(() => {
    loadTodayIntake()
  }, [])

  const loadTodayIntake = async () => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 50)
      
      const todayEntries = entries.filter(entry => 
        entry.timestamp.startsWith(today)
      )
      
      setRecentEntries(todayEntries)
      
      // Calculate total intake for today
      const totalIntake = todayEntries.reduce((total, entry) => {
        const amount = getAmountFromEntry(entry.data)
        return total + amount
      }, 0)
      
      setTodayIntake(totalIntake)
    } catch (error) {
      console.error('Error loading hydration data:', error)
    }
  }

  const getAmountFromEntry = (data: any) => {
    if (data.custom_amount) {
      return parseInt(data.custom_amount) || 0
    }
    
    const servingMap: Record<string, number> = {
      'glass_250ml': 250,
      'bottle_500ml': 500,
      'large_bottle_750ml': 750,
      'cup_200ml': 200
    }
    
    return servingMap[data.serving_type] || 250
  }

  const getServingAmount = () => {
    if (selectedServing === 'custom') {
      return parseInt(customAmount) || 0
    }
    
    const servingMap: Record<string, number> = {
      'glass_250ml': 250,
      'bottle_500ml': 500,
      'large_bottle_750ml': 750,
      'cup_200ml': 200
    }
    
    return servingMap[selectedServing] || 250
  }

  const logIntake = async () => {
    try {
      setIsLogging(true)
      
      const user = await authHelpers.getCurrentUser()
      if (!user) {
        toast.error('Please log in to track hydration')
        return
      }

      const amount = getServingAmount()
      if (amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      const entryData = {
        serving_type: selectedServing,
        custom_amount: selectedServing === 'custom' ? customAmount : null,
        drink_type: drinkType,
        amount_ml: amount
      }

      const entry = {
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: new Date().toISOString()
      }

      await DatabaseService.createTrackingEntry(entry)
      
      // Update local state
      setTodayIntake(prev => prev + amount)
      setRecentEntries(prev => [entry, ...prev])
      
      // Reset form
      setSelectedServing("glass_250ml")
      setCustomAmount("")
      setDrinkType("water")
      
      toast.success(`Added ${amount}ml to your daily intake!`)
      
      if (onEntry) {
        onEntry(entry)
      }
    } catch (error) {
      console.error('Error logging hydration:', error)
      toast.error('Failed to log hydration')
    } finally {
      setIsLogging(false)
    }
  }

  const quickLog = async (amount: number) => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entryData = {
        serving_type: amount === 250 ? 'glass_250ml' : amount === 500 ? 'bottle_500ml' : 'custom',
        custom_amount: amount > 750 ? amount.toString() : null,
        drink_type: 'water',
        amount_ml: amount
      }

      const entry = {
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: new Date().toISOString()
      }

      await DatabaseService.createTrackingEntry(entry)
      
      setTodayIntake(prev => prev + amount)
      setRecentEntries(prev => [entry, ...prev])
      
      toast.success(`Added ${amount}ml!`)
      
      if (onEntry) {
        onEntry(entry)
      }
    } catch (error) {
      console.error('Error quick logging:', error)
    }
  }

  const progressPercentage = Math.min((todayIntake / dailyGoal) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Daily Progress */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Droplet className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-600">
            {todayIntake}ml
          </CardTitle>
          <p className="text-gray-600">of {dailyGoal}ml daily goal</p>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="h-3 mb-4" />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {dailyGoal - todayIntake > 0 
                ? `${dailyGoal - todayIntake}ml remaining` 
                : "Goal achieved! 🎉"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => quickLog(250)}
              variant="outline"
              className="h-16 flex flex-col items-center gap-1"
            >
              <Droplet className="w-5 h-5" />
              <span className="text-xs">Glass (250ml)</span>
            </Button>
            <Button
              onClick={() => quickLog(500)}
              variant="outline"
              className="h-16 flex flex-col items-center gap-1"
            >
              <Droplet className="w-6 h-6" />
              <span className="text-xs">Bottle (500ml)</span>
            </Button>
            <Button
              onClick={() => quickLog(750)}
              variant="outline"
              className="h-16 flex flex-col items-center gap-1"
            >
              <Droplet className="w-7 h-7" />
              <span className="text-xs">Large (750ml)</span>
            </Button>
            <Button
              onClick={() => quickLog(200)}
              variant="outline"
              className="h-16 flex flex-col items-center gap-1"
            >
              <Droplet className="w-4 h-4" />
              <span className="text-xs">Cup (200ml)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Log */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Serving Type</Label>
            <Select value={selectedServing} onValueChange={setSelectedServing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glass_250ml">Glass (250ml)</SelectItem>
                <SelectItem value="bottle_500ml">Bottle (500ml)</SelectItem>
                <SelectItem value="large_bottle_750ml">Large Bottle (750ml)</SelectItem>
                <SelectItem value="cup_200ml">Cup (200ml)</SelectItem>
                <SelectItem value="custom">Custom Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedServing === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Amount (ml)</Label>
              <Input
                type="number"
                placeholder="Enter amount in ml"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="1"
                max="2000"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Drink Type</Label>
            <Select value={drinkType} onValueChange={setDrinkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="herbal_tea">Herbal Tea</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="juice">Juice</SelectItem>
                <SelectItem value="sports_drink">Sports Drink</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={logIntake} 
            disabled={isLogging}
            className="w-full"
          >
            {isLogging ? 'Logging...' : `Log ${getServingAmount()}ml`}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEntries.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      {entry.data.drink_type?.replace('_', ' ') || 'Water'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{getAmountFromEntry(entry.data)}ml</span>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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