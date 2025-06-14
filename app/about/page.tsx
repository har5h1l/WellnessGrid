import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Heart, Shield, Users, Star } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen wellness-gradient">
      <header className="wellness-header">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
        <AppLogo />
        <Link href="/setup">
          <Button className="wellness-button-primary">Get Started</Button>
        </Link>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About WellnessGrid
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive health companion designed specifically for teens managing chronic conditions, 
              empowering them to take control of their health journey with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                WellnessGrid was created to address the unique challenges teens face when managing chronic health conditions. 
                We understand that being a teenager is already complex, and adding a chronic condition to the mix can feel overwhelming.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our platform provides a safe, supportive, and engaging space where teens can track their health, 
                understand their patterns, and build confidence in managing their condition independently.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -z-10 w-48 h-48 bg-red-100 rounded-full blur-3xl opacity-70"></div>
                <Image
                  src="/images/character.png"
                  alt="WellnessGrid Character"
                  width={250}
                  height={250}
                  className="animate-float"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="wellness-card p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Teen-Focused</h3>
              <p className="text-gray-600">
                Designed specifically for teenagers, with age-appropriate language, features, and support systems.
              </p>
            </Card>

            <Card className="wellness-card p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your health data is private and secure. You control what you share and with whom.
              </p>
            </Card>

            <Card className="wellness-card p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Support Network</h3>
              <p className="text-gray-600">
                Connect with healthcare providers and build a support system that works for you.
              </p>
            </Card>
          </div>

          <div className="bg-white rounded-3xl p-8 mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What You Can Do</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Track Symptoms Daily</h4>
                    <p className="text-gray-600 text-sm">Log symptoms, triggers, and patterns to better understand your condition</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Monitor Medications</h4>
                    <p className="text-gray-600 text-sm">Keep track of medication schedules, adherence, and side effects</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Mood & Wellness</h4>
                    <p className="text-gray-600 text-sm">Track your emotional wellbeing alongside physical health</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Health Insights</h4>
                    <p className="text-gray-600 text-sm">Visualize your data and identify trends over time</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Educational Resources</h4>
                    <p className="text-gray-600 text-sm">Access age-appropriate information about your condition</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">AI Health Coach</h4>
                    <p className="text-gray-600 text-sm">Get personalized guidance and support when you need it</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of teens who are taking control of their health journey with WellnessGrid.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/setup">
                <Button className="wellness-button-primary px-8 py-6 text-lg">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="wellness-button-secondary px-8 py-6 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <AppLogo />
            <div className="mt-6 md:mt-0">
              <p className="text-gray-600">© 2025 WellnessGrid. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 