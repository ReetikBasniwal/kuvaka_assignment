import { useState, useEffect } from 'react'
import type { AuthState } from '../types'

export function useOTPAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    // Check for existing user session on mount
    const checkAuthState = () => {
      try {
        const storedUser = localStorage.getItem('otpUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          setAuthState({
            user: {
              ...user,
              createdAt: new Date().toISOString()
            },
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    checkAuthState()
  }, [])

  const login = (user: { id: string; phone: string; countryCode: string }) => {
    const userWithTimestamp = {
      ...user,
      createdAt: new Date().toISOString()
    }
    
    localStorage.setItem('otpUser', JSON.stringify(user))
    setAuthState({
      user: userWithTimestamp,
      isLoading: false,
      isAuthenticated: true
    })
  }

  const logout = () => {
    localStorage.removeItem('otpUser')
    sessionStorage.removeItem('otp')
    sessionStorage.removeItem('otpPhone')
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    })
  }

  return {
    ...authState,
    login,
    logout
  }
}