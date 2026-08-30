"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { usersApi } from "@/lib/api"
import { UserResponse, UserType } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import DeleteUserModal from "@/components/users/DeleteUserModal"
import styles from "./page.module.css"

const TYPE_COLORS: Record<UserType, string> = {
  student: "#3b82f6",
  teacher: "#8b5cf6",
  staff:   "#f59e0b",
  member:  "#10b981",
  admin:   "#ef4444",
}

export default function UsersPage() {
  const { id } = useParams()
  const router = useRouter()
  const [users,    setUsers]    = useState<UserResponse[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState("all")
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null)

  const load = () => {
    usersApi.getAll(Number(id))
      .then(setUsers)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || u.user_type === filter
    return matchSearch && matchFilter
  })

  const handleDeleteSuccess = () => {
    setDeleteUser(null)
    load()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.sub}>{users.length} users in this institution</p>
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
        <input className={styles.search} placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filters}>
          {["all", "student", "teacher", "staff", "member"].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>No users found.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th colSpan={3}>Actions</th>
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
                      {/* <span className={styles.name}>{u.full_name}</span> */}
                      <PartyBadge userId={u.id} compact />
                    </div>
                  </td>
                  <td>{u.user_type || "-"}</td>
                  <td className={styles.email}>{u.email}</td>
                  <td><span className={styles.typeBadge}>{u.user_type}</span></td>
                  <td>
                    <span className={`${styles.status} ${u.is_active ? styles.active : styles.inactive}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/institution/${id}/users/${u.id}/view`} className={styles.viewBtn}>
                      View
                    </Link>
                  </td>
                  <td>
                    <Link href={`/dashboard/institution/${id}/users/${u.id}/edit`} className={styles.editBtn}>
                      Edit
                    </Link>
                  </td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => setDeleteUser(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteUser && (
        <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onSuccess={handleDeleteSuccess} />
      )}
    </div>
  )
}
