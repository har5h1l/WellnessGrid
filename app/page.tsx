import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppLogo } from "@/components/app-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MessageCircle, Calendar, FileText, Users, Sparkles, Heart, Shield, Target } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="wellness-header">
        <AppLogo variant="icon" size="md" />
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/login">
            <Button variant="outline" className="rounded-full text-sm sm:text-base px-3 sm:px-4">
              Log In
            </Button>
          </Link>
          <Link href="/setup">
            <Button className="wellness-button-primary text-sm sm:text-base px-3 sm:px-4">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
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
            
            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/setup">
                <Button className="wellness-button-primary px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Heart className="w-5 h-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="px-8 py-6 text-lg rounded-2xl border-2 hover:bg-gray-50">
                  <Target className="w-5 h-5 mr-2" />
                  See a Demo
                </Button>
              </Link>
            </div>

            {/* Hero Illustration */}
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
                      "Much better! My headache is gone 😊"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why WellnessGrid Section */}
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
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Custom Protocols</h3>
                <p className="text-gray-600">Follow personalized care plans designed by doctors just for you</p>
              </CardContent>
            </Card>

            <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Symptom & Mood Tracking</h3>
                <p className="text-gray-600">Track how you feel with fun, easy-to-use tools that spot patterns</p>
              </CardContent>
            </Card>

            <Card className="wellness-feature-card text-center p-8 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="p-0">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Weekly Reports</h3>
                <p className="text-gray-600">Share progress with parents and doctors through smart health reports</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 wellness-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just 3 simple steps and begin your health journey today
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-xl">
                  1
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">👤</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Create Your Profile</h3>
              <p className="text-gray-600 text-lg">Tell us about your health conditions and goals. Don't worry - it's completely private and secure!</p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-xl">
                  2
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">💬</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Chat Daily & Log Symptoms</h3>
              <p className="text-gray-600 text-lg">Check in with your AI coach every day and track how you're feeling with simple, fun tools.</p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-xl">
                  3
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">📊</div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Get Smart Guidance</h3>
              <p className="text-gray-600 text-lg">Receive personalized insights, helpful tips, and progress reports to share with your family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Teens & Parents Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from teens who are taking control of their health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">😊</div>
                  <div>
                    <div className="font-bold text-gray-900">Sarah, 16</div>
                    <div className="text-sm text-gray-500">Managing Type 1 Diabetes</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"WellnessGrid makes tracking my blood sugar so much easier! The AI coach reminds me when to check and celebrates my good days with me."</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🙌</div>
                  <div>
                    <div className="font-bold text-gray-900">Mom of Alex, 14</div>
                    <div className="text-sm text-gray-500">Asthma Management</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"The weekly reports help me understand Alex's triggers better. It's brought us closer and made doctor visits so much more productive!"</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">🎯</div>
                  <div>
                    <div className="font-bold text-gray-900">Marcus, 17</div>
                    <div className="text-sm text-gray-500">Crohn's Disease</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"Finally, a health app that doesn't feel like homework! The chat feature makes me feel like I have a friend who really gets it."</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Day in the Life Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">A Day with WellnessGrid</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how Emma manages her asthma throughout a typical day
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 border-0 shadow-lg bg-white">
                <CardContent className="p-0 text-center">
                  <div className="text-6xl mb-4">🌅</div>
                  <h3 className="text-lg font-bold mb-2">Morning Check-in</h3>
                  <p className="text-gray-600 text-sm">Emma logs her morning peak flow and gets encouragement from her AI coach</p>
                </CardContent>
              </Card>

              <Card className="p-6 border-0 shadow-lg bg-white">
                <CardContent className="p-0 text-center">
                  <div className="text-6xl mb-4">🏫</div>
                  <h3 className="text-lg font-bold mb-2">School Day</h3>
                  <p className="text-gray-600 text-sm">Quick symptom tracking during lunch, with smart reminders for inhaler use</p>
                </CardContent>
              </Card>

              <Card className="p-6 border-0 shadow-lg bg-white">
                <CardContent className="p-0 text-center">
                  <div className="text-6xl mb-4">👨‍👩‍👧</div>
                  <h3 className="text-lg font-bold mb-2">Family Time</h3>
                  <p className="text-gray-600 text-sm">Shares her weekly progress report with parents, celebrating improvements</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 wellness-gradient">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of teens who are already managing their health with confidence
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/setup">
                <Button className="wellness-button-primary px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                  <Sparkles className="w-6 h-6 mr-2" />
                  Get Started Free
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="px-12 py-6 text-xl rounded-2xl border-2 bg-white/80 backdrop-blur-sm">
                  <Users className="w-6 h-6 mr-2" />
                  See a Demo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                HIPAA Compliant
              </div>
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Doctor Approved
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                1000+ Happy Teens
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="mt-12 relative max-w-sm mx-auto">
              <div className="absolute -z-10 w-48 h-48 bg-gradient-to-r from-red-300 to-pink-300 rounded-full blur-3xl opacity-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="bg-white rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-4 text-white text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-sm font-medium">WellnessGrid Dashboard</div>
                  <div className="mt-4 space-y-2">
                    <div className="bg-white/20 rounded-lg p-2 text-xs">✅ Symptoms logged today</div>
                    <div className="bg-white/20 rounded-lg p-2 text-xs">💬 Chat with AI Coach</div>
                    <div className="bg-white/20 rounded-lg p-2 text-xs">📊 View Progress Report</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <AppLogo variant="icon" size="md" />
            <div className="mt-6 md:mt-0 text-center md:text-right">
              <p className="text-gray-600">© 2025 WellnessGrid. All rights reserved.</p>
              <p className="text-sm text-gray-500 mt-1">Empowering teens to take control of their health journey</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
