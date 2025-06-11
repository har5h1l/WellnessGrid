import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppLogo } from "@/components/app-logo"

export default function LandingPage() {
  return (
    <div className="min-h-screen wellness-gradient">
      <header className="wellness-header">
        <AppLogo />
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="outline" className="rounded-full">
              Log In
            </Button>
          </Link>
          <Link href="/setup">
            <Button className="wellness-button-primary">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Your personal health companion</h1>
            <p className="text-xl text-gray-600">
              WellnessGrid helps teens manage chronic conditions with personalized tracking, insights, and support.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/setup">
                <Button className="wellness-button-primary px-8 py-6 text-lg">Start Your Journey</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" className="wellness-button-secondary px-8 py-6 text-lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -z-10 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-70 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <Image
                src="/images/character.png"
                alt="WellnessGrid Character"
                width={300}
                height={300}
                className="mx-auto animate-float"
              />
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="wellness-feature-card">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Image src="/images/medication.png" alt="Track" width={40} height={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Track Symptoms</h3>
            <p className="text-gray-600">Log symptoms, medications, and moods to identify patterns and triggers.</p>
          </div>

          <div className="wellness-feature-card">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Image src="/images/ai-assistant.png" alt="AI Assistant" width={40} height={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Assistant</h3>
            <p className="text-gray-600">Get personalized advice and support from your AI health coach.</p>
          </div>

          <div className="wellness-feature-card">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <Image src="/images/lungs-pink.png" alt="Insights" width={40} height={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Health Insights</h3>
            <p className="text-gray-600">Visualize your health data and get actionable recommendations.</p>
          </div>
        </div>
      </main>

      <footer className="bg-white py-12">
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
