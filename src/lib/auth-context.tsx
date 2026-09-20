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
  updateSelectedInstitution: (inst: Institution) => void
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

    const session = tokenStorage.getSession()
    authApi.me()
      .then(value => { if (session === tokenStorage.getSession()) setUser(value) })
      .catch(() => { if (session === tokenStorage.getSession()) tokenStorage.clear() })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key !== "auth_session_version" && event.key !== null) return
      sessionStorage.removeItem("institution")
      setUser(null)
      setSelectedInstitution(null)
      window.location.replace(tokenStorage.getAccess() ? "/dashboard" : "/login")
    }
    window.addEventListener("storage", syncSession)
    return () => window.removeEventListener("storage", syncSession)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    tokenStorage.set(data.access_token, data.refresh_token)
    const session = tokenStorage.getSession()
    const me = await authApi.me()
    if (session !== tokenStorage.getSession()) return
    setUser(me)
    router.push("/dashboard")          // go to institution selector
  }

  const logout = () => {
    void authApi.logout().catch(() => {
      window.alert("You have signed out of this browser, but server logout could not be confirmed. Your server session may remain active until it expires.")
    })
    sessionStorage.removeItem("institution")
    setUser(null)
    setSelectedInstitution(null)
    router.replace("/login")
  }

  const updateSelectedInstitution = (inst: Institution) => {
    setSelectedInstitution(inst)
    sessionStorage.setItem("institution", JSON.stringify(inst))
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
    const session = tokenStorage.getSession()
    const me = await authApi.me()
    if (session !== tokenStorage.getSession()) return
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      selectedInstitution, selectInstitution, updateSelectedInstitution, clearInstitution,
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
