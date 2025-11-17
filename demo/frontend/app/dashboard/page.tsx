"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { demoAPI } from "@/lib/demo-api"
import { WellnessCircle } from "@/components/wellness-circle"
import { LoadingScreen } from "@/components/loading-screen"
import { AppLogo } from "@/components/app-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Activity, Moon, Smile, Droplet, Pill, TrendingUp, TrendingDown, ArrowLeft, MessageCircle, AlertCircle } from "lucide-react"

export default function Dashboard() {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [dashboard, setDashboard] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [profileRes, dashboardRes] = await Promise.all([
                demoAPI.getProfile(),
                demoAPI.getDashboard()
            ])
            setProfile(profileRes.data)
            setDashboard(dashboardRes.data)
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <LoadingScreen />
    }

    return (
        <div className="min-h-screen wellness-gradient">
            {/* demo banner */}
            <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>DEMO MODE - All data is mock data for demonstration purposes</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <AppLogo variant="icon" size="md" />
                            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="text-sm">Back to Home</span>
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {profile?.name || 'Sarah'}! 👋
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Here's your health summary for today
                        </p>
                    </div>
                    <Button asChild className="wellness-button-primary">
                        <Link href="/chat">
                            <MessageCircle className="h-5 w-5" />
                            <span>Chat with AI</span>
                        </Link>
                    </Button>
                </div>

                {/* wellness score */}
                <Card className="wellness-card mb-8">
                    <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-gray-600 text-sm mb-2">Your Wellness Score</p>
                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Looking Great!</h2>
                                <p className="text-gray-600">
                                    Keep up the excellent work managing your diabetes. Your consistent tracking is paying off! 🌟
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                <WellnessCircle score={dashboard?.wellnessScore || 78} size={140} strokeWidth={10} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* key metrics */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="wellness-card">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="wellness-icon-container bg-blue-50">
                                    <Droplet className="h-6 w-6 text-blue-600" />
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {dashboard?.metrics?.glucose?.trend === 'stable' ? 'Stable' : 
                                     dashboard?.metrics?.glucose?.trend === 'improving' ? 'Improving' : 'Declining'}
                                </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">Blood Glucose</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dashboard?.metrics?.glucose?.current || 110} <span className="text-sm font-normal text-gray-500">mg/dL</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Avg: {dashboard?.metrics?.glucose?.average || 125} mg/dL</p>
                        </CardContent>
                    </Card>

                    <div className="wellness-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="wellness-icon-container bg-purple-50">
                                <Moon className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-500">
                                {dashboard?.metrics?.sleep?.trend === 'stable' ? '→' : 
                                 dashboard?.metrics?.sleep?.trend === 'improving' ? '↗' : '↘'}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Sleep</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {dashboard?.metrics?.sleep?.averageHours || 7.5} <span className="text-sm font-normal text-gray-500">hours</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Quality: {dashboard?.metrics?.sleep?.quality || 'Good'}</p>
                    </div>

                    <div className="wellness-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="wellness-icon-container bg-yellow-50">
                                <Smile className="h-6 w-6 text-yellow-600" />
                            </div>
                            <span className="text-sm text-gray-500">
                                {dashboard?.metrics?.mood?.trend === 'stable' ? '→' : 
                                 dashboard?.metrics?.mood?.trend === 'improving' ? '↗' : '↘'}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Mood</p>
                        <p className="text-2xl font-bold text-gray-900 capitalize">
                            {dashboard?.metrics?.mood?.current || 'Happy'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Score: {dashboard?.metrics?.mood?.averageScore || 4.2}/5</p>
                    </div>

                    <div className="wellness-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="wellness-icon-container bg-green-50">
                                <Activity className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-sm text-gray-500">
                                {dashboard?.metrics?.activity?.trend === 'stable' ? '→' : 
                                 dashboard?.metrics?.activity?.trend === 'improving' ? '↗' : '↘'}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">Daily Steps</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {dashboard?.metrics?.activity?.dailySteps?.toLocaleString() || '8,500'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Weekly avg: {dashboard?.metrics?.activity?.weeklyAverage?.toLocaleString() || '7,200'}</p>
                    </div>
                </div>

                {/* recent entries */}
                <div className="wellness-card p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {dashboard?.recentEntries?.map((entry: any) => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-secondary rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="wellness-icon-container bg-white">
                                        {entry.toolId === 'glucose' && <Droplet className="h-5 w-5 text-blue-600" />}
                                        {entry.toolId === 'mood' && <Smile className="h-5 w-5 text-yellow-600" />}
                                        {entry.toolId === 'sleep' && <Moon className="h-5 w-5 text-purple-600" />}
                                        {entry.toolId === 'medication' && <Pill className="h-5 w-5 text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{entry.toolName}</p>
                                        <p className="text-sm text-gray-600">{entry.notes || entry.value}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {entry.value} {entry.unit || ''}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* quick actions */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Link 
                        href="/chat"
                        className="wellness-feature-card"
                    >
                        <MessageCircle className="h-8 w-8 text-red-500 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Chat with AI</h3>
                        <p className="text-sm text-gray-600">Get personalized health insights and advice</p>
                    </Link>

                    <Link 
                        href="/analytics"
                        className="wellness-feature-card"
                    >
                        <TrendingUp className="h-8 w-8 text-red-500 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
                        <p className="text-sm text-gray-600">See trends and patterns in your health data</p>
                    </Link>

                    <Link 
                        href="/records"
                        className="wellness-feature-card"
                    >
                        <Heart className="h-8 w-8 text-red-500 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Health Records</h3>
                        <p className="text-sm text-gray-600">View your medical history and documents</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

