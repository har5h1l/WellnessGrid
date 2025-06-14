import Image from "next/image"

interface ConditionIconProps {
  condition: string
  size?: number
  className?: string
}

export function ConditionIcon({ condition, size = 40, className = "" }: ConditionIconProps) {
  // Map condition names to appropriate icons
  const getIconForCondition = (condition: string) => {
    const conditionLower = condition.toLowerCase()

    if (
      conditionLower.includes("asthma") ||
      conditionLower.includes("lung") ||
      conditionLower.includes("respiratory")
    ) {
      return "/images/lungs-pink.png"
    }

    if (conditionLower.includes("diabetes")) {
      return "/images/medication.png"
    }

    if (conditionLower.includes("arthritis")) {
      return "/images/lungs-purple.png" // Using as a generic icon for now
    }

    // Default icon
    return "/images/medication-blue.png"
  }

  const iconSrc = getIconForCondition(condition)

  return (
    <div className={`relative ${className}`}>
      <Image
        src={iconSrc || "/images/condition-default.png"}
        alt={`${condition} icon`}
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}
