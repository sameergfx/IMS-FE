"use client"
import { useEffect, useState } from "react"
import { accessApi } from "@/lib/api"
import { usePermissions } from "@/lib/permissions-context"
import styles from "./TemporaryAccessPanel.module.css"

const localDate = (value: string) => new Date(value.endsWith("Z") ? value : `${value}Z`)
export default function TemporaryAccessPanel({ userId, institutionId }: { userId: number; institutionId: number }) {
  const { isSuperadmin } = usePermissions()
  const [grants, setGrants] = useState<any[]>([])
  const [action, setAction] = useState("students.create")
  const [duration, setDuration] = useState("1")
  const [custom, setCustom] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [events, setEvents] = useState<any[] | null>(null)
  const [now, setNow] = useState(Date.now())
  const load = () => accessApi.getTemporaryAccess(userId, institutionId).then(setGrants)
  useEffect(() => {
    if (!isSuperadmin) return
    load().catch(err => setError(err.message))
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [userId, institutionId, isSuperadmin])
  if (!isSuperadmin) return null
  const grant = async () => {
    setError("")
    let expiry = new Date(Date.now() + Number(duration) * 3600000)
    if (duration === "today") { expiry = new Date(); expiry.setHours(23, 59, 59, 999) }
    if (duration === "custom") expiry = new Date(custom)
    if (!reason.trim() || !Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) { setError("Enter a reason and choose a future expiry."); return }
    setBusy(true)
    try {
      await accessApi.grantTemporaryAccess(userId, institutionId, { permission_code: action, expires_at: expiry.toISOString(), reason })
      setReason(""); await load()
    } catch (err) { setError(err instanceof Error ? err.message : "Could not grant access") }
    finally { setBusy(false) }
  }
  const revoke = async (id: number) => {
    setBusy(true); setError("")
    try { await accessApi.revokeTemporaryAccess(id); await load() }
    catch (err) { setError(err instanceof Error ? err.message : "Could not revoke access") }
    finally { setBusy(false) }
  }
  return <section className={styles.card}>
    <h2>Temporary Student Access</h2>
    <p>Applies to the institution currently selected. Existing institution membership is required. Expiry removes only this grant.</p>
    <div className={styles.fields}>
      <label>Action<select value={action} onChange={e => setAction(e.target.value)}><option value="students.create">Add students</option><option value="students.update">Edit students</option></select></label>
      <label>Duration<select value={duration} onChange={e => setDuration(e.target.value)}><option value="1">1 hour</option><option value="4">4 hours</option><option value="today">Until end of today</option><option value="custom">Custom end time</option></select></label>
      {duration === "custom" && <label>Expires (your local time)<input type="datetime-local" value={custom} onChange={e => setCustom(e.target.value)} /></label>}
      <label>Reason<input value={reason} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="Admission registration assistance" /></label>
    </div>
    <button type="button" disabled={busy} onClick={grant}>Grant Temporary Access</button>
    {error && <p role="alert">{error}</p>}
    <ul>{grants.map(item => {
      const active = !item.revoked_at && localDate(item.expires_at).getTime() > now
      return <li key={item.id}><strong>{item.permission_code === "students.create" ? "Add students" : "Edit students"}</strong> · {item.revoked_at ? "Revoked" : active ? "Active" : "Expired"}<br />Until {localDate(item.expires_at).toLocaleString()} · Granted by user #{item.granted_by}<p>{item.reason}</p>
        {active && <button type="button" disabled={busy} onClick={() => revoke(item.id)}>Revoke now</button>}
        <button type="button" onClick={() => accessApi.getTemporaryAccessEvents(item.id).then(setEvents).catch(err => setError(err.message))}>View changes</button>
      </li>
    })}</ul>
    {events && <div><h3>Changes made using temporary access</h3>{events.length ? events.map(event => <p key={event.id}>{event.action} · Student #{event.target_user_id} · {localDate(event.created_at).toLocaleString()}</p>) : <p>No changes recorded.</p>}</div>}
  </section>
}
