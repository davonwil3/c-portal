"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Paperclip, Smile, MoreHorizontal, MessageCircle } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  message_type: string
  sender_name: string
  sender_type: 'client' | 'account_user'
  client_id?: string
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
  attachment_size?: number
  is_read: boolean
  read_at?: string
  parent_message_id?: string
  thread_id?: string
  created_at: string
  updated_at: string
}

interface DashboardMessageChatProps {
  projectId: string
  accountId: string
  projectName: string
  clientName?: string
  brandColor?: string
}

export function DashboardMessageChat({ 
  projectId, 
  accountId, 
  projectName,
  clientName,
  brandColor = '#3C3CFF' 
}: DashboardMessageChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages on component mount
  useEffect(() => {
    loadMessages()
  }, [projectId, accountId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages?projectId=${projectId}&accountId=${accountId}`)
      const result = await response.json()

      if (result.success) {
        setMessages(result.data)
        // Mark messages as read
        markMessagesAsRead(result.data)
      } else {
        console.error('Failed to load messages:', result.error)
        toast.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async (messagesToMark: Message[]) => {
    const unreadMessageIds = messagesToMark
      .filter(msg => !msg.is_read && msg.sender_type === 'client')
      .map(msg => msg.id)

    if (unreadMessageIds.length > 0) {
      try {
        await fetch('/api/messages/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageIds: unreadMessageIds,
            projectId,
            accountId
          }),
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    if (!accountId) {
      console.error('Account ID is missing, cannot send message')
      toast.error('Unable to send message: Account ID is missing')
      return
    }

    const messageData = {
      projectId,
      accountId,
      content: newMessage.trim(),
      senderName: 'You', // Account user
      senderType: 'account_user',
      clientId: null,
    }

    console.log('Sending message with data:', messageData)

    try {
      setSending(true)
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      })

      const result = await response.json()

      if (result.success) {
        setMessages(prev => [...prev, result.data])
        setNewMessage("")
      } else {
        console.error('Failed to send message:', result.error)
        toast.error(`Failed to send message: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-white border-0 shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-0">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" style={{ color: brandColor }} />
            <span className="text-xl font-semibold text-gray-900">Project Messages</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: brandColor }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-white border-0 shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-0">
      {/* Messages Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" style={{ color: brandColor }} />
            <span className="text-xl font-semibold text-gray-900">Project Messages</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">Start a conversation with your client about this project.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'account_user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender_type === 'account_user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ 
                      backgroundColor: message.sender_type === 'account_user' ? brandColor : '#6B7280',
                      color: 'white'
                    }}
                  >
                    {getInitials(message.sender_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender_type === 'account_user' 
                    ? 'rounded-tr-md' 
                    : 'rounded-tl-md bg-[#F1F2F7]'
                }`}
                style={{
                  backgroundColor: message.sender_type === 'account_user' ? brandColor : undefined,
                  color: message.sender_type === 'account_user' ? 'white' : undefined
                }}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">{message.sender_name}</span>
                    <span className={`text-xs ${
                      message.sender_type === 'account_user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
            style={{ backgroundColor: brandColor }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
