"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Activity, MessageCircle, BarChart, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  if (pathname === "/login" || pathname.startsWith("/setup") || pathname === "/") {
    return null
  }

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/track", icon: Activity, label: "Track" },
    { href: "/chat", icon: MessageCircle, label: "Chat" },
    { href: "/reports", icon: BarChart, label: "Data" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 transition-transform duration-300 md:hidden",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          const isChat = item.href === "/chat"

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "wellness-nav-item w-full h-full",
                isActive ? "wellness-nav-item-active" : "wellness-nav-item-inactive",
                isChat ? "relative -mt-4" : "",
              )}
            >
              {isChat && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full p-3 shadow-lg">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
              )}
              {!isChat && <item.icon className={cn("w-5 h-5 mb-1", isActive ? "text-red-500" : "text-gray-500")} />}
              <span className={cn("font-medium", isChat ? "mt-3" : "")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
