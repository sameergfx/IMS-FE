"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { institutionsApi, usersApi } from "@/lib/api"
import { UserResponse, UserType } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import DeleteUserModal from "@/components/users/DeleteUserModal"
import styles from "../page.module.css"

const TYPE_COLORS: Record<UserType, string> = {
  student: "#3b82f6",
  teacher: "#8b5cf6",
  staff:   "#f59e0b",
  member:  "#10b981",
  admin:   "#ef4444",
}

export default function UsersPage() {
  const { id } = useParams()
  const { type } = useParams() // Get the user type from the URL
  const router = useRouter()
  const [users,    setUsers]    = useState<UserResponse[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState("all")
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null)

  const load = () => {
    institutionsApi.getUsersByType(Number(id), "student")
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
          <h1 className={styles.title}>Students</h1>
          <p className={styles.sub}>{users.length} student(s) in this institution</p>
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
        <input className={styles.search} placeholder="Search by name..."
          value={search} onChange={e => setSearch(e.target.value)} />
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
                <th>Phone</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
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
                  <td>{u.phone || "-"}</td>
                  <td className={styles.email}>{u.email}</td>
                  <td><span className={styles.typeBadge}>{u.user_type}</span></td>
                  <td>
                    <span className={`${styles.status} ${u.is_active ? styles.active : styles.inactive}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/dashboard/institution/${id}/users/${u.id}/view`}
                        className={styles.iconBtn}
                        title="View"
                        aria-label={`View ${u.full_name}`}
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/dashboard/institution/${id}/users/${u.id}/edit`}
                        className={`${styles.iconBtn} ${styles.iconBtnEdit}`}
                        title="Edit"
                        aria-label={`Edit ${u.full_name}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDelete}`}
                        title="Delete"
                        aria-label={`Delete ${u.full_name}`}
                        onClick={() => setDeleteUser(u)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
