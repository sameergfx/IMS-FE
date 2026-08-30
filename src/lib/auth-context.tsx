"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi, tokenStorage } from "@/lib/api"
import { UserResponse } from "@/types"
import { Institution } from "@/types/institution"

interface AuthContextType {
  user:                UserResponse | null
  loading:             boolean
  selectedInstitution: Institution | null
  selectInstitution:   (inst: Institution) => void
  clearInstitution:    () => void
  login:               (email: string, password: string) => Promise<void>
  logout:              () => void
  refreshUser:         () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,                setUser]                = useState<UserResponse | null>(null)
  const [loading,             setLoading]             = useState(true)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = tokenStorage.getAccess()
    if (!token) { setLoading(false); return }

    // Restore selected institution from session
    const saved = sessionStorage.getItem("institution")
    if (saved) setSelectedInstitution(JSON.parse(saved))

    authApi.me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    tokenStorage.set(data.access_token, data.refresh_token)
    const me = await authApi.me()
    setUser(me)
    router.push("/dashboard")          // go to institution selector
  }

  const logout = () => {
    authApi.logout()
    sessionStorage.removeItem("institution")
    setUser(null)
    setSelectedInstitution(null)
    router.push("/login")
  }

  const selectInstitution = (inst: Institution) => {
    setSelectedInstitution(inst)
    sessionStorage.setItem("institution", JSON.stringify(inst))
    router.push(`/dashboard/institution/${inst.id}`)
  }

  const clearInstitution = () => {
    setSelectedInstitution(null)
    sessionStorage.removeItem("institution")
    router.push("/dashboard")
  }

  const refreshUser = async () => {
    const me = await authApi.me()
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      selectedInstitution, selectInstitution, clearInstitution,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
