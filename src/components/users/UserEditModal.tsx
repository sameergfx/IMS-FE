"use client"

import { useState } from "react"
import { usersApi } from "@/lib/api"
import { UserResponse } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./UserEditModal.module.css"

interface Props {
  user:     UserResponse
  onClose:  () => void
  onSave:   () => void
}

export default function UserEditModal({ user, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    email:     user.email,
    phone:     user.phone || "",
    is_active: user.is_active,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState("")

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError("")
    if (!form.full_name.trim()) { setError("Name is required"); return }
    if (!form.email.trim()) { setError("Email is required"); return }

    setSaving(true)
    try {
      await usersApi.update(user.id, {
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone || null,
        is_active: form.is_active,
      })
      onSave()
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Edit User</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.partyCard}>
          <PartyBadge userId={user.id} />
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name *</label>
            <input className={styles.input} type="text"
              value={form.full_name} onChange={e => setField("full_name", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input className={styles.input} type="email"
              value={form.email} onChange={e => setField("email", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input className={styles.input} type="tel" placeholder="Optional"
              value={form.phone} onChange={e => setField("phone", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.checkbox}>
              <input type="checkbox"
                checked={form.is_active} onChange={e => setField("is_active", e.target.checked)} />
              <span>Active</span>
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
