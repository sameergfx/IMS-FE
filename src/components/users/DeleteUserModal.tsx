"use client"

import { useState } from "react"
import { usersApi } from "@/lib/api"
import { UserResponse } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./DeleteUserModal.module.css"

interface Props {
  user:      UserResponse
  onClose:   () => void
  onSuccess: () => void
}

export default function DeleteUserModal({ user, onClose, onSuccess }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState("")
  const [confirm,  setConfirm]  = useState("")

  const handleDelete = async () => {
    if (confirm !== "DELETE") {
      setError('Type "DELETE" to confirm')
      return
    }

    setDeleting(true)
    setError("")
    try {
      await usersApi.delete(user.id)
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Failed to delete user")
      setDeleting(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Delete User</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <p className={styles.warning}>⚠ This action cannot be undone.</p>
          
          <div className={styles.partyCard}>
            <PartyBadge userId={user.id} />
          </div>

          <p className={styles.message}>
            You are about to permanently delete this user and all their data.
          </p>

          <div className={styles.confirmField}>
            <label className={styles.label}>Type "DELETE" to confirm *</label>
            <input className={styles.input} type="text" placeholder="DELETE"
              value={confirm} onChange={e => setConfirm(e.target.value.toUpperCase())} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={deleting}>Cancel</button>
            <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting || confirm !== "DELETE"}>
              {deleting ? "Deleting..." : "Delete User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
