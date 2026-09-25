"use client"
import { useUiAccess } from "@/components/access/PermissionGate"
import Link from "next/link"
import { useEffect, useState } from "react"
import { institutionsApi } from "@/lib/api"
import { Institution } from "@/types/institution"
import { useAuth } from "@/lib/auth-context"
import styles from "./page.module.css"

const fields = [
  ["name", "Name", 300], ["short_name", "Short name", 20], ["place", "Place", 200], ["phone", "Phone", 20],
  ["email", "Email", 255], ["bank_name", "Bank name", 200], ["bank_branch", "Bank branch", 200],
  ["account_name", "Account holder name", 200], ["account_number", "Account number", 50], ["ifsc_code", "IFSC code", 20],
] as const

export default function SettingsPage() {
  const { can } = useUiAccess()
  const { selectedInstitution: inst, updateSelectedInstitution, user } = useAuth()
  const [form, setForm] = useState<Institution | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const canEdit = user?.user_type === "admin"

  useEffect(() => { setForm(inst); setLogoFile(null) }, [inst])
  useEffect(() => {
    if (!logoFile) { setPreview(null); return }
    const url = URL.createObjectURL(logoFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form || !inst || !canEdit) return
    setSaving(true); setMessage(""); setError("")
    try {
      const logo = logoFile ? (await institutionsApi.uploadLogo(inst.id, logoFile)).url : form.logo
      const payload = {
        ...Object.fromEntries(fields.map(([key]) => [key, form[key]?.trim() || null])),
        address: form.address?.trim() || null,
        institution_type: form.institution_type, is_active: form.is_active, logo,
      }
      const updated = await institutionsApi.update(inst.id, payload)
      updateSelectedInstitution(updated)
      setForm(updated); setLogoFile(null)
      setMessage("Institution settings saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save institution settings")
    } finally { setSaving(false) }
  }

  if (!form || !inst) return null
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>{inst.institution_type==="educational"&&can("admission.configure")&&<Link className={styles.admissionSettingsLink} href={`/dashboard/institution/${inst.id}/settings/admission`}><strong>Admission Form Settings →</strong><span>Configure fields, required documents, declarations and print layout.</span></Link>}
      <p className={styles.sub}>Update institution details and logo.</p>
      {!canEdit && <p className={styles.sub}>Admin access is required to edit these settings.</p>}
      <form onSubmit={save}>
        <fieldset disabled={saving || !canEdit} className={styles.fieldset}>
          <section className={styles.card}>
            <h2 className={styles.heading}>Institution logo</h2>
            <div className={styles.logoRow}>
              {preview || form.logo ? <img src={preview || form.logo || ""} alt="Institution logo preview" className={styles.logo} /> : <div className={styles.logoPlaceholder}>No logo</div>}
              <div className={styles.item}>
                <label htmlFor="logo" className={styles.label}>Choose a logo</label>
                <input id="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  if (!file) return
                  setError(""); setMessage("")
                  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
                    setError("Choose a PNG, JPEG or WebP image no larger than 2 MB."); return
                  }
                  setLogoFile(file)
                }} />
                <small>PNG, JPEG or WebP, up to 2 MB. Save changes to apply.</small>
                {(form.logo || logoFile) && <button type="button" className={styles.secondary} onClick={() => { setLogoFile(null); setForm({ ...form, logo: null }) }}>Remove logo</button>}
              </div>
            </div>
          </section>
          <section className={styles.card}>
            <h2 className={styles.heading}>Institution details</h2>
            <div className={styles.grid}>
              {fields.map(([key, label, maxLength]) => <label key={key} className={styles.item}>
                <span className={styles.label}>{label}{key === "name" ? " *" : ""}</span>
                <input type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} maxLength={maxLength} required={key === "name"}
                  value={form[key] ?? ""} onChange={event => setForm({ ...form, [key]: key === "short_name" ? event.target.value.toUpperCase() : event.target.value })} />
              </label>)}
              <label className={styles.item}><span className={styles.label}>Institution type</span>
                <select value={form.institution_type} onChange={event => setForm({ ...form, institution_type: event.target.value as Institution["institution_type"] })}>
                  <option value="educational">Educational</option><option value="masjid">Masjid</option><option value="zakat_cell">Zakat Cell</option><option value="social_welfare">Social Welfare</option>
                </select>
              </label>
              <label className={`${styles.item} ${styles.fullWidth}`}><span className={styles.label}>Address</span>
                <textarea rows={3} value={form.address ?? ""} onChange={event => setForm({ ...form, address: event.target.value })} />
              </label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.is_active} onChange={event => setForm({ ...form, is_active: event.target.checked })} /> Institution is active</label>
            </div>
          </section>
          {canEdit && <div className={styles.actions}>
            <button type="submit" disabled={!form.name.trim()}>{saving ? "Saving..." : "Save changes"}</button>
            <button type="button" className={styles.secondary} onClick={() => { setForm(inst); setLogoFile(null); setError(""); setMessage("") }}>Reset changes</button>
          </div>}
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.success} role="status">{message}</p>}
      </form>
    </div>
  )
}
