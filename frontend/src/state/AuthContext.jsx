import { createContext, useContext, useEffect, useState } from 'react'

import { api, setAuthToken } from '../api'

const AuthContext = createContext(null)

function readStoredUser() {
  const raw = localStorage.getItem('vc_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem('vc_user')
    return null
  }
}

export function AuthProvider({ children }) {
  const initialToken = localStorage.getItem('vc_token')
  const initialUser = initialToken ? readStoredUser() : null
  const [token, setToken] = useState(initialToken)
  const [user, setUser] = useState(initialUser)
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(initialToken) && !Boolean(initialUser))

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('vc_user', JSON.stringify(user))
      return
    }
    localStorage.removeItem('vc_user')
  }, [user])

  useEffect(() => {
    let isCancelled = false
    if (!token) {
      setIsAuthLoading(false)
      return () => {
        isCancelled = true
      }
    }
    if (user) {
      setIsAuthLoading(false)
      return () => {
        isCancelled = true
      }
    }

    setIsAuthLoading(true)
    api
      .get('/auth/me/')
      .then((res) => {
        if (isCancelled) return
        setUser(res.data)
      })
      .catch(() => {
        if (isCancelled) return
        localStorage.removeItem('vc_token')
        setToken(null)
        setUser(null)
        setAuthToken(null)
      })
      .finally(() => {
        if (isCancelled) return
        setIsAuthLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [token, user])

  const login = (nextToken, nextUser) => {
    localStorage.setItem('vc_token', nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setIsAuthLoading(false)
    setAuthToken(nextToken)
  }

  const logout = () => {
    localStorage.removeItem('vc_token')
    localStorage.removeItem('vc_user')
    setToken(null)
    setUser(null)
    setIsAuthLoading(false)
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthLoading,
        setUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
