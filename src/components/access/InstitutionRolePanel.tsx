"use client"
import { useEffect, useState } from "react"
import { accessApi, institutionsApi } from "@/lib/api"
import { usePermissions } from "@/lib/permissions-context"
import { Institution } from "@/types/institution"
import { Role } from "@/types"
import styles from "./TemporaryAccessPanel.module.css"
type Assignment = { institution_id: number; institution_name: string; role_id: number; role_name: string }
export default function InstitutionRolePanel({ userId, institutionId }: { userId: number; institutionId: number }) {
  const { isSuperadmin } = usePermissions()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedInstitution, setInstitution] = useState(institutionId)
  const [role, setRole] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const reload = () => accessApi.getUserInstitutions(userId).then(setAssignments)
  useEffect(() => {
    if (!isSuperadmin) return
    let active = true
    setBusy(true); setError("")
    Promise.all([accessApi.getUserInstitutions(userId), institutionsApi.getAll(), accessApi.getRoles()])
      .then(([a,i,r]) => { if (active) { setAssignments(a); setInstitutions(i); setRoles(r); setInstitution(institutionId) } })
      .catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [userId, institutionId, isSuperadmin])
  if (!isSuperadmin) return null
  const assign = async () => {
    if (!role || !selectedInstitution || busy) return
    setError(""); setMessage(""); setBusy(true)
    try { await accessApi.assignRole(userId, selectedInstitution, role); await reload(); setMessage("Institution role assigned.") }
    catch (err) { setError(err instanceof Error ? err.message : "Could not assign role") }
    finally { setBusy(false) }
  }
  const revoke = async (assignment: Assignment) => {
    if (!window.confirm(`Remove ${assignment.role_name} access at ${assignment.institution_name}?`)) return
    setBusy(true); setError(""); setMessage("")
    try { await accessApi.revokeRole(userId, assignment.institution_id, assignment.role_id); await reload(); setMessage("Institution role removed.") }
    catch (err) { setError(err instanceof Error ? err.message : "Could not remove role") }
    finally { setBusy(false) }
  }
  const duplicate = assignments.some(a => a.institution_id === selectedInstitution && a.role_id === role)
  return <section className={styles.card}><h2>Institution Roles</h2>
    <p>Choose which institution this user can access and the role they hold there. Their home institution alone does not grant access.</p>
    <div className={styles.fields}>
      <label>Institution<select disabled={busy} value={selectedInstitution} onChange={e => setInstitution(Number(e.target.value))}><option value={0}>Select institution</option>{institutions.filter(i => i.is_active).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
      <label>Role<select disabled={busy} value={role} onChange={e => setRole(Number(e.target.value))}><option value={0}>Select role</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
    </div>
    {role > 0 && <p>Permissions: {roles.find(r => r.id === role)?.permissions.map(p => p.code).join(", ") || "No permissions assigned to this role"}</p>}
    <button type="button" disabled={busy || !role || !selectedInstitution || duplicate} onClick={assign}>{duplicate ? "Already assigned" : "Assign Institution Role"}</button>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!busy && assignments.length === 0 && <p>No institution roles assigned.</p>}
    <ul>{assignments.map(a => <li key={`${a.institution_id}-${a.role_id}`}><strong>{a.institution_name}</strong> — {a.role_name} <button type="button" disabled={busy} onClick={() => revoke(a)}>Remove role</button></li>)}</ul>
  </section>
}
