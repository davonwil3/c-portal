"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  sources?: any[]
}

interface AIChatProps {
  accountId: string
  clientId?: string
}

export function AIChat({ accountId, clientId }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputMessage,
          accountId,
          clientId,
          includeHistory: true
        })
      })

      const result = await response.json()

      if (result.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.data.answer,
          timestamp: new Date(),
          sources: result.data.sources
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Sorry, I encountered an error: ${result.error}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="space-y-4 h-96 overflow-y-auto border rounded-lg p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Ask me anything about your files, invoices, or projects!</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-[#3C3CFF] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.sources && message.sources.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs opacity-75 cursor-pointer">
                      Sources ({message.sources.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {message.sources.map((source, index) => (
                        <div key={index()} className="text-xs opacity-75 p-2 bg-black/5 rounded">
                          <div className="font-medium">{source.document}</div>
                          <div className="opacity-60">{source.chunk}</div>
                          <div className="opacity-50">Similarity: {(source.similarity * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your files, invoices, or projects..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
