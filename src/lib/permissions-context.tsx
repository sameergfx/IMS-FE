"use client"

/**
 * Wraps AuthProvider. Whenever `selectedInstitution` changes, fetches the
 * flattened permission codes the current user holds AT THAT institution,
 * and exposes them via useHasPermission(). Superadmins short-circuit to
 * "can do everything" without needing every code listed.
 *
 * Mount order in your root layout:
 *   <AuthProvider>
 *     <PermissionsProvider>
 *       {children}
 *     </PermissionsProvider>
 *   </AuthProvider>
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { accessApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface PermissionsContextType {
  error: string
  temporaryAccess: { permission_code: string; expires_at: string }[]
  permissions:    Set<string>
  isSuperadmin:   boolean
  loading:        boolean
  hasPermission:  (code: string) => boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { selectedInstitution, user } = useAuth()
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now())
  const [permanentPermissions, setPermanentPermissions] = useState<Set<string>>(new Set())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const [resolvedFor, setResolvedFor] = useState("")
  const scope = `${selectedInstitution?.id || ""}:${user?.id || ""}`
  const [temporaryAccess, setTemporaryAccess] = useState<{ permission_code: string; expires_at: string }[]>([])
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    if (!selectedInstitution) {
      setTemporaryAccess([])
      setPermanentPermissions(new Set())
      setIsSuperadmin(false)
      return
    }

    setLoading(true)
    let active = true
    const reload = () => accessApi.getMyPermissions(selectedInstitution.id)
      .then(res => {
        if (!active) return
        setError("")
        setResolvedFor(scope)
        setIsSuperadmin(res.is_superadmin)
        setPermanentPermissions(new Set(res.permanent_permissions || res.permissions))
        setTemporaryAccess(res.temporary_access || [])
      })
      .catch(err => {
        if (!active) return
        setResolvedFor(scope)
        setError(err instanceof Error ? err.message : "Could not load institution permissions")
        // Fail closed — no permissions fetched means no permissions granted.
        setPermanentPermissions(new Set())
        setTemporaryAccess([])
        setIsSuperadmin(false)
      })
      .finally(() => { if (active) setLoading(false) })
    void reload()
    const timer = window.setInterval(reload, 15000)
    window.addEventListener("focus", reload)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", reload) }
  }, [selectedInstitution?.id, user?.id])

  const ready = resolvedFor === scope && Boolean(selectedInstitution && user)
  const activeTemporary = temporaryAccess.filter(grant => new Date(grant.expires_at).getTime() > now)
  const effectivePermissions = new Set([...permanentPermissions, ...activeTemporary.map(grant => grant.permission_code)])
  const hasPermission = (code: string) => ready && (isSuperadmin || effectivePermissions.has(code))

  return (
    <PermissionsContext.Provider value={{ error: ready ? error : "", temporaryAccess: ready ? activeTemporary : [], permissions: ready ? effectivePermissions : new Set(), isSuperadmin: ready && isSuperadmin, loading: loading || !ready, hasPermission }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error("usePermissions must be used within a PermissionsProvider")
  return ctx
}