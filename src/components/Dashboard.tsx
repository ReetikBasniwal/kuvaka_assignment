import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Plus, 
  Search, 
  MessageCircle, 
  Moon, 
  Sun, 
  LogOut,
  Trash2,
  Edit3
} from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'
import { useOTPAuth } from '../hooks/useOTPAuth'
import { useToast } from '../hooks/use-toast'
import type { Chatroom } from '../types'
import { ChatInterface } from './Chat'

export function Dashboard() {
  const { user, logout } = useOTPAuth()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const { toast } = useToast()
  const [chatrooms, setChatrooms] = useState<Chatroom[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChatroom, setSelectedChatroom] = useState<Chatroom | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newChatroomName, setNewChatroomName] = useState('')

  // Load chatrooms from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`chatrooms_${user.id}`)
      if (saved) {
        setChatrooms(JSON.parse(saved))
      }
    }
  }, [user])

  // Save chatrooms to localStorage
  const saveChatrooms = (rooms: Chatroom[]) => {
    if (user) {
      localStorage.setItem(`chatrooms_${user.id}`, JSON.stringify(rooms))
      setChatrooms(rooms)
    }
  }

  const createChatroom = () => {
    if (!newChatroomName.trim() || !user) return

    const newRoom: Chatroom = {
      id: `room_${Date.now()}`,
      name: newChatroomName.trim(),
      userId: user.id,
      createdAt: new Date().toISOString()
    }

    const updatedRooms = [newRoom, ...chatrooms]
    saveChatrooms(updatedRooms)
    setNewChatroomName('')
    setIsCreating(false)
    setSelectedChatroom(newRoom)
    
    toast({
      title: "Chatroom created",
      description: `"${newRoom.name}" is ready for conversations`
    })
  }

  const deleteChatroom = (roomId: string) => {
    const room = chatrooms.find(r => r.id === roomId)
    const updatedRooms = chatrooms.filter(r => r.id !== roomId)
    saveChatrooms(updatedRooms)
    
    if (selectedChatroom?.id === roomId) {
      setSelectedChatroom(null)
    }
    
    // Clear messages for this room
    if (user) {
      localStorage.removeItem(`messages_${roomId}`)
    }
    
    toast({
      title: "Chatroom deleted",
      description: room ? `"${room.name}" has been removed` : "Chatroom removed"
    })
  }

  const filteredChatrooms = chatrooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedChatroom) {
    return (
      <ChatInterface 
        chatroom={selectedChatroom}
        onBack={() => setSelectedChatroom(null)}
        onUpdateChatroom={(updatedRoom) => {
          const updatedRooms = chatrooms.map(r => 
            r.id === updatedRoom.id ? updatedRoom : r
          )
          saveChatrooms(updatedRooms)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Gemini</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.phone || 'User'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chatrooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {!isCreating ? (
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Chatroom name..."
                value={newChatroomName}
                onChange={(e) => setNewChatroomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createChatroom()}
                className="min-w-48"
                autoFocus
              />
              <Button onClick={createChatroom} disabled={!newChatroomName.trim()}>
                Create
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreating(false)
                setNewChatroomName('')
              }}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Chatrooms Grid */}
        {filteredChatrooms.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No chatrooms found' : 'No chatrooms yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first chatroom to start conversations with AI'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Chatroom
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChatrooms.map((room) => (
              <Card 
                key={room.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                onClick={() => setSelectedChatroom(room)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {room.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChatroom(room.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {room.lastMessage && (
                    <>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {room.lastMessage}
                      </p>
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(room.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      AI Chat
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}