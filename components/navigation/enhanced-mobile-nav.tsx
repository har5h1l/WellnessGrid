"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Activity, MessageCircle, BarChart, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store/safe-context"
import { Button } from "@/components/ui/button"

export function EnhancedMobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide navigation on login, setup, and landing pages only
  const hiddenPages = ["/login", "/setup", "/"]
  const shouldHideNav = hiddenPages.includes(pathname) || pathname.startsWith("/setup")
  
  if (shouldHideNav) {
    return null
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Home",
    },
    {
      href: "/track",
      icon: Activity,
      label: "Track",
    },
    {
      href: "/chat",
      icon: MessageCircle,
      label: "Chat",
    },
    {
      href: "/insights",
      icon: BarChart,
      label: "Insights",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
  ]

  const handleNavigation = (href: string) => {
    try {
      router.push(href)
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/track" && pathname.startsWith("/track"))

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full px-1 py-2 transition-colors",
                isActive 
                  ? "text-red-600" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
