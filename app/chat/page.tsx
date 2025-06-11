"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApp, useUser, useConditions } from "@/lib/store/enhanced-context"
import { AppSelectors } from "@/lib/store/selectors"
import { MoodTracker } from "@/components/mood-tracker"
import { SymptomTracker } from "@/components/symptom-tracker"
import { MedicationLogger } from "@/components/medication-logger"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Send, Activity, Heart, Pill, TrendingUp, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ChatAssistant() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()

  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showMoodTracker, setShowMoodTracker] = useState(false)
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [showMedicationLogger, setShowMedicationLogger] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isReady) {
      actions.navigate("/chat")
    }
    scrollToBottom()
  }, [actions, isReady, state.aiMessages])

  // Show loading if context is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      icon: Activity,
      label: "Log symptom",
      action: () => setShowSymptomTracker(true),
      color: "bg-red-100 text-red-600",
    },
    {
      icon: Heart,
      label: "Track mood",
      action: () => setShowMoodTracker(true),
      color: "bg-pink-100 text-pink-600",
    },
    {
      icon: Pill,
      label: "Log medication",
      action: () => setShowMedicationLogger(true),
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "View trends",
      action: () => (window.location.href = "/track"),
      color: "bg-green-100 text-green-600",
    },
    {
      icon: Calendar,
      label: "Schedule reminder",
      action: () => handleQuickMessage("Help me set up a medication reminder"),
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: AlertCircle,
      label: "Emergency help",
      action: () => handleQuickMessage("I need emergency guidance"),
      color: "bg-orange-100 text-orange-600",
    },
  ]

  const handleQuickMessage = (message: string) => {
    setNewMessage(message)
    handleSendMessage(message)
  }

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    const conditionSpecificResponses: Record<string, string[]> = {
      asthma: [
        "Based on your asthma history, I'd recommend tracking any breathing changes. Would you like to log a symptom?",
        "Remember to keep your inhaler nearby, especially when you notice early warning signs like coughing or chest tightness.",
        "For asthma management, consistent tracking helps identify triggers. Have you noticed any patterns lately?",
      ],
      diabetes: [
        "With your diabetes, regular glucose monitoring is key. Would you like to log your latest reading?",
        "Staying hydrated is especially important with diabetes. Have you been drinking enough water today?",
        "Managing diabetes involves balancing medication, diet, and activity. How has your energy been today?",
      ],
      arthritis: [
        "For juvenile arthritis, tracking pain levels can help your doctor adjust treatment. Would you like to log your symptoms?",
        "Gentle movement can help with arthritis stiffness. Have you done any stretches today?",
        "Temperature changes can affect arthritis symptoms. Have you noticed any weather-related patterns?",
      ],
    }

    // Symptom-related responses
    if (message.includes("symptom") || message.includes("pain") || message.includes("hurt")) {
      return "I understand you're experiencing symptoms. It's important to track these patterns. Would you like me to help you log this symptom? I can also provide some general guidance based on your condition."
    }

    // Mood-related responses
    if (
      message.includes("mood") ||
      message.includes("sad") ||
      message.includes("anxious") ||
      message.includes("stressed")
    ) {
      return "Thank you for sharing how you're feeling. Your emotional wellbeing is just as important as your physical health. Tracking your mood can help identify patterns. Would you like some coping strategies or should we log your current mood?"
    }

    // Medication-related responses
    if (message.includes("medication") || message.includes("medicine") || message.includes("pill")) {
      return "Medication adherence is crucial for managing your condition effectively. I can help you track your medications, set reminders, or answer questions about your treatment plan. What would be most helpful?"
    }

    // Emergency responses
    if (message.includes("emergency") || message.includes("urgent") || message.includes("help")) {
      return "If this is a medical emergency, please call 911 or go to the nearest emergency room immediately. For urgent but non-emergency concerns, contact your healthcare provider. I'm here to support you with general guidance and tracking."
    }

    // Condition-specific responses
    for (const condition of conditions) {
      const conditionName = condition.name.toLowerCase()
      for (const key in conditionSpecificResponses) {
        if (conditionName.includes(key)) {
          const responses = conditionSpecificResponses[key]
          return responses[Math.floor(Math.random() * responses.length)]
        }
      }
    }

    // General supportive responses
    const supportiveResponses = [
      "I'm here to support you on your health journey. What would you like to focus on today?",
      "Thank you for sharing that with me. Managing a chronic condition takes courage, and you're doing great by staying engaged with your health.",
      "That's a great question! Based on your health profile, I can provide some personalized suggestions. What specific area would you like to explore?",
      "I understand this can be challenging. Remember that small, consistent steps make a big difference in managing your health. How can I help you today?",
    ]

    return supportiveResponses[Math.floor(Math.random() * supportiveResponses.length)]
  }

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || newMessage
    if (!messageToSend.trim()) return

    const userMessage = {
      type: "user" as const,
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    actions.addAIMessage(userMessage)
    setNewMessage("")
    setIsTyping(true)

    // Simulate AI processing time
    setTimeout(
      () => {
        const aiResponse = generateAIResponse(messageToSend)
        const aiMessage = {
          type: "ai" as const,
          content: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          suggestions: ["Log symptoms", "Track mood", "View progress", "Set reminder"],
        }

        actions.addAIMessage(aiMessage)
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen wellness-gradient flex items-center justify-center">
        <div className="text-center p-8">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WellnessGrid</h2>
          <p className="text-gray-600 mb-8">Please set up your profile to chat with the AI assistant</p>
          <Link href="/setup">
            <Button className="wellness-button-primary px-8 py-6 text-lg">Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  const aiMessages = AppSelectors.getRecentAIMessages(state)

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-gray-900">AI Health Coach</h1>
        </div>
        <div className="w-10"></div> {/* Spacer for balance */}
      </header>

      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {aiMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-32 h-32 mb-6">
                <Image
                  src="/images/ai-assistant.png"
                  alt="AI Assistant"
                  width={128}
                  height={128}
                  className="object-contain animate-float"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to your AI Health Coach</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                I'm here to help you manage your {conditions.length > 0 ? conditions[0].name : "health condition"}. Ask
                me anything!
              </p>
            </div>
          ) : (
            aiMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                {message.type === "ai" && (
                  <div className="wellness-avatar mr-2">
                    <Image src="/images/ai-assistant.png" alt="AI Coach" width={40} height={40} />
                  </div>
                )}
                <div className="max-w-xs space-y-1">
                  <div className="text-xs text-gray-500">{message.type === "ai" ? "AI Coach" : user.name}</div>
                  <div className={message.type === "ai" ? "wellness-message-ai" : "wellness-message-user"}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickMessage(suggestion)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {message.type === "user" && (
                  <div className="wellness-avatar ml-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-red-600">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="wellness-avatar mr-2">
                <Image src="/images/ai-assistant.png" alt="AI Coach" width={40} height={40} />
              </div>
              <div className="wellness-message-ai">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons */}
        <div className="px-4 py-3">
          <div className="wellness-scrollable-buttons">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`wellness-action-button ${action.color} flex items-center space-x-2`}
              >
                <action.icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="px-4 py-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 rounded-full wellness-input"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim()}
              size="icon"
              className="wellness-button-primary rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMoodTracker && <MoodTracker onClose={() => setShowMoodTracker(false)} />}
      {showSymptomTracker && <SymptomTracker onClose={() => setShowSymptomTracker(false)} />}
      {showMedicationLogger && <MedicationLogger onClose={() => setShowMedicationLogger(false)} />}
    </div>
  )
}
