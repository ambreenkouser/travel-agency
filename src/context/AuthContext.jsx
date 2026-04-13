import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, login as apiLogin, logout as apiLogout, updateProfile as apiUpdateProfile, changePassword as apiChangePassword } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const userData = await apiLogin(email, password)
    setUser(userData)
    return userData
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  async function refreshUser() {
    const me = await getMe()
    setUser(me)
  }

  async function updateProfile(data) {
    const updated = await apiUpdateProfile(data)
    setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, updateProfile, changePassword: apiChangePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
