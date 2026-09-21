import { InstitutionDashboardData } from "@/types/dashboard"
import { TokenResponse, UserResponse, UserType, InstitutionAccess, Permission, Role } from "@/types"
import { Receipt, Account, Invoice, InvoiceUpdate, InvoiceCategory, Expense, ExpenseCategory, ExpenseRecord, ExpenseCreate, AccountStatement } from "@/types/accounting"
import { Institution } from "@/types/institution"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const tokenStorage = {
  getSession: () => localStorage.getItem("auth_session_version"),
  getAccess:  () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  set: (access: string, refresh: string) => {
    localStorage.setItem("auth_session_version", crypto.randomUUID())
    localStorage.setItem("access_token",  access)
    localStorage.setItem("refresh_token", refresh)
  },
  clear: () => {
    localStorage.setItem("auth_session_version", crypto.randomUUID())
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
  },
}

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const session = tokenStorage.getSession()
  const token = tokenStorage.getAccess()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (session !== tokenStorage.getSession()) throw new Error("Session changed")

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken()
    if (session !== tokenStorage.getSession()) throw new Error("Session changed")
    if (refreshed) return apiFetch<T>(path, options, false)
    tokenStorage.clear()
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: string }) => item.msg || "Invalid value").join("; ")
        : `Request failed (${res.status})`
    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

async function refreshAccessToken(): Promise<boolean> {
  const session = tokenStorage.getSession()
  const refresh = tokenStorage.getRefresh()
  if (!refresh) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (session !== tokenStorage.getSession() || refresh !== tokenStorage.getRefresh()) return false
    localStorage.setItem("access_token", data.access_token)
    return true
  } catch { return false }
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me:     () => apiFetch<UserResponse>("/auth/me"),
  logout: async () => {
    const refresh = tokenStorage.getRefresh()
    tokenStorage.clear()
    if (!refresh) return
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }), keepalive: true,
    })
    if (!response.ok) throw new Error("Server logout failed")
  },
}

// ── Institutions API ──────────────────────────────────────────────────────────

export const institutionsApi = {
  uploadLogo: (id: number, file: File) => apiFetch<{ url: string }>(`/institutions/${id}/logo`, {
    method: "POST", body: file, headers: { "Content-Type": file.type },
  }),
  getDashboard: (institutionId: number, asOf: string) =>
    apiFetch<InstitutionDashboardData>(`/dashboard/institution/${institutionId}?as_of=${encodeURIComponent(asOf)}`),
  getAll:   ()             => apiFetch<Institution[]>("/institutions/"),
  getOne:   (id: number)   => apiFetch<Institution>(`/institutions/${id}`),
  getUsers: (id: number)   => apiFetch<UserResponse[]>(`/institutions/${id}/users`),
  getUsersByType: (id: number, userType: string) => apiFetch<UserResponse[]>(`/institutions/${id}/users/${userType}`),
  create:   (data: any)    => apiFetch<Institution>("/institutions/", { method: "POST", body: JSON.stringify(data) }),
  update:   (id: number, data: any) => apiFetch<Institution>(`/institutions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ── Users API ─────────────────────────────────────────────────────────────────
export const usersApi = {
  uploadMyPhoto: (file: File) => apiFetch<{ url: string }>("/users/me/photo-upload", { method: "POST", body: file, headers: { "Content-Type": file.type } }),
  saveMyPhoto: (profile_photo: string | null) => apiFetch<{ profile_photo: string | null }>("/users/me/photo", { method: "PATCH", body: JSON.stringify({ profile_photo }) }),
  uploadPhoto: (file: File) => apiFetch<{ url: string }>("/users/photos", { method: "POST", body: file, headers: { "Content-Type": file.type } }),
  getAll:  (institutionId?: number) =>
    apiFetch<UserResponse[]>(`/users/${institutionId ? `?institution_id=${institutionId}` : ""}`),
  getUser: (id: number) => apiFetch<UserResponse>(`/users/${id}`),
  create:  (data: any)  => apiFetch<UserResponse>("/users/", { method: "POST", body: JSON.stringify(data) }),
  update:  (id: number, data: any) => apiFetch<UserResponse>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete:  (id: number) => apiFetch<any>(`/users/${id}`, { method: "DELETE" }),

  // Institution access (multi-institution support)
  getInstitutionAccess: (userId: number) =>
    apiFetch<InstitutionAccess[]>(`/users/${userId}/institution-access`),
  grantInstitutionAccess: (userId: number, data: { institution_id: number; role: UserType }) =>
    apiFetch<InstitutionAccess>(`/users/${userId}/institution-access`, { method: "POST", body: JSON.stringify(data) }),
  revokeInstitutionAccess: (userId: number, institutionId: number) =>
    apiFetch<void>(`/users/${userId}/institution-access/${institutionId}`, { method: "DELETE" }),
}

export const accessApi = {
  getTemporaryAccess: (userId: number, institutionId: number) => apiFetch<any[]>(`/users/${userId}/institutions/${institutionId}/temporary-access`),
  grantTemporaryAccess: (userId: number, institutionId: number, data: { permission_code: string; expires_at: string; reason: string }) => apiFetch<any>(`/users/${userId}/institutions/${institutionId}/temporary-access`, { method: "POST", body: JSON.stringify(data) }),
  revokeTemporaryAccess: (grantId: number) => apiFetch<any>(`/temporary-access/${grantId}/revoke`, { method: "POST" }),
  getTemporaryAccessEvents: (grantId: number) => apiFetch<any[]>(`/temporary-access/${grantId}/events`),
    getPermissions:  () => apiFetch<Permission[]>("/permissions"),
  createPermission: (data: { code: string; description?: string | null }) =>
    apiFetch<Permission>("/permissions", { method: "POST", body: JSON.stringify(data) }),

  getRoles:  () => apiFetch<Role[]>("/roles/all"),
  createRole: (data: { name: string; description?: string | null }) =>
    apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(data) }),

  addPermissionToRole: (roleId: number, permissionId: number) =>
    apiFetch<Role>(`/roles/${roleId}/permissions/${permissionId}`, { method: "POST" }),
  removePermissionFromRole: (roleId: number, permissionId: number) =>
    apiFetch<Role>(`/roles/${roleId}/permissions/${permissionId}`, { method: "DELETE" }),

  getMyPermissions: (institutionId: number) =>
    apiFetch<{ is_superadmin: boolean; permissions: string[]; permanent_permissions?: string[]; temporary_access?: { permission_code: string; expires_at: string }[] }>(`/auth/me/permissions/${institutionId}`),

  getUserInstitutions: (userId: number) =>
    apiFetch<{ institution_id: number; institution_name: string; role_id: number; role_name: string }[]>(
      `/users/${userId}/institutions`
    ),
  assignRole: (userId: number, institutionId: number, roleId: number) =>
    apiFetch<{ detail: string }>(`/users/${userId}/institutions/${institutionId}/roles/${roleId}`, { method: "POST" }),
  revokeRole: (userId: number, institutionId: number, roleId: number) =>
    apiFetch<{ detail: string }>(`/users/${userId}/institutions/${institutionId}/roles/${roleId}`, { method: "DELETE" }),

  updatePermission: (
    permissionId: number,
    data: {
      code?: string
      description?: string | null
    }
  ) =>
    apiFetch<Permission>(`/permissions/${permissionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePermission: (permissionId: number) =>
    apiFetch<void>(`/permissions/${permissionId}`, {
      method: "DELETE",
    }),

  updateRole: (
    roleId: number,
    data: {
      name?: string
      description?: string | null
    }
  ) =>
    apiFetch<Role>(`/roles/${roleId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteRole: (roleId: number) =>
    apiFetch<void>(`/roles/${roleId}`, {
      method: "DELETE",
    }),
}

// ── User Meta API ─────────────────────────────────────────────────────────────

export const userMetaApi = {
  getAdminMeta: (id: number) => apiFetch<any>(`/users/${id}/meta/admin`).catch(() => null),
  updateAdminMeta: (id: number, data: any) => apiFetch<any>(`/users/${id}/meta/admin`, { method: "PATCH", body: JSON.stringify(data) }),
  getStudentMeta: (userId: number) => apiFetch<any>(`/users/${userId}/meta/student`).catch(() => null),
  updateStudentMeta: (userId: number, data: any) => apiFetch<any>(`/users/${userId}/meta/student`, { method: "PATCH", body: JSON.stringify(data) }),

  getTeacherMeta: (userId: number) => apiFetch<any>(`/users/${userId}/meta/teacher`).catch(() => null),
  updateTeacherMeta: (userId: number, data: any) => apiFetch<any>(`/users/${userId}/meta/teacher`, { method: "PATCH", body: JSON.stringify(data) }),

  getStaffMeta: (userId: number) => apiFetch<any>(`/users/${userId}/meta/staff`).catch(() => null),
  updateStaffMeta: (userId: number, data: any) => apiFetch<any>(`/users/${userId}/meta/staff`, { method: "PATCH", body: JSON.stringify(data) }),

  getMemberMeta: (userId: number) => apiFetch<any>(`/users/${userId}/meta/member`).catch(() => null),
  updateMemberMeta: (userId: number, data: any) => apiFetch<any>(`/users/${userId}/meta/member`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ── Accounting API ────────────────────────────────────────────────────────────

export const accountingApi = {
  getDailyStatement: (institutionId: number, day: string) =>
    apiFetch<import("@/types/accounting").DailyStatement>(`/accounting/statements/institution/${institutionId}/daily?${new URLSearchParams({ day })}`),
  getStatement: (institutionId: number, startDate: string, endDate: string) =>
    apiFetch<AccountStatement>(`/accounting/statements/institution/${institutionId}?${new URLSearchParams({ start_date: startDate, end_date: endDate })}`),
  getAccounts: () => apiFetch<Account[]>("/accounting/accounts"),
  // Accounts
  getInvoiceCategories: () => apiFetch<InvoiceCategory[]>("/accounting/invoice-categories"),
  createInvoiceCategory: (data: { name: string; created_by: number }) =>
    apiFetch<Account>("/accounting/invoice-categories", { method: "POST", body: JSON.stringify(data) }),

  getExpenseCategories: () => apiFetch<ExpenseCategory[]>("/accounting/expense-categories"),
  createExpenseCategory: (data: { name: string; code: string; is_active?: boolean }) =>
    apiFetch<ExpenseCategory>("/accounting/expense-categories", { method: "POST", body: JSON.stringify(data) }),

  // Invoices
  // getInvoices:        ()           => apiFetch<Invoice[]>("/accounting/invoices"),
  getInvoices: (institutionId: number) => apiFetch<Invoice[]>(`/accounting/invoices?institution_id=${institutionId}`),
  getInvoicesByInstitution: (institutionId: number) => apiFetch<Invoice[]>(`/accounting/invoices/institution/${institutionId}`),
  updateInvoice: (id: number, data: InvoiceUpdate) => apiFetch<Invoice>(`/accounting/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  receiveDonation: (data: unknown) => apiFetch<Receipt>("/accounting/donations", { method: "POST", body: JSON.stringify(data) }),
  getInvoiceItemBalances: (id: number) => apiFetch<{ legacy_estimate: boolean; items: { invoice_item_id: number; category: string; description: string; outstanding: number | string }[] }>(`/accounting/invoices/${id}/item-balances`),
  getInvoice:         (id: number) => apiFetch<Invoice>(`/accounting/invoices/${id}`),
  // getUserInvoices:    (userId: number) => apiFetch<Invoice[]>(`/accounting/invoices/user/${userId}`),
  getUserInvoices: (userId: number, institutionId: number) => apiFetch<Invoice[]>(`/accounting/invoices/user/${userId}?institution_id=${institutionId}`),
  // getInvoicesByStatus:(status: string) => apiFetch<Invoice[]>(`/accounting/invoices/status/${status}`),
  getInvoicesByStatus: (status: string, institutionId: number) => apiFetch<Invoice[]>(`/accounting/invoices/status/${encodeURIComponent(status)}?institution_id=${institutionId}`),
  createInvoice:      (data: any)  => apiFetch<Invoice>("/accounting/invoices", { method: "POST", body: JSON.stringify(data) }),
  cancelInvoice:      (id: number, reason: string) =>
    apiFetch<Invoice>(`/accounting/invoices/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Receipts (payments against invoices)
  getReceipts:        ()           => apiFetch<Receipt[]>("/accounting/receipts"),
  getReceiptsByInstitution: (institutionId: number, skip = 0, limit = 100) => apiFetch<Receipt[]>(`/accounting/receipts/institution/${institutionId}?skip=${skip}&limit=${limit}`),
  getReceipt:         (id: number) => apiFetch<Receipt>(`/accounting/receipts/${id}`),
  getInvoiceReceipts: (invoiceId: number) => apiFetch<Receipt[]>(`/accounting/receipts/invoice/${invoiceId}`),
  getUserReceipts:    (userId: number)    => apiFetch<Receipt[]>(`/accounting/receipts/user/${userId}`),
  createReceipt:      (data: any)  => apiFetch<Receipt>("/accounting/receipts", { method: "POST", body: JSON.stringify(data) }),
  cancelReceipt:      (id: number, reason: string) =>
    apiFetch<Receipt>(`/accounting/receipts/${id}/cancel`, { method: "POST", body: JSON.stringify({ cancellation_reason: reason }) }),
  
  // Expenses
  getExpenses:              ()           => apiFetch<Expense[]>("/accounting/expenses"),
  getExpensesByInstitution: (institutionId: number) => apiFetch<ExpenseRecord[]>(`/accounting/expenses/institution/${institutionId}`),
  getExpense:               (id: number) => apiFetch<Expense>(`/accounting/expenses/${id}`),
  updateExpense: (id: number, data: ExpenseCreate) => apiFetch<Expense>(`/accounting/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createExpense:            (data: ExpenseCreate)  => apiFetch<Expense>("/accounting/expenses", { method: "POST", body: JSON.stringify(data) }),
  cancelExpense:            (id: number, reason: string) =>
    apiFetch<Expense>(`/accounting/expenses/${id}/cancel`, { method: "POST", body: JSON.stringify({ cancellation_reason: reason }) }),
}
export const bankingApi = {
  options: (id: number) => apiFetch<MoneyAccount[]>(`/banking/institution/${id}/account-options`),
  accounts: (id: number) => apiFetch<MoneyAccount[]>(`/banking/institution/${id}/accounts`),
  create: (id: number, data: unknown) => apiFetch<MoneyAccount>(`/banking/institution/${id}/accounts`, { method: 'POST', body: JSON.stringify(data) }),
  transfers: (id: number) => apiFetch<BankTransfer[]>(`/banking/institution/${id}/transfers`),
  transfer: (id: number, data: unknown) => apiFetch<BankTransfer>(`/banking/institution/${id}/transfers`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: number, transferId: number, reason: string) => apiFetch(`/banking/institution/${id}/transfers/${transferId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  statement: (id: number, account: number, start: string, end: string) => apiFetch<BankStatement>(`/banking/institution/${id}/accounts/${account}/statement?${new URLSearchParams({start, end})}`),
}
export interface MoneyAccount { id: number; name: string; kind: 'cash' | 'bank'; bank_name?: string; account_last_four?: string; opening_date: string; opening_balance?: number | string }
export interface BankTransfer { id: number; source_id: number; destination_id: number; transfer_date: string; amount: number | string; status: string; reference?: string; cancellation_reason?: string }
export interface BankStatement { account_id: number; account_name: string; start_date: string; end_date: string; opening_balance: number | string; closing_balance: number | string; money_in: number | string; money_out: number | string; entries: {id: number; institution_id?: number; kind: string; date: string; reference: string; money_in: number | string; money_out: number | string; balance: number | string}[] }

export interface OrganisationSettings { configured: boolean; name: string; banking_mode: 'independent' | 'shared' | null; banking_locked: boolean; can_manage: boolean }
export const organisationApi = {
  get: () => apiFetch<OrganisationSettings>('/organisation'),
  save: (data: { name: string; banking_mode: string }) => apiFetch<OrganisationSettings>('/organisation', { method: 'PUT', body: JSON.stringify(data) }),
  linkBank: (account: number, institution: number) => apiFetch(`/organisation/bank-accounts/${account}/institutions/${institution}`, {method: "POST"}),
  banks: () => apiFetch<MoneyAccount[]>('/organisation/bank-accounts'),
  createBank: (data: unknown) => apiFetch<MoneyAccount>('/organisation/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
  statement: (id: number, start: string, end: string) => apiFetch<BankStatement>(`/organisation/bank-accounts/${id}/statement?${new URLSearchParams({start,end})}`),
}
