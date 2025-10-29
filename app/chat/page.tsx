"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useApp, useUser, useConditions } from "@/lib/store/safe-context"
import { AppLogo } from "@/components/app-logo"
import { ArrowLeft, Send, Bot } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AIMessage {
  type: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function ChatAssistant() {
  const { state, actions, isReady } = useApp()
  const user = useUser()
  const conditions = useConditions()

  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([])

  // Remove the navigation effect that was causing redirect issues
  // useEffect(() => {
  //   if (isReady) {
  //     actions.navigate("/chat")
  //   }
  // }, [actions, isReady])

  // Show loading if context is not ready (temporarily bypassed for demo)
  // if (!isReady) {
  //   return (
  //     <div className="min-h-screen wellness-gradient flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading chat...</p>
  //       </div>
  //     </div>
  //   )
  // }

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || newMessage
    if (!messageToSend.trim()) return

    const userMessage: AIMessage = {
      type: "user",
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    try {
      // Call the actual AI API
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: messageToSend,
          sessionId: `chat-${Date.now()}`,
          userContext: {
            userId: user?.id,
            conditions: conditions.map(c => c.name),
            userProfile: user
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiResponse: AIMessage = {
        type: "ai",
        content: data.answer || data.improvedAnswer || "I'm here to help you with your health journey. How can I assist you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Fallback response if API fails
      const aiResponse: AIMessage = {
        type: "ai",
        content: "I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to ask me about your health management.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }
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

  return (
    <div className="min-h-screen wellness-gradient pb-20">
      {/* Header */}
      <header className="wellness-header relative z-30">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900 truncate px-2">
            Your Health Assistant
          </h1>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Your Health Assistant</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                I'm here to help you manage your {conditions.length > 0 ? conditions[0].name : "health condition"}. Ask
                me anything!
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="mb-6">
                {message.type === "user" ? (
                  // User message - right aligned bubble
                  <div className="flex justify-end">
                    <div className="flex items-start space-x-3 max-w-full">
                      <div className="wellness-message-user">
                        {message.content}
                      </div>
                      <div className="wellness-avatar">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-red-600">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // AI message - full width
                  <div className="w-full">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="wellness-avatar">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">Your Health Assistant</div>
                    </div>
                    <div className="ml-11">
                      <div className="wellness-message-ai">
                        <div className="wellness-message-ai-content prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold text-gray-800 mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold text-gray-700 mb-1">{children}</h3>,
                              p: ({children}) => <p className="text-gray-700 mb-2 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="text-gray-700">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                              em: ({children}) => <em className="italic text-gray-800">{children}</em>,
                              table: ({children}) => <div className="overflow-x-auto mb-4"><table className="min-w-full border border-gray-200 rounded-lg">{children}</table></div>,
                              thead: ({children}) => <thead className="bg-gray-50">{children}</thead>,
                              tbody: ({children}) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
                              tr: ({children}) => <tr>{children}</tr>,
                              th: ({children}) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">{children}</th>,
                              td: ({children}) => <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">{children}</td>,
                              code: ({children}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                              pre: ({children}) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm">{children}</pre>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 mb-2">{children}</blockquote>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="mb-6">
              <div className="w-full">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="wellness-avatar">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Your Health Assistant</div>
                </div>
                <div className="ml-11">
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
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="px-4 py-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask about your health..."
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
    </div>
  )
}
