'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, AuthUser } from './api'

interface AuthState {
  user: AuthUser | null
  token: string | null
  requireLogin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
  setRequireLogin: (value: boolean) => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, token: null, requireLogin: false, loading: true,
  login: async () => {}, loginWithToken: async () => {}, logout: () => {}, setRequireLogin: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null)
  const [token, setToken]             = useState<string | null>(null)
  const [requireLogin, setRequireLoginState] = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    const init = async () => {
      try {
        const accessRes = await api.getToolsAccess()
        setRequireLoginState(Boolean(accessRes.requireLogin))
        if (stored) {
          setToken(stored)
          const { user: me } = await api.me()
          setUser(me)
        }
      } catch {
        setRequireLoginState(false)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    localStorage.setItem('token', res.token)
    setToken(res.token)
    setUser(res.user)
  }

  const loginWithToken = async (t: string) => {
    localStorage.setItem('token', t)
    setToken(t)
    const { user: me } = await api.me()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const setRequireLogin = async (value: boolean) => {
    await api.setToolsAccess(value)
    setRequireLoginState(value)
  }

  return (
    <AuthContext.Provider value={{ user, token, requireLogin, loading, login, loginWithToken, logout, setRequireLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
