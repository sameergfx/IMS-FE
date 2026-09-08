import { TokenResponse, UserResponse } from "@/types"
import { Receipt, Account, Invoice, InvoiceCategory, Expense, ExpenseCategory } from "@/types/accounting"
import { Institution } from "@/types/institution"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const tokenStorage = {
  getAccess:  () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  set: (access: string, refresh: string) => {
    localStorage.setItem("access_token",  access)
    localStorage.setItem("refresh_token", refresh)
  },
  clear: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
  },
}

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = tokenStorage.getAccess()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return apiFetch<T>(path, options, false)
    tokenStorage.clear()
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

async function refreshAccessToken(): Promise<boolean> {
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
    localStorage.setItem("access_token", data.access_token)
    return true
  } catch { return false }
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me:     () => apiFetch<UserResponse>("/auth/me"),
  logout: () => { tokenStorage.clear() },
}

// ── Institutions API ──────────────────────────────────────────────────────────

export const institutionsApi = {
  getAll:   ()             => apiFetch<Institution[]>("/institutions/"),
  getOne:   (id: number)   => apiFetch<Institution>(`/institutions/${id}`),
  getUsers: (id: number)   => apiFetch<UserResponse[]>(`/institutions/${id}/users`),
  getUsersByType: (id: number, userType: string) => apiFetch<UserResponse[]>(`/institutions/${id}/users/${userType}`),
  create:   (data: any)    => apiFetch<Institution>("/institutions/", { method: "POST", body: JSON.stringify(data) }),
  update:   (id: number, data: any) => apiFetch<Institution>(`/institutions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll:  (institutionId?: number) =>
    apiFetch<UserResponse[]>(`/users/${institutionId ? `?institution_id=${institutionId}` : ""}`),
  getUser: (id: number) => apiFetch<UserResponse>(`/users/${id}`),
  create:  (data: any)  => apiFetch<UserResponse>("/users/", { method: "POST", body: JSON.stringify(data) }),
  update:  (id: number, data: any) => apiFetch<UserResponse>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete:  (id: number) => apiFetch<any>(`/users/${id}`, { method: "DELETE" }),
}

// ── User Meta API ─────────────────────────────────────────────────────────────

export const userMetaApi = {
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
  // Accounts
  getInvoiceCategories: () => apiFetch<InvoiceCategory[]>("/accounting/invoice-categories"),
  createInvoiceCategory: (data: { name: string; created_by: number }) =>
    apiFetch<Account>("/accounting/invoice-categories", { method: "POST", body: JSON.stringify(data) }),

  getExpenseCategories: () => apiFetch<ExpenseCategory[]>("/accounting/expense-categories"),
  createExpenseCategory: (data: { name: string; code: string; account_type: string; description?: string | null }) =>
    apiFetch<Account>("/accounting/expense-categories", { method: "POST", body: JSON.stringify(data) }),

  // Invoices
  getInvoices:        ()           => apiFetch<Invoice[]>("/accounting/invoices"),
  getInvoicesByInstitution: (institutionId: number) => apiFetch<Invoice[]>(`/accounting/invoices/institution/${institutionId}`),
  getInvoice:         (id: number) => apiFetch<Invoice>(`/accounting/invoices/${id}`),
  getUserInvoices:    (userId: number) => apiFetch<Invoice[]>(`/accounting/invoices/user/${userId}`),
  getInvoicesByStatus:(status: string) => apiFetch<Invoice[]>(`/accounting/invoices/status/${status}`),
  createInvoice:      (data: any)  => apiFetch<Invoice>("/accounting/invoices", { method: "POST", body: JSON.stringify(data) }),
  cancelInvoice:      (id: number, reason: string) =>
    apiFetch<Invoice>(`/accounting/invoices/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Receipts (payments against invoices)
  getReceipts:        ()           => apiFetch<Receipt[]>("/accounting/receipts"),
  getReceiptsByInstitution: (institutionId: number) => apiFetch<Receipt[]>(`/accounting/receipts/institution/${institutionId}`),
  getReceipt:         (id: number) => apiFetch<Receipt>(`/accounting/receipts/${id}`),
  getInvoiceReceipts: (invoiceId: number) => apiFetch<Receipt[]>(`/accounting/receipts/invoice/${invoiceId}`),
  getUserReceipts:    (userId: number)    => apiFetch<Receipt[]>(`/accounting/receipts/user/${userId}`),
  createReceipt:      (data: any)  => apiFetch<Receipt>("/accounting/receipts", { method: "POST", body: JSON.stringify(data) }),
  cancelReceipt:      (id: number, reason: string) =>
    apiFetch<Receipt>(`/accounting/receipts/${id}/cancel`, { method: "POST", body: JSON.stringify({ cancellation_reason: reason }) }),
  
  // Expenses
  getExpenses:              ()           => apiFetch<Expense[]>("/accounting/expenses"),
  getExpensesByInstitution: (institutionId: number) => apiFetch<Expense[]>(`/accounting/expenses/institution/${institutionId}`),
  getExpense:               (id: number) => apiFetch<Expense>(`/accounting/expenses/${id}`),
  createExpense:            (data: any)  => apiFetch<Expense>("/accounting/expenses", { method: "POST", body: JSON.stringify(data) }),
  cancelExpense:            (id: number, reason: string) =>
    apiFetch<Expense>(`/accounting/expenses/${id}/cancel`, { method: "POST", body: JSON.stringify({ cancellation_reason: reason }) }),
}
