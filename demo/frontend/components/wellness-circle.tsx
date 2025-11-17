"use client"

import { useEffect, useState } from "react"

interface WellnessCircleProps {
    score: number
    size?: number
    strokeWidth?: number
    showLabel?: boolean
    className?: string
}

export function WellnessCircle({
    score,
    size = 120,
    strokeWidth = 8,
    showLabel = true,
    className = "",
}: WellnessCircleProps) {
    const [animatedScore, setAnimatedScore] = useState(0)

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedScore(score)
        }, 300)
        return () => clearTimeout(timer)
    }, [score])

    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference

    const getColor = (score: number) => {
        if (score >= 80) return "#10b981" // green-500
        if (score >= 60) return "#f59e0b" // yellow-500
        return "#ef4444" // red-500
    }

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* background circle */}
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="transparent" />
                {/* progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor(animatedScore)}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{Math.round(animatedScore)}%</span>
                    <span className="text-xs text-gray-600">wellness</span>
                </div>
            )}
        </div>
    )
}

