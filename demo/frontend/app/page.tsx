"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppLogo } from "@/components/app-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MessageCircle, Calendar, FileText, Sparkles, Heart, Shield, Target, Activity, TrendingUp, AlertCircle } from "lucide-react"

export default function Home() {
    return (
        <div className="min-h-screen">
            {/* demo banner */}
            <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>DEMO MODE - Using mock data for demonstration purposes</span>
                </div>
            </div>

            {/* hero section */}
            <section className="wellness-gradient pt-20 pb-16 px-4">
                <div className="container mx-auto text-center">
                    <div className="max-w-4xl mx-auto">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 mb-6 px-4 py-2 rounded-full">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI-Powered Health Companion
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Your Personal AI Health Coach —{" "}
                            <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                                Designed for Teens
                            </span>
                        </h1>
                        <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            Track symptoms, follow doctor-approved plans, and feel in control of your health journey with your friendly AI companion.
                        </p>
                        
                        {/* hero CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link href="/dashboard">
                                <Button className="wellness-button-primary px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                                    <Heart className="w-5 h-5 mr-2" />
                                    View Demo Dashboard
                                </Button>
                            </Link>
                            <Link href="/chat">
                                <Button variant="outline" className="px-8 py-6 text-lg rounded-2xl border-2 hover:bg-gray-50">
                                    <MessageCircle className="w-5 h-5 mr-2" />
                                    Try AI Chat
                                </Button>
                            </Link>
                        </div>

                        {/* hero illustration */}
                        <div className="relative max-w-2xl mx-auto">
                            <div className="absolute -z-10 w-64 h-64 bg-gradient-to-r from-red-200 to-pink-200 rounded-full blur-3xl opacity-70 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                                <div className="flex items-center justify-center space-x-6">
                                    <div className="text-6xl">🧑‍💻</div>
                                    <div className="flex flex-col space-y-2">
                                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm">
                                            "How are you feeling today?"
                                        </div>
                                        <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm self-end">
                                            "Much better! My glucose is stable 😊"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* why wellnessgrid section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Teens Love WellnessGrid</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need to take control of your health journey in one friendly app
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
                            <CardContent className="p-0">
                                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <MessageCircle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">AI Chat Support</h3>
                                <p className="text-gray-600">Chat 24/7 with your personal AI health coach who understands your condition</p>
                            </CardContent>
                        </Card>

                        <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100">
                            <CardContent className="p-0">
                                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">Health Tracking</h3>
                                <p className="text-gray-600">Track glucose, sleep, mood, and medications with tools designed for teens</p>
                            </CardContent>
                        </Card>

                        <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-pink-100">
                            <CardContent className="p-0">
                                <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <TrendingUp className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">Smart Analytics</h3>
                                <p className="text-gray-600">Discover patterns with automated insights about your health trends</p>
                            </CardContent>
                        </Card>

                        <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
                            <CardContent className="p-0">
                                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">Health Records</h3>
                                <p className="text-gray-600">Keep track of appointments, lab results, and prescriptions in one place</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* demo user profile */}
            <section className="py-20 wellness-gradient">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Sarah (Demo User)</h2>
                            <p className="text-xl text-gray-600">
                                Explore how a 16-year-old manages Type 1 Diabetes with WellnessGrid
                            </p>
                        </div>

                        <Card className="p-8 border-0 shadow-lg">
                            <CardContent className="p-0">
                                <div className="flex items-center mb-6">
                                    <div className="text-5xl mr-4">😊</div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">Sarah Chen</div>
                                        <div className="text-gray-600">16 years old · Managing Type 1 Diabetes</div>
                                    </div>
                                </div>
                                
                                <div className="grid md:grid-cols-3 gap-6 mb-6">
                                    <div className="text-center p-4 bg-red-50 rounded-xl">
                                        <div className="text-3xl font-bold text-red-600">78</div>
                                        <div className="text-sm text-gray-600">Wellness Score</div>
                                    </div>
                                    <div className="text-center p-4 bg-pink-50 rounded-xl">
                                        <div className="text-3xl font-bold text-pink-600">110</div>
                                        <div className="text-sm text-gray-600">Current Glucose</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-xl">
                                        <div className="text-3xl font-bold text-red-600">7.5</div>
                                        <div className="text-sm text-gray-600">Hours Sleep</div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <Link href="/dashboard">
                                        <Button className="wellness-button-primary">
                                            View Sarah's Dashboard
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* explore features */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore the Demo</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Try out all the features with realistic mock data
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <Link href="/dashboard">
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                <CardContent className="p-0 text-center">
                                    <div className="text-4xl mb-4">📊</div>
                                    <h3 className="text-lg font-bold mb-2">Dashboard</h3>
                                    <p className="text-gray-600 text-sm">View health metrics and recent activity</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/chat">
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                <CardContent className="p-0 text-center">
                                    <div className="text-4xl mb-4">💬</div>
                                    <h3 className="text-lg font-bold mb-2">AI Chat</h3>
                                    <p className="text-gray-600 text-sm">Ask health questions and get guidance</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/analytics">
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                <CardContent className="p-0 text-center">
                                    <div className="text-4xl mb-4">📈</div>
                                    <h3 className="text-lg font-bold mb-2">Analytics</h3>
                                    <p className="text-gray-600 text-sm">See trends and smart insights</p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/records">
                            <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                                <CardContent className="p-0 text-center">
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-lg font-bold mb-2">Records</h3>
                                    <p className="text-gray-600 text-sm">View sample health records</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </section>

            {/* footer */}
            <footer className="bg-gray-50 py-12 border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <AppLogo variant="icon" size="md" />
                        <div className="mt-6 md:mt-0 text-center md:text-right">
                            <p className="text-gray-600">© 2025 WellnessGrid Demo</p>
                            <p className="text-sm text-gray-500 mt-1">This is a demonstration version using mock data</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

