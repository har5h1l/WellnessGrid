"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Activity, MessageCircle, BarChart, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/store/enhanced-context"
import { Button } from "@/components/ui/button"

export function EnhancedMobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { state, actions } = useApp()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

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

  // Hide navigation on certain pages
  if (pathname === "/login" || pathname.startsWith("/setup") || pathname === "/") {
    return null
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Home",
      onClick: () => actions.navigate("/dashboard"),
    },
    {
      href: "/track",
      icon: Activity,
      label: "Track",
      onClick: () => actions.navigate("/track"),
    },
    {
      href: "/chat",
      icon: MessageCircle,
      label: "Chat",
      badge: state.aiMessages.filter((m) => m.type === "ai" && !m.timestamp).length,
      onClick: () => actions.navigate("/chat"),
    },
    {
      href: "/reports",
      icon: BarChart,
      label: "Data",
      onClick: () => actions.navigate("/reports"),
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      onClick: () => actions.navigate("/profile"),
    },
  ]

  const handleNavigation = (item: (typeof navItems)[0]) => {
    try {
      item.onClick()
      router.push(item.href)
    } catch (error) {
      console.error("Navigation error:", error)
      // Fallback to direct navigation
      router.push(item.href)
    }
  }

  return (
    <>
      {/* Quick Add FAB */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 transition-transform duration-300 md:hidden",
          isVisible ? "translate-y-0" : "translate-y-20",
        )}
      >
        <Button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="w-14 h-14 rounded-full wellness-button-primary shadow-lg"
          size="icon"
        >
          <Plus className={cn("w-6 h-6 transition-transform", showQuickAdd && "rotate-45")} />
        </Button>

        {/* Quick Add Menu */}
        {showQuickAdd && (
          <div className="absolute bottom-16 right-0 space-y-2">
            <Button
              onClick={() => {
                setShowQuickAdd(false)
                router.push("/dashboard?action=symptom")
              }}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
              size="icon"
            >
              <Activity className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                setShowQuickAdd(false)
                router.push("/dashboard?action=mood")
              }}
              className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
              size="icon"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-100 transition-transform duration-300 md:hidden",
          isVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isChat = item.href === "/chat"

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item)}
                className={cn(
                  "wellness-nav-item w-full h-full relative",
                  isActive ? "wellness-nav-item-active" : "wellness-nav-item-inactive",
                  isChat ? "-mt-4" : "",
                )}
              >
                {isChat && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full p-3 shadow-lg">
                    <item.icon className="w-5 h-5 text-white" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-xs text-white flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {!isChat && (
                  <>
                    <item.icon className={cn("w-5 h-5 mb-1", isActive ? "text-red-500" : "text-gray-500")} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute top-1 right-1/2 translate-x-2 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                <span className={cn("font-medium", isChat ? "mt-3" : "")}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
