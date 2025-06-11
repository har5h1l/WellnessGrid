"use client"

import { useEffect, useState } from "react"

interface GlitchTextProps {
  text: string
  className?: string
  glitchInterval?: number
  glitchProbability?: number
}

export function GlitchText({ text, className = "", glitchInterval = 3000, glitchProbability = 0.1 }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    setDisplayText(text)
  }, [text])

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < glitchProbability) {
        // Start glitch effect
        setIsGlitching(true)

        // Create glitch effect
        const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        const glitchedText = text
          .split("")
          .map((char) => (Math.random() < 0.3 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char))
          .join("")

        setDisplayText(glitchedText)

        // Restore original text after brief moment
        setTimeout(() => {
          setDisplayText(text)
          setIsGlitching(false)
        }, 100)
      }
    }, glitchInterval)

    return () => clearInterval(interval)
  }, [text, glitchInterval, glitchProbability])

  return (
    <span className={`${className} ${isGlitching ? "text-red-500" : ""} transition-colors duration-100`}>
      {displayText}
    </span>
  )
}
