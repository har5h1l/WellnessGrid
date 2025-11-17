"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { demoAPI } from "@/lib/demo-api"
import { ArrowLeft, TrendingUp, Heart, Moon, Droplet, Smile, AlertCircle } from "lucide-react"

export default function Analytics() {
    const [loading, setLoading] = useState(true)
    const [analytics, setAnalytics] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const response = await demoAPI.getAnalytics()
            setAnalytics(response.data)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen wellness-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen wellness-gradient">
            {/* demo banner */}
            <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>DEMO MODE - Analytics data is pre-generated for demonstration</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back to Dashboard</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Health Analytics</h1>
                    <p className="text-gray-600 mt-1">Insights and trends from your health data</p>
                </div>

                {/* insights */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Insights</h2>
                    <div className="space-y-4">
                        {analytics?.insights?.map((insight: any) => (
                            <div 
                                key={insight.id}
                                className={`wellness-card p-6 border-l-4 ${
                                    insight.type === 'positive' ? 'border-green-500' :
                                    insight.type === 'warning' ? 'border-yellow-500' :
                                    'border-blue-500'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {insight.priority}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{insight.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">{insight.date}</p>
                                    </div>
                                    <div className="ml-4">
                                        {insight.category === 'glucose' && <Droplet className="h-6 w-6 text-blue-500" />}
                                        {insight.category === 'sleep' && <Moon className="h-6 w-6 text-purple-500" />}
                                        {insight.category === 'mood' && <Smile className="h-6 w-6 text-yellow-500" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* trends */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Trends</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* glucose trend */}
                        <div className="wellness-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Droplet className="h-5 w-5 text-blue-500" />
                                    <h3 className="font-semibold text-gray-900">Blood Glucose</h3>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {analytics?.trends?.glucose?.trend === 'stable' ? '→' : 
                                     analytics?.trends?.glucose?.trend === 'improving' ? '↗' : '↘'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    {analytics?.trends?.glucose?.labels?.map((label: string, i: number) => (
                                        <div key={i} className="text-center">
                                            <div 
                                                className="w-8 bg-blue-100 rounded-t"
                                                style={{ 
                                                    height: `${(analytics.trends.glucose.weeklyData[i] / 150) * 100}px`,
                                                    minHeight: '20px'
                                                }}
                                            ></div>
                                            <p className="text-xs text-gray-500 mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Change: <span className={analytics?.trends?.glucose?.change < 0 ? 'text-green-600' : 'text-gray-900'}>
                                            {analytics?.trends?.glucose?.change}%
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* sleep trend */}
                        <div className="wellness-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Moon className="h-5 w-5 text-purple-500" />
                                    <h3 className="font-semibold text-gray-900">Sleep</h3>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {analytics?.trends?.sleep?.trend === 'stable' ? '→' : 
                                     analytics?.trends?.sleep?.trend === 'improving' ? '↗' : '↘'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    {analytics?.trends?.sleep?.labels?.map((label: string, i: number) => (
                                        <div key={i} className="text-center">
                                            <div 
                                                className="w-8 bg-purple-100 rounded-t"
                                                style={{ 
                                                    height: `${(analytics.trends.sleep.weeklyData[i] / 10) * 100}px`,
                                                    minHeight: '20px'
                                                }}
                                            ></div>
                                            <p className="text-xs text-gray-500 mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Change: <span className={analytics?.trends?.sleep?.change > 0 ? 'text-green-600' : 'text-gray-900'}>
                                            +{analytics?.trends?.sleep?.change} hrs
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* mood trend */}
                        <div className="wellness-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Smile className="h-5 w-5 text-yellow-500" />
                                    <h3 className="font-semibold text-gray-900">Mood</h3>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {analytics?.trends?.mood?.trend === 'stable' ? '→' : 
                                     analytics?.trends?.mood?.trend === 'improving' ? '↗' : '↘'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                    {analytics?.trends?.mood?.labels?.map((label: string, i: number) => (
                                        <div key={i} className="text-center">
                                            <div 
                                                className="w-8 bg-yellow-100 rounded-t"
                                                style={{ 
                                                    height: `${(analytics.trends.mood.weeklyData[i] / 5) * 100}px`,
                                                    minHeight: '20px'
                                                }}
                                            ></div>
                                            <p className="text-xs text-gray-500 mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        Change: <span className="text-gray-900">
                                            {analytics?.trends?.mood?.change === 0 ? 'Stable' : `+${analytics?.trends?.mood?.change}`}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* summary */}
                <div className="wellness-card p-8 bg-gradient-to-br from-red-50 to-pink-50">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">Keep Up the Great Work! 🌟</h2>
                    <p className="text-gray-700 mb-4">
                        Your health data shows consistent tracking and positive trends. Continue monitoring your 
                        glucose levels, maintaining good sleep habits, and staying active. Remember, small daily 
                        efforts lead to big improvements over time!
                    </p>
                    <Link 
                        href="/chat"
                        className="wellness-button-primary px-6 py-3 inline-block"
                    >
                        Chat with AI for More Insights
                    </Link>
                </div>
            </div>
        </div>
    )
}

