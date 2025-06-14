"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { DatabaseService, authHelpers } from "@/lib/database"
import { Moon, Sun, Clock, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface SleepTrackerProps {
  toolId: string
  userTool: any
  onEntry?: (entry: any) => void
}

export function SleepTracker({ toolId, userTool, onEntry }: SleepTrackerProps) {
  const [bedtime, setBedtime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [sleepQuality, setSleepQuality] = useState([7])
  const [timeToFallAsleep, setTimeToFallAsleep] = useState("")
  const [nightAwakenings, setNightAwakenings] = useState("")
  const [sleepAids, setSleepAids] = useState<string[]>([])
  const [hadDreams, setHadDreams] = useState(false)
  const [notes, setNotes] = useState("")
  const [isLogging, setIsLogging] = useState(false)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [todayEntry, setTodayEntry] = useState<any>(null)

  const sleepAidOptions = [
    "none", "medication", "melatonin", "herbal_tea", 
    "meditation", "white_noise", "weighted_blanket"
  ]

  // Load existing data
  useEffect(() => {
    loadSleepData()
  }, [])

  const loadSleepData = async () => {
    try {
      const user = await authHelpers.getCurrentUser()
      if (!user) return

      const entries = await DatabaseService.getTrackingEntries(user.id, toolId, 30)
      const today = new Date().toISOString().split('T')[0]
      
      // Check if there's already an entry for today
      const todayEntry = entries.find(entry => entry.timestamp.startsWith(today))
      if (todayEntry) {
        setTodayEntry(todayEntry)
        // Pre-fill form with today's data
        const data = todayEntry.data
        setBedtime(data.bedtime || "")
        setWakeTime(data.wake_time || "")
        setSleepQuality([data.sleep_quality || 7])
        setTimeToFallAsleep(data.time_to_fall_asleep?.toString() || "")
        setNightAwakenings(data.night_awakenings?.toString() || "")
        setSleepAids(data.sleep_aids || [])
        setHadDreams(data.dreams || false)
        setNotes(data.notes || "")
      }

      // Get last 7 days for weekly chart
      const weeklyEntries = entries.slice(0, 7).reverse()
      setWeeklyData(weeklyEntries)
    } catch (error) {
      console.error('Error loading sleep data:', error)
    }
  }

  const calculateSleepDuration = (bedtime: string, wakeTime: string) => {
    if (!bedtime || !wakeTime) return 0

    const bed = new Date(`2000-01-01T${bedtime}:00`)
    let wake = new Date(`2000-01-01T${wakeTime}:00`)
    
    // If wake time is earlier than bedtime, assume it's the next day
    if (wake <= bed) {
      wake = new Date(`2000-01-02T${wakeTime}:00`)
    }
    
    const duration = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60) // hours
    return Math.max(0, duration)
  }

  const handleSleepAidToggle = (aid: string) => {
    setSleepAids(prev => 
      prev.includes(aid) 
        ? prev.filter(a => a !== aid)
        : [...prev, aid]
    )
  }

  const logSleep = async () => {
    try {
      setIsLogging(true)
      
      const user = await authHelpers.getCurrentUser()
      if (!user) {
        toast.error('Please log in to track sleep')
        return
      }

      if (!bedtime || !wakeTime) {
        toast.error('Please enter both bedtime and wake time')
        return
      }

      const duration = calculateSleepDuration(bedtime, wakeTime)
      
      const entryData = {
        bedtime,
        wake_time: wakeTime,
        sleep_duration: duration,
        sleep_quality: sleepQuality[0],
        time_to_fall_asleep: timeToFallAsleep ? parseInt(timeToFallAsleep) : null,
        night_awakenings: nightAwakenings ? parseInt(nightAwakenings) : null,
        sleep_aids: sleepAids.length > 0 ? sleepAids : null,
        dreams: hadDreams,
        notes: notes.trim() || null
      }

      if (todayEntry) {
        // Update existing entry
        await DatabaseService.updateTrackingEntry(todayEntry.id, entryData)
        toast.success('Sleep entry updated!')
      } else {
        // Create new entry
        const entry = {
          user_id: user.id,
          tool_id: toolId,
          data: entryData,
          timestamp: new Date().toISOString()
        }

        await DatabaseService.createTrackingEntry(entry)
        toast.success('Sleep logged successfully!')
        
        if (onEntry) {
          onEntry(entry)
        }
      }

      // Reload data to update charts
      await loadSleepData()
    } catch (error) {
      console.error('Error logging sleep:', error)
      toast.error('Failed to log sleep data')
    } finally {
      setIsLogging(false)
    }
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const getAverageWeeklySleep = () => {
    if (weeklyData.length === 0) return 0
    const total = weeklyData.reduce((sum, entry) => sum + (entry.data.sleep_duration || 0), 0)
    return total / weeklyData.length
  }

  const getAverageWeeklyQuality = () => {
    if (weeklyData.length === 0) return 0
    const total = weeklyData.reduce((sum, entry) => sum + (entry.data.sleep_quality || 0), 0)
    return total / weeklyData.length
  }

  const currentDuration = calculateSleepDuration(bedtime, wakeTime)

  return (
    <div className="space-y-6">
      {/* Sleep Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            {todayEntry ? 'Update Sleep Log' : 'Log Sleep'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wake-time">Wake Time</Label>
              <Input
                id="wake-time"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          {bedtime && wakeTime && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-600">
                  {formatDuration(currentDuration)}
                </span>
              </div>
              <p className="text-sm text-blue-600">Total Sleep Duration</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Sleep Quality: {sleepQuality[0]}/10</Label>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Poor</span>
              <Slider
                value={sleepQuality}
                onValueChange={setSleepQuality}
                max={10}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">Excellent</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fall-asleep">Time to Fall Asleep (min)</Label>
              <Input
                id="fall-asleep"
                type="number"
                placeholder="15"
                value={timeToFallAsleep}
                onChange={(e) => setTimeToFallAsleep(e.target.value)}
                min="0"
                max="240"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awakenings">Night Awakenings</Label>
              <Input
                id="awakenings"
                type="number"
                placeholder="0"
                value={nightAwakenings}
                onChange={(e) => setNightAwakenings(e.target.value)}
                min="0"
                max="20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sleep Aids Used</Label>
            <div className="flex flex-wrap gap-2">
              {sleepAidOptions.map((aid) => (
                <button
                  key={aid}
                  type="button"
                  onClick={() => handleSleepAidToggle(aid)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    sleepAids.includes(aid)
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {aid.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dreams"
              checked={hadDreams}
              onCheckedChange={(checked) => setHadDreams(checked as boolean)}
            />
            <Label htmlFor="dreams">Had dreams or nightmares</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="How did you sleep? Any issues?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button 
            onClick={logSleep} 
            disabled={isLogging}
            className="w-full"
          >
            {isLogging ? 'Saving...' : (todayEntry ? 'Update Sleep Log' : 'Log Sleep')}
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Sleep Chart */}
      {weeklyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Sleep Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sleep Duration Chart */}
              <div>
                <h4 className="font-medium mb-2">Sleep Duration</h4>
                <div className="space-y-2">
                  {weeklyData.map((entry, index) => {
                    const date = new Date(entry.timestamp)
                    const duration = entry.data.sleep_duration || 0
                    const maxDuration = 12 // 12 hours max for chart scaling
                    const percentage = (duration / maxDuration) * 100
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 text-xs text-gray-500">
                          {date.toLocaleDateString([], { weekday: 'short' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {formatDuration(duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sleep Quality Chart */}
              <div>
                <h4 className="font-medium mb-2">Sleep Quality</h4>
                <div className="space-y-2">
                  {weeklyData.map((entry, index) => {
                    const date = new Date(entry.timestamp)
                    const quality = entry.data.sleep_quality || 0
                    const percentage = (quality / 10) * 100
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 text-xs text-gray-500">
                          {date.toLocaleDateString([], { weekday: 'short' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                          <div
                            className="bg-green-500 h-4 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {quality}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weekly Averages */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(getAverageWeeklySleep())}
                  </div>
                  <div className="text-sm text-gray-600">Avg Sleep Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getAverageWeeklyQuality().toFixed(1)}/10
                  </div>
                  <div className="text-sm text-gray-600">Avg Sleep Quality</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 