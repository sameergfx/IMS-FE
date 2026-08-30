import { tokenStorage } from "./api"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getAccess()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

export const metaApi = {
  createStudent: (userId: number, data: any) =>
    apiFetch(`/users/${userId}/meta/student`, { method: "POST", body: JSON.stringify(data) }),
  createTeacher: (userId: number, data: any) =>
    apiFetch(`/users/${userId}/meta/teacher`, { method: "POST", body: JSON.stringify(data) }),
  createStaff: (userId: number, data: any) =>
    apiFetch(`/users/${userId}/meta/staff`, { method: "POST", body: JSON.stringify(data) }),
  createMember: (userId: number, data: any) =>
    apiFetch(`/users/${userId}/meta/member`, { method: "POST", body: JSON.stringify(data) }),
  createAdmin: (userId: number, data: any) =>
    apiFetch(`/users/${userId}/meta/admin`, { method: "POST", body: JSON.stringify(data) }),
}
