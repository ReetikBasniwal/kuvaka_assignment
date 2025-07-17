import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Copy, 
  Check,
  Sparkles,
  User,
  Bot
} from 'lucide-react'
import { useOTPAuth } from '../hooks/useOTPAuth'
import { useToast } from '../hooks/use-toast'
import type { Chatroom, Message } from '../types'

interface ChatInterfaceProps {
  chatroom: Chatroom
  onBack: () => void
  onUpdateChatroom: (chatroom: Chatroom) => void
}

export function ChatInterface({ chatroom, onBack, onUpdateChatroom }: ChatInterfaceProps) {
  const { user } = useOTPAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`messages_${chatroom.id}`)
    if (saved) {
      setMessages(JSON.parse(saved))
    }
  }, [chatroom.id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem(`messages_${chatroom.id}`, JSON.stringify(newMessages))
    setMessages(newMessages)
    
    // Update chatroom with last message
    if (newMessages.length > 0) {
      const lastMessage = newMessages[newMessages.length - 1]
      const updatedChatroom = {
        ...chatroom,
        lastMessage: lastMessage.content.substring(0, 100),
        lastMessageTime: lastMessage.timestamp
      }
      onUpdateChatroom(updatedChatroom)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !user) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      chatroomId: chatroom.id
    }

    const newMessages = [...messages, userMessage]
    saveMessages(newMessages)
    setInputValue('')
    setIsTyping(true)

    try {
      // Simulate AI response with a timeout
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          content: "This is a simulated AI response.",
          isUser: false,
          timestamp: new Date().toISOString(),
          chatroomId: chatroom.id
        };
        setMessages((prev: Message[]) => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('AI response error:', error)
      setIsTyping(false)
      
      // Fallback response
      setTimeout(() => {
        const fallbackMessage: Message = {
          id: `msg_${Date.now()}_fallback`,
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          isUser: false,
          timestamp: new Date().toISOString(),
          chatroomId: chatroom.id
        }

        const finalMessages = [...newMessages, fallbackMessage]
        saveMessages(finalMessages)
      }, 1000)
    }
  }

  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
      toast({
        title: "Copied to clipboard",
        description: "Message content copied successfully"
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      
      const imageMessage: Message = {
        id: `msg_${Date.now()}_img`,
        content: `Shared an image: ${file.name}`,
        isUser: true,
        timestamp: new Date().toISOString(),
        chatroomId: chatroom.id,
        imageUrl
      }

      const newMessages = [...messages, imageMessage]
      saveMessages(newMessages)
      
      // AI response to image
      setIsTyping(true)
      setTimeout(() => {
        const aiResponse: Message = {
          id: `msg_${Date.now()}_ai_img`,
          content: "I can see you've shared an image! While I can't analyze images in this demo, I'd be happy to help you with any questions about it.",
          isUser: false,
          timestamp: new Date().toISOString(),
          chatroomId: chatroom.id
        }
        
        const finalMessages = [...newMessages, aiResponse]
        saveMessages(finalMessages)
        setIsTyping(false)
      }, 1500)
    }
    
    reader.readAsDataURL(file)
    event.target.value = '' // Reset input
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{chatroom.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isTyping ? 'AI is typing...' : 'AI Assistant'}
              </p>
            </div>
          </div>
          
          <Badge variant="secondary" className="hidden sm:flex">
            {messages.length} messages
          </Badge>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">
                Ask me anything! I'm here to help with questions, creative tasks, and more.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 group ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[70%] ${message.isUser ? 'order-first' : ''}`}>
                  <Card className={`p-3 ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white border-0' 
                      : 'bg-card'
                  }`}>
                    {message.imageUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.imageUrl} 
                          alt="Shared image"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                  
                  <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                    message.isUser ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyMessage(message.content, message.id)}
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {message.isUser && (
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 mt-1">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-3 bg-card">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            
            <Input
              placeholder="Message Gemini..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1"
              disabled={isTyping}
            />
            
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="shrink-0 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}