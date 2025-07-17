export interface User {
    id: string
    phone: string
    countryCode: string
    createdAt: string
  }
  
  export interface Chatroom {
    id: string
    name: string
    lastMessage?: string
    lastMessageTime?: string
    userId: string
    createdAt: string
  }
  
  export interface Message {
    id: string
    content: string
    isUser: boolean
    timestamp: string
    chatroomId: string
    imageUrl?: string
  }
  
  export interface Country {
    name: string
    code: string
    dialCode: string
    flag: string
  }
  
  export interface AuthState {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
  }
  
  export interface OTPState {
    step: 'phone' | 'otp' | 'verified'
    phone: string
    countryCode: string
    otp: string
    isLoading: boolean
    error: string | null
    timeLeft: number
    canResend: boolean
  }