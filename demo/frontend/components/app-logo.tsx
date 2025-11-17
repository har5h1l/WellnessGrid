import Link from "next/link"
import { Heart } from "lucide-react"

interface AppLogoProps {
    variant?: "full" | "icon"
    size?: "sm" | "md" | "lg"
    className?: string
}

export function AppLogo({ variant = "full", size = "md", className = "" }: AppLogoProps) {
    const sizeClasses = {
        sm: variant === "full" ? "text-lg" : "w-8 h-8",
        md: variant === "full" ? "text-2xl" : "w-12 h-12",
        lg: variant === "full" ? "text-3xl" : "w-16 h-16",
    }

    if (variant === "icon") {
        return (
            <Link href="/dashboard" className={className}>
                <div className={`${sizeClasses[size]} bg-red-500 rounded-2xl flex items-center justify-center`}>
                    <Heart className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                </div>
            </Link>
        )
    }

    return (
        <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
            <div className={`${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'} bg-red-500 rounded-2xl flex items-center justify-center`}>
                <Heart className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
            </div>
            <span className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
                WellnessGrid
            </span>
        </Link>
    )
}

