// Shared rules for navigation, direct routes, and action controls.
export type AccessContext = { isSuperadmin: boolean; isAdmin: boolean; hasPermission: (code: string) => boolean }
export function canUse(action: string, access: AccessContext): boolean {
  if (access.isSuperadmin) return true
  if (action === "profile.read") return true
  if (action === "access.manage") return false
  if (action.startsWith("settings.")) return access.isAdmin || access.hasPermission(action)
  if (action.endsWith(".read") && /^(users|students|teachers|staff|members)\./.test(action)) {
    return access.isAdmin || access.hasPermission(action) || access.hasPermission("users.read") ||
      ((action === "users.read" || action === "students.read") && ["students.create", "students.update"].some(access.hasPermission))
  }
  if (action === "users.create") return access.hasPermission("students.create")
  if (action === "users.read") return access.isAdmin || ["students.create", "students.update", "students.read"].some(access.hasPermission)
  if (action === "students.read") return access.isAdmin || ["students.read", "students.create", "students.update"].some(access.hasPermission)
  if (action === "students.update") return access.isAdmin || access.hasPermission(action)
  if (/^(users|students|teachers|staff|members)\./.test(action)) return access.isAdmin
  return access.hasPermission(action)
}
export function routePermission(path: string): string | null {
  const match = path.match(/^\/dashboard\/institution\/[^/]+(?:\/(.*))?$/)
  if (!match) return null
  const route = match[1] || ""
  if (!route) return "dashboard.read"
  if (route === "profile") return "profile.read"
  if (route.startsWith("settings/roles")) return "access.manage"
  if (route.startsWith("settings")) return "settings.read"
  const parts = route.split("/")
  if (parts[0] === "accounts") {
    if (parts[1] === "banking") return "banking.read"
    if (parts[1] === "donations") return "receipts.create"
    if (parts[1] === "daily-statement") return "statements.read"
    const module = parts[1]
    if (!["invoices", "receipts", "expenses", "statements"].includes(module)) return "access.manage"
    return `${module}.${parts[2] === "create" ? "create" : parts[3] === "edit" ? "update" : "read"}`
  }
  if (parts[0] === "users") {
    if (parts[1] === "create") return "users.create"
    const module = ({student:"students",teacher:"teachers",staff:"staff",member:"members"} as Record<string,string>)[parts[1]]
    if (module) return `${module}.read`
    if (parts[2] === "edit") return "students.update"
    return "users.read"
  }
  return "access.manage"
}
