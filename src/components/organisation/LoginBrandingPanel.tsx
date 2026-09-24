"use client"
import { useEffect, useState } from "react"
import { organisationApi, brandingLogoUrl, LoginBranding } from "@/lib/api"
import styles from "@/app/dashboard/institution/[id]/accounts/invoices/create/create.module.css"

export default function LoginBrandingPanel() {
  const [branding, setBranding] = useState<LoginBranding | null>(null)
  const [name, setName] = useState("")
  const [tagline, setTagline] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => { let active = true; organisationApi.branding().then(b => { if (active) { setBranding(b); setName(b.display_name); setTagline(b.tagline) } }).catch(e => { if (active) setError(e.message) }); return () => { active = false } }, [])
  const run = async (action: () => Promise<LoginBranding>, success: string) => {
    if (busy) return
    setBusy(true); setError(""); setMessage("")
    try { setBranding(await action()); setMessage(success) } catch (e) { setError(e instanceof Error ? e.message : "Could not save branding") } finally { setBusy(false) }
  }
  return <section className={styles.card}>
    <h2 className={styles.cardTitle}>Login Branding</h2>
    <p className={styles.sub}>Your client logo, organisation name and tagline appear above Sign in. The app logo remains separate.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {branding && <>
      <form onSubmit={e => { e.preventDefault(); void run(() => organisationApi.saveBranding({ display_name: name, tagline }), "Login branding saved.") }}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
          <div className={styles.grid2}>
            <label className={styles.field}>Organisation display name<input className={styles.input} maxLength={200} value={name} onChange={e => setName(e.target.value)} /></label>
            <label className={styles.field}>Tagline<input className={styles.input} maxLength={300} value={tagline} onChange={e => setTagline(e.target.value)} /></label>
          </div>
          <div className={styles.actions}><button className={styles.submitBtn}>Save Branding</button></div>
        </fieldset>
      </form>
      <label className={styles.field}>Client logo (PNG, JPEG or WebP, up to 2 MB)
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { const file=e.target.files?.[0];e.target.value="";if (!file) return; if (file.size>2*1024*1024) { setError("Logo must be 2 MB or smaller"); return } void run(() => organisationApi.uploadBrandingLogo(file), "Client logo saved.") }} />
      </label>
      {branding.logo_path && <button type="button" className={styles.cancelBtn} disabled={busy} onClick={() => void run(() => organisationApi.removeBrandingLogo(), "Client logo removed.")}>Remove Logo</button>}
      <div style={{ padding: "1.5rem", marginTop: "1rem", border: "1px solid var(--border)", borderRadius: 12, maxWidth: 440, background: "white", overflowWrap: "anywhere" }}>
        <p className={styles.hint}>Login header preview</p>
        {branding.logo_path ? <img src={brandingLogoUrl(branding.logo_path)} alt="Client logo preview" style={{ maxWidth: "100%", height: 90, objectFit: "contain", margin: "1rem 0" }} /> : <p className={styles.hint}>The app logo will appear until a client logo is uploaded.</p>}
        <h3>{name || branding.display_name}</h3><p className={styles.sub}>{tagline}</p><h3 style={{ marginTop: "1rem" }}>Sign in</h3><p className={styles.sub}>Enter your credentials to access the portal</p>
      </div>
    </>}
    {message && <p role="status">{message}</p>}
  </section>
}
