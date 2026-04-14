import { createContext, useContext, useEffect, useState } from 'react'

import { setAuthToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('vc_token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  const login = (nextToken, nextUser) => {
    localStorage.setItem('vc_token', nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setAuthToken(nextToken)
  }

  const logout = () => {
    localStorage.removeItem('vc_token')
    setToken(null)
    setUser(null)
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
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
