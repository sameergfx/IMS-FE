"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi } from "@/lib/api"
import { UserResponse, UserType } from "@/types"
import styles from "./page.module.css"

const TYPE_COLORS: Record<UserType, string> = {
  student: "#3b82f6",
  teacher: "#8b5cf6",
  staff:   "#f59e0b",
  member:  "#10b981",
  admin:   "#ef4444",
}

export default function UsersPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [users,      setUsers]      = useState<UserResponse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState("")
  const [typeFilter, setTypeFilter] = useState<UserType | "">("")

  useEffect(() => {
    usersApi.getAll(Number(id)).then(setUsers).finally(() => setLoading(false))
  }, [id])

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchType   = !typeFilter || u.user_type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.sub}>{users.length} user{users.length !== 1 ? "s" : ""} in this institution</p>
        </div>
        <button
          id="add_user_btn"
          className={styles.addBtn}
          onClick={() => router.push(`/dashboard/institution/${id}/users/create`)}
        >
          + Add User
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.typeSelect}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as UserType | "")}
        >
          <option value="">All Types</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="staff">Staff</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.state}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          {users.length === 0
            ? <><p>No users yet.</p><button className={styles.addBtnEmpty} onClick={() => router.push(`/dashboard/institution/${id}/users/create`)}>+ Add First User</button></>
            : <p>No users match your search.</p>
          }
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar} style={{ background: TYPE_COLORS[u.user_type] }}>
                        {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className={styles.name}>{u.full_name}</span>
                    </div>
                  </td>
                  <td className={styles.email}>{u.email}</td>
                  <td className={styles.phone}>{u.phone || <span className={styles.none}>—</span>}</td>
                  <td>
                    <span className={styles.typeBadge} style={{ background: TYPE_COLORS[u.user_type] + "18", color: TYPE_COLORS[u.user_type] }}>
                      {u.user_type}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.status} ${u.is_active ? styles.active : styles.inactive}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
