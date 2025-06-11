import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EnhancedMobileNav } from "@/components/navigation/enhanced-mobile-nav"
import { AppProvider } from "@/lib/store/enhanced-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WellnessGrid - AI Health Companion for Teens",
  description: "AI-powered chronic condition coach for teens with a clean, accessible interface",
  icons: {
    icon: "/images/logo-icon.png",
    apple: "/images/logo-icon.png",
  },
  manifest: "/manifest.json",
  themeColor: "#ef4444",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AppProvider>
            <div className="min-h-screen bg-background">
              {children}
              <EnhancedMobileNav />
            </div>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
