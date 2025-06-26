"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatManager, ChatSession } from "@/lib/chat-manager"
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  PanelLeftClose, 
  PanelLeftOpen,
  Clock,
  MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  activeSession: ChatSession | null
  onSessionChange: (session: ChatSession) => void
  onNewChat: () => void
}

export function ChatSidebar({ 
  isOpen, 
  onToggle, 
  activeSession, 
  onSessionChange, 
  onNewChat 
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // Load sessions on mount and when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const data = ChatManager.getChatSessions()
      setSessions(data.sessions)
    }
  }, [isOpen])

  // Refresh sessions when active session changes
  useEffect(() => {
    const data = ChatManager.getChatSessions()
    setSessions(data.sessions)
  }, [activeSession])

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the chat selection
    
    if (sessions.length <= 1) {
      // Don't delete the last chat
      return
    }
    
    ChatManager.deleteChat(chatId)
    const data = ChatManager.getChatSessions()
    setSessions(data.sessions)
    
    // If we deleted the active chat, switch to the new active one
    if (activeSession?.id === chatId) {
      const newActiveSession = ChatManager.getActiveChat()
      if (newActiveSession) {
        onSessionChange(newActiveSession)
      }
    }
  }

  const handleNewChat = () => {
    onNewChat()
    // Refresh sessions list
    const data = ChatManager.getChatSessions()
    setSessions(data.sessions)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-50",
        "w-80",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="hover:bg-gray-100"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-100">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <div className="p-2 space-y-1">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onSessionChange(session)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors group",
                    "hover:bg-gray-50",
                    activeSession?.id === session.id 
                      ? "bg-red-50 border border-red-200" 
                      : "border border-transparent"
                  )}
                >
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className={cn(
                      "w-4 h-4",
                      activeSession?.id === session.id ? "text-red-500" : "text-gray-400"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium truncate text-sm",
                      activeSession?.id === session.id ? "text-red-900" : "text-gray-900"
                    )}>
                      {session.title}
                    </h3>
                    
                    {session.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {session.lastMessage}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{ChatManager.getDisplayDate(session.updatedAt)}</span>
                      {session.messageCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{session.messageCount} messages</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  {sessions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteChat(session.id, e)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto",
                        "hover:bg-red-100 hover:text-red-600"
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

// Toggle Button Component (can be used separately)
export function ChatSidebarToggle({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean
  onToggle: () => void 
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="hover:bg-gray-100 p-2"
      title={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="w-5 h-5" />
      ) : (
        <PanelLeftOpen className="w-5 h-5" />
      )}
    </Button>
  )
} 