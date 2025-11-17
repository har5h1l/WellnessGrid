"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { demoAPI } from "@/lib/demo-api"
import { ArrowLeft, Send, Bot, User, AlertCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // add welcome message
    useEffect(() => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hello Sarah! I'm your WellnessGrid AI assistant. I'm here to help you manage your Type 1 diabetes and overall wellness. Based on your tracking data, you're doing an excellent job - your wellness score is 78!\n\nI can help you with:\n- Understanding your glucose readings\n- Diabetes management tips\n- Sleep, mood, and activity guidance\n- Interpreting your health trends\n\nWhat would you like to know?",
            timestamp: new Date().toISOString()
        }])
    }, [])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await demoAPI.chat(input)
            
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.answer,
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I'm having trouble connecting to the server right now. Please make sure the demo backend is running on port 5001. You can start it with `npm start` from the demo/backend directory.",
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // quick prompts
    const quickPrompts = [
        "How is my glucose doing?",
        "Give me tips for managing diabetes",
        "How's my sleep affecting my health?",
        "What should I know about insulin timing?"
    ]

    return (
        <div className="min-h-screen wellness-gradient flex flex-col">
            {/* demo banner */}
            <div className="bg-red-500 text-white py-2 px-4 text-center text-sm">
                <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>DEMO MODE - AI responses use keyword matching, not real LLMs</span>
                </div>
            </div>

            {/* header */}
            <div className="bg-white border-b border-gray-200 py-4 px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">Back to Dashboard</span>
                        </Link>
                        <div className="hidden md:block w-px h-6 bg-gray-300"></div>
                        <h1 className="text-xl font-bold text-gray-900 hidden md:block">AI Health Assistant</h1>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Bot className="h-5 w-5" />
                        <span className="text-sm">Demo Mode</span>
                    </div>
                </div>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {messages.map((message) => (
                        <div 
                            key={message.id} 
                            className={`mb-6 flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                            )}
                            
                            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                                <div className={`p-4 ${
                                    message.role === 'user' 
                                        ? 'bg-red-500 text-white rounded-2xl' 
                                        : 'bg-transparent'
                                }`}>
                                    <div className={`prose prose-sm max-w-none ${
                                        message.role === 'user' ? 'prose-invert' : ''
                                    }`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 px-4">
                                    {new Date(message.timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </p>
                            </div>

                            {message.role === 'user' && (
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="mb-6 flex gap-4">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* quick prompts */}
            {messages.length === 1 && (
                <div className="bg-white border-t border-gray-200 py-4 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <p className="text-sm text-gray-600 mb-3">Quick questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInput(prompt)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* input */}
            <div className="bg-white border-t border-gray-200 py-4 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about your health..."
                            className="flex-1 px-4 py-3 rounded-2xl border-secondary bg-secondary/50 focus:border-red-200 focus:ring-red-200 focus:outline-none focus:ring-2"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="wellness-button-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-5 w-5" />
                            <span className="hidden sm:inline">Send</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        This is a demo AI assistant using keyword matching. Responses are pre-written.
                    </p>
                </div>
            </div>
        </div>
    )
}

