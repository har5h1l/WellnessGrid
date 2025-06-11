import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  image?: string
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  image = "/images/character.png",
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="w-32 h-32 mb-6">
        <Image
          src={image || "/placeholder.svg"}
          alt="Empty state illustration"
          width={128}
          height={128}
          className="object-contain"
        />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action && (
        <Link href={action.href}>
          <Button className="wellness-button-primary">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
