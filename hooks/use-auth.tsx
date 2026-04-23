'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface User {
  id: string
  email: string
  name: string
  role: 'operator' | 'supervisor' | 'admin'
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AUTH_STORAGE_KEY = 'auth_token'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(AUTH_STORAGE_KEY)
      if (savedToken) {
        const decoded = jwtDecode(savedToken) as any
        if (decoded?.sub) {
          setToken(savedToken)
          setUser({
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role || 'operator',
          })
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Email ou senha incorretos')
    }

    const data = await response.json()
    const decoded = jwtDecode(data.token) as any

    setToken(data.token)
    setUser({
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'operator',
    })
    localStorage.setItem(AUTH_STORAGE_KEY, data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user && !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
