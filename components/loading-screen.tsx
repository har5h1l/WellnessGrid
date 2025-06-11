import { Heart } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 z-50">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
        <Heart className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">WellnessGrid</h2>
      <p className="text-gray-600">Loading your health data...</p>
    </div>
  )
}
