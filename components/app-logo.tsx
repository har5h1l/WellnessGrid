import Image from "next/image"
import Link from "next/link"

interface AppLogoProps {
  variant?: "full" | "icon"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AppLogo({ variant = "full", size = "md", className = "" }: AppLogoProps) {
  const sizes = {
    sm: variant === "full" ? { width: 120, height: 40 } : { width: 32, height: 32 },
    md: variant === "full" ? { width: 180, height: 60 } : { width: 48, height: 48 },
    lg: variant === "full" ? { width: 240, height: 80 } : { width: 64, height: 64 },
  }

  const src = variant === "full" ? "/images/logo.png" : "/images/logo-icon.png"
  const alt = "WellnessGrid Logo"

  return (
    <Link href="/dashboard" className={className}>
      <Image
        src={src || "/images/logo-icon.png"}
        alt={alt}
        width={sizes[size].width}
        height={sizes[size].height}
        priority
        className="object-contain"
      />
    </Link>
  )
}
