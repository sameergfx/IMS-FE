"use client"
import { useEffect, useState } from "react"
import { Pencil, UserRound, Check, Trash2 } from "lucide-react"
import listStyles from "./ResponsibilityPanel.module.css"
import { useParams } from "next/navigation"
import { accessApi, AssignmentPerson, InstitutionResponsibility } from "@/lib/api"
import { usePermissions } from "@/lib/permissions-context"
import { Role } from "@/types"
import styles from "./TemporaryAccessPanel.module.css"

export default function ResponsibilityPanel() {
  const { id } = useParams()
  const institutionId = Number(id)
  const { isSuperadmin } = usePermissions()
  const [rows, setRows] = useState<InstitutionResponsibility[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [query, setQuery] = useState("")
  const [people, setPeople] = useState<AssignmentPerson[]>([])
  const [person, setPerson] = useState<AssignmentPerson | null>(null)
  const [role, setRole] = useState("")
  const [responsibility, setResponsibility] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [active, setActive] = useState(true)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => {
    if (!isSuperadmin) return
    let live = true
    Promise.all([accessApi.getResponsibilities(institutionId), accessApi.getRoles()]).then(([a, r]) => { if (live) { setRows(a); setRoles(r) } }).catch(e => { if (live) setError(e.message) })
    return () => { live = false }
  }, [institutionId, isSuperadmin])
  useEffect(() => {
    if (!isSuperadmin || person || query.trim().length < 2) { setPeople([]); return }
    let live = true
    setSearching(true)
    const timer = setTimeout(() => { accessApi.searchAssignmentPeople(institutionId, query).then(p => { if (live) setPeople(p) }).catch(e => { if (live) setError(e.message) }).finally(() => { if (live) setSearching(false) }) }, 300)
    return () => { live = false; clearTimeout(timer) }
  }, [query, person, institutionId, isSuperadmin])
  if (!isSuperadmin) return null
  const reset = () => { setPerson(null); setQuery(""); setRole(""); setResponsibility(""); setStart(""); setEnd(""); setActive(true); setEditing(false) }
  const edit = (row: InstitutionResponsibility) => {
    setPerson({ id: row.user_id, name: row.name, reference: null, phone: null, home_institution: null }); setRole(String(row.role_id)); setResponsibility(row.responsibility || row.role_name); setStart(row.starts_on || ""); setEnd(row.ends_on || ""); setActive(row.is_active); setEditing(true); setMessage("")
  }
  const remove = async (row: InstitutionResponsibility) => {
    if (busy || !window.confirm(`Remove ${row.name}'s ${row.role_name} assignment from this institution? This removes the access granted by this role. Their person record and other assignments will remain.`)) return
    setBusy(true); setError(""); setMessage("")
    try {
      await accessApi.revokeRole(row.user_id, institutionId, row.role_id)
      setRows(previous => previous.filter(item => item.id !== row.id))
      if (person?.id === row.user_id && Number(role) === row.role_id) reset()
      setMessage("Institution assignment removed.")
    } catch (e) { setError(e instanceof Error ? e.message : "Could not remove assignment") }
    finally { setBusy(false) }
  }
  const duplicate = !editing && rows.some(row => row.user_id === person?.id && row.role_id === Number(role))
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !person || !role || duplicate) return
    setBusy(true); setError(""); setMessage("")
    try {
      await accessApi.saveResponsibility(institutionId, { user_id: person.id, role_id: Number(role), responsibility, starts_on: start || null, ends_on: end || null, is_active: active })
      setRows(await accessApi.getResponsibilities(institutionId)); reset(); setMessage("Institution responsibility saved.")
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save assignment") }
    finally { setBusy(false) }
  }
  return <section className={`${styles.card} ${listStyles.panel}`}>
    <h2>Institution responsibilities</h2>
    <p>Assign an existing person, including a Masjid member, without creating another user. Access comes from the selected role at this institution. Dates are inclusive; empty dates mean no time limit.</p>
    <form onSubmit={save}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
        {person ? <div className={listStyles.selectedPerson}><span className={listStyles.avatar}><UserRound size={20} aria-hidden="true" /></span><div className={listStyles.personInfo}><span className={listStyles.caption}>Selected person</span><strong>{person.name}</strong></div>{!editing && <button className={listStyles.secondaryButton} type="button" onClick={() => setPerson(null)}>Change person</button>}</div> : <>
          <div className={styles.fields}><label>Find existing person<input value={query} onChange={e => { setQuery(e.target.value); setPeople([]) }} placeholder="Name, member ID, employee ID or phone" /></label></div>
          {query.trim().length >= 2 && <p role="status">{searching ? "Searching…" : `${people.length} matches (up to 20). Refine your search if needed.`}</p>}
          {people.length > 0 && <ul className={listStyles.searchResults} aria-label="Matching people">{people.map(p => <li key={p.id}>
            <button className={listStyles.personOption} type="button" onClick={() => { setPerson(p); setPeople([]) }}>
              <span className={listStyles.avatar}><UserRound size={20} aria-hidden="true" /></span>
              <span className={listStyles.personInfo}><strong>{p.name}</strong><span className={listStyles.meta}>{[p.reference, p.phone, p.home_institution].filter(Boolean).join(" · ") || "Existing person"}</span></span>
              <span className={listStyles.selectHint}>Select <Check size={15} aria-hidden="true" /></span>
            </button>
          </li>)}</ul>}
        </>}
        <div className={styles.fields}>
          <label>Responsibility<input required maxLength={100} value={responsibility} onChange={e => setResponsibility(e.target.value)} placeholder="Convener, Enquiry Officer, Treasurer…" /></label>
          <label>Permission role<select required disabled={editing} value={role} onChange={e => setRole(e.target.value)}><option value="">Select role</option>{roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <label>Starts on<input type="date" value={start} max={end || undefined} onChange={e => setStart(e.target.value)} /></label>
          <label>Ends on<input type="date" value={end} min={start || undefined} onChange={e => setEnd(e.target.value)} /></label>
          <label>Status<select value={String(active)} onChange={e => setActive(e.target.value === "true")}><option value="true">Active</option><option value="false">Inactive</option></select></label>
        </div>
        {role && <p>Permissions: {roles.find(r => r.id === Number(role))?.permissions.map(p => p.code).join(", ") || "None"}</p>}
        {duplicate && <p>This person already has this role. Use Edit assignment below to change it.</p>}
        <button disabled={!person || !role || duplicate} type="submit">{busy ? "Saving…" : editing ? "Save changes" : "Assign person"}</button><button type="button" onClick={reset}>Clear</button>
      </fieldset>
    </form>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <div className={listStyles.listHeader}><h3>Assigned people</h3><span className={listStyles.count}>{rows.length}</span></div>
    <div className={listStyles.tableWrap}>
      <table className={listStyles.table}>
        <thead><tr><th scope="col">Person</th><th scope="col">Responsibility</th><th scope="col">Permission role</th><th scope="col">Starts on</th><th scope="col">Ends on</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}>
          <td><strong>{row.name}</strong></td>
          <td>{row.responsibility || row.role_name}</td><td>{row.role_name}</td>
          <td className={listStyles.dateCell}>{row.starts_on || "No start limit"}</td><td className={listStyles.dateCell}>{row.ends_on || "No end limit"}</td>
          <td><span className={`${listStyles.badge} ${row.is_active ? listStyles.enabled : listStyles.inactive}`}>{row.is_active ? "Enabled" : "Inactive"}</span></td>
          <td><div className={listStyles.tableActions}>
            <button className={listStyles.secondaryButton} type="button" disabled={busy} aria-label={`Edit assignment for ${row.name}, ${row.role_name}`} onClick={() => edit(row)}><Pencil size={14} aria-hidden="true" /> Edit</button>
            <button className={listStyles.removeButton} type="button" disabled={busy} aria-label={`Remove assignment for ${row.name}, ${row.role_name}`} onClick={() => remove(row)}><Trash2 size={14} aria-hidden="true" /> Remove</button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>

  </section>
}
