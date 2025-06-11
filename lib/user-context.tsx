"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  name: string
  age: string
  conditions: string[]
  medications: string[]
  tools: string[]
  wellnessScore: number
  goals: string[]
}

interface UserContextType {
  user: User
  updateUser: (updates: Partial<User>) => void
}

const defaultUser: User = {
  name: "You",
  age: "16",
  conditions: ["Asthma"],
  medications: ["Albuterol", "Advair"],
  tools: ["Medication Reminders", "Symptom Tracking", "Mood Tracking"],
  wellnessScore: 75,
  goals: ["Better medication adherence", "Improved symptom tracking"],
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser)

  useEffect(() => {
    const savedUser = localStorage.getItem("wellnessgrid-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const updateUser = (updates: Partial<User>) => {
    const newUser = { ...user, ...updates }
    setUser(newUser)
    localStorage.setItem("wellnessgrid-user", JSON.stringify(newUser))
  }

  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
