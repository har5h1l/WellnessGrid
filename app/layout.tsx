import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedMobileNav } from "@/components/navigation/enhanced-mobile-nav"
import { SafeAppProvider } from "@/lib/store/safe-context"
import { Toaster } from "sonner"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wellnessgrid.app'),
  title: {
    default: "WellnessGrid - AI Health Companion for Teens",
    template: "%s | WellnessGrid"
  },
  description: "AI-powered chronic condition coach for teens with a clean, accessible interface. Track your health, get personalized insights, and manage your wellness journey with confidence.",
  keywords: [
    "teen health",
    "chronic condition management",
    "AI health coach",
    "health tracking",
    "wellness app",
    "health analytics",
    "diabetes management",
    "health insights"
  ],
  authors: [{ name: "WellnessGrid Team" }],
  creator: "WellnessGrid",
  publisher: "WellnessGrid",
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: "index, follow"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "WellnessGrid",
    title: "WellnessGrid - AI Health Companion for Teens",
    description: "AI-powered chronic condition coach for teens with a clean, accessible interface. Track your health, get personalized insights, and manage your wellness journey with confidence.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "WellnessGrid - AI Health Companion for Teens",
        type: "image/png"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@wellnessgrid",
    creator: "@wellnessgrid",
    title: "WellnessGrid - AI Health Companion for Teens",
    description: "AI-powered chronic condition coach for teens with a clean, accessible interface. Track your health, get personalized insights, and manage your wellness journey with confidence.",
    images: [
      {
        url: "/images/twitter-image.png",
        width: 1200,
        height: 630,
        alt: "WellnessGrid - AI Health Companion for Teens"
      }
    ]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/images/logo-icon.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [
      { url: "/images/logo-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.ico"
  },
  manifest: "/manifest.json",
  generator: 'Next.js',
  applicationName: "WellnessGrid",
  referrer: "origin-when-cross-origin",
  category: "Health & Fitness",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml"
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Removed maximumScale to allow user zooming for accessibility (WCAG AA requirement)
  themeColor: '#dc2626', // Updated to match new primary color
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <SafeAppProvider>
            <div className="min-h-screen bg-background">
              {children}
              <EnhancedMobileNav />
            </div>
            <Toaster position="top-center" richColors />
          </SafeAppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
