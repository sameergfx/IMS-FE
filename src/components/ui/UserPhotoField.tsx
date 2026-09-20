"use client"

import { useId, useRef, useState } from "react"
import { usersApi } from "@/lib/api"
import styles from "./UserPhotoField.module.css"

export default function UserPhotoField({ value, onChange, onBusyChange, disabled = false, uploadPhoto = usersApi.uploadPhoto }: {
  value?: string | null
  onChange: (url: string | null) => void
  onBusyChange: (busy: boolean) => void
  uploadPhoto?: (file: File) => Promise<{ url: string }>
  disabled?: boolean
}) {
  const id = useId()
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const upload = async (file?: File) => {
    if (!file || pending.current) return
    setError("")
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG, JPEG or WebP photo up to 2 MB."); return
    }
    pending.current = true
    setBusy(true); onBusyChange(true)
    try {
      const result = await uploadPhoto(file)
      onChange(result.url)
    } catch (err) { setError(err instanceof Error ? err.message : "Photo upload failed") }
    finally { pending.current = false; setBusy(false); onBusyChange(false) }
  }
  return <div className={styles.field}>
    <div className={styles.preview}>{value ? <img src={value} alt="User photo preview" /> : <span>No photo</span>}</div>
    <div className={styles.controls}>
      <label htmlFor={id}>User photo</label>
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file) }} />
      <small>PNG, JPEG or WebP · Maximum 2 MB. Save the form to apply changes.</small>
      {busy && <span role="status">Uploading photo…</span>}
      {value && <button type="button" disabled={disabled || busy} onClick={() => { onChange(null); setError("") }}>Remove photo</button>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  </div>
}
