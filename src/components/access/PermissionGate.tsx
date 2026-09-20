"use client"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/lib/permissions-context"
import { canUse, routePermission } from "@/lib/ui-permissions"

export function useUiAccess() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const can = (action: string) => !permissions.loading && canUse(action, { isAdmin: user?.user_type === "admin", isSuperadmin: permissions.isSuperadmin, hasPermission: permissions.hasPermission })
  return { can, loading: permissions.loading, error: permissions.error }
}
export default function PermissionGate({ action, children }: { action: string; children: ReactNode }) {
  const { can } = useUiAccess()
  return can(action) ? <>{children}</> : null
}
export function InstitutionPageGuard({ children }: { children: ReactNode }) {
  const path = usePathname()
  const { selectedInstitution } = useAuth()
  const { can, loading, error } = useUiAccess()
  if (loading || String(selectedInstitution?.id) !== path.split("/")[3]) return <p role="status">Loading permissions…</p>
  if (error) return <div role="alert"><h1>Institution access unavailable</h1><p>{error}</p><p>Ask an administrator to check your role assignment for this institution.</p></div>
  const action = routePermission(path)
  if (action && !can(action)) return <div role="alert"><h1>Access unavailable</h1><p>You do not have permission to open this page, or your temporary access has expired.</p><Link href={`${path.split("/").slice(0,4).join("/")}/profile`}>Go to My Profile</Link></div>
  return <>{children}</>
}
