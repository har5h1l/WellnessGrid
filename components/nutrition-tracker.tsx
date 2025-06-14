"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatabaseService, authHelpers } from "@/lib/database"
import { Apple, TrendingUp, Utensils, Plus } from "lucide-react"
import { toast } from "sonner"

interface NutritionTrackerProps {
  toolId: string
  userTool: any
  onEntry?: (entry: any) => void
}

export function NutritionTracker({ toolId, userTool, onEntry }: NutritionTrackerProps) {
  const [mealType, setMealType] = useState("")
  const [foodName, setFoodName] = useState("")
  const [calories, setCalories] = useState("")
  const [carbs, setCarbs] = useState("")
  const [protein, setProtein] = useState("")
  const [fat, setFat] = useState("")
  const [fiber, setFiber] = useState("")
  const [sodium, setSodium] = useState("")
  const [portionSize, setPortionSize] = useState("")
  const [notes, setNotes] = useState("")
  const [isLogging, setIsLogging] = useState(false)
  const [todayEntries, setTodayEntries] = useState<any[]>([])
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  const mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"]

  // Load today's nutrition data
  useEffect(() => {
    loadNutritionData()
  }, [])

  const loadNutritionData = async () => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 50)
      const today = new Date().toISOString().split('T')[0]
      
      const todayEntries = entries.filter(entry => 
        entry.timestamp.startsWith(today)
      )
      
      setTodayEntries(todayEntries)
      setRecentEntries(entries.slice(0, 15))
    } catch (error) {
      console.error('Error loading nutrition data:', error)
    }
  }

  const logNutrition = async () => {
    try {
      setIsLogging(true)
      
      const user = await authHelpers.getCurrentUser()
      if (!user) {
        toast.error('Please log in to track nutrition')
        return
      }

      if (!mealType || !foodName) {
        toast.error('Please enter meal type and food name')
        return
      }

      const entryData: any = {
        meal_type: mealType,
        food_name: foodName
      }

      if (calories) entryData.calories = parseInt(calories)
      if (carbs) entryData.carbs = parseFloat(carbs)
      if (protein) entryData.protein = parseFloat(protein)
      if (fat) entryData.fat = parseFloat(fat)
      if (fiber) entryData.fiber = parseFloat(fiber)
      if (sodium) entryData.sodium = parseInt(sodium)
      if (portionSize) entryData.portion_size = portionSize
      if (notes.trim()) entryData.notes = notes.trim()

      const entry = {
        user_id: user.id,
        tool_id: toolId,
        data: entryData,
        timestamp: new Date().toISOString()
      }

      await DatabaseService.createTrackingEntry(entry)
      
      // Update local state
      setTodayEntries(prev => [entry, ...prev])
      setRecentEntries(prev => [entry, ...prev])
      
      // Reset form
      setMealType("")
      setFoodName("")
      setCalories("")
      setCarbs("")
      setProtein("")
      setFat("")
      setFiber("")
      setSodium("")
      setPortionSize("")
      setNotes("")
      
      toast.success(`${foodName} logged for ${mealType}!`)
      
      if (onEntry) {
        onEntry(entry)
      }
    } catch (error) {
      console.error('Error logging nutrition:', error)
      toast.error('Failed to log nutrition data')
    } finally {
      setIsLogging(false)
    }
  }

  const getTodayTotals = () => {
    const totals = todayEntries.reduce((acc, entry) => {
      const data = entry.data
      acc.calories += data.calories || 0
      acc.carbs += data.carbs || 0
      acc.protein += data.protein || 0
      acc.fat += data.fat || 0
      acc.fiber += data.fiber || 0
      acc.sodium += data.sodium || 0
      return acc
    }, { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, sodium: 0 })
    
    return totals
  }

  const getMealEntries = (meal: string) => {
    return todayEntries.filter(entry => entry.data.meal_type === meal)
  }

  const totals = getTodayTotals()

  return (
    <div className="space-y-6">
      {/* Nutrition Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Log Food & Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-name">Food/Meal Name</Label>
              <Input
                id="food-name"
                placeholder="e.g., Grilled Chicken Salad"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                placeholder="300"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="1"
                max="5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portion">Portion Size</Label>
              <Input
                id="portion"
                placeholder="1 cup, 150g, etc."
                value={portionSize}
                onChange={(e) => setPortionSize(e.target.value)}
              />
            </div>
          </div>

          {/* Macronutrients */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Macronutrients (optional)</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Input
                  type="number"
                  placeholder="Carbs (g)"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Protein (g)"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  min="0"
                  max="200"
                  step="0.1"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Fat (g)"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  min="0"
                  max="200"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                placeholder="5"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sodium">Sodium (mg)</Label>
              <Input
                id="sodium"
                type="number"
                placeholder="300"
                value={sodium}
                onChange={(e) => setSodium(e.target.value)}
                min="0"
                max="10000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the meal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            onClick={logNutrition} 
            disabled={isLogging}
            className="w-full"
          >
            {isLogging ? 'Logging...' : 'Log Food Entry'}
          </Button>
        </CardContent>
      </Card>

      {/* Daily Totals */}
      {todayEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Today's Nutrition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totals.calories}
                </div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totals.carbs.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {totals.protein.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {totals.fat.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totals.fiber.toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Fiber</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(totals.sodium / 1000).toFixed(1)}g
                </div>
                <div className="text-sm text-gray-600">Sodium</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Meals by Type */}
      {todayEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mealTypes.map(meal => {
                const mealEntries = getMealEntries(meal)
                if (mealEntries.length === 0) return null
                
                const mealTotals = mealEntries.reduce((acc, entry) => {
                  acc.calories += entry.data.calories || 0
                  return acc
                }, { calories: 0 })
                
                return (
                  <div key={meal} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium capitalize">{meal}</h4>
                      <span className="text-sm text-gray-600">
                        {mealTotals.calories} cal
                      </span>
                    </div>
                    <div className="space-y-2">
                      {mealEntries.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{entry.data.food_name}</div>
                            <div className="text-sm text-gray-600">
                              {entry.data.portion_size && `${entry.data.portion_size} • `}
                              {new Date(entry.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {entry.data.calories && (
                              <div className="font-medium">{entry.data.calories} cal</div>
                            )}
                            {(entry.data.carbs || entry.data.protein || entry.data.fat) && (
                              <div className="text-gray-600">
                                {entry.data.carbs && `${entry.data.carbs}g C`}
                                {entry.data.protein && ` ${entry.data.protein}g P`}
                                {entry.data.fat && ` ${entry.data.fat}g F`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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