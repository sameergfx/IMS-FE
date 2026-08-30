"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { institutionsApi } from "@/lib/api"
import { Institution } from "@/types/institution"
import styles from "./page.module.css"

export default function DashboardPage() {
  const { user, selectInstitution } = useAuth()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [showAdd,      setShowAdd]      = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState("")

  const [form, setForm] = useState({
    name: "", place: "", address: "", phone: "", email: "",
    bank_name: "", bank_branch: "", account_name: "", account_number: "", ifsc_code: "",
  })

  useEffect(() => {
    institutionsApi.getAll()
      .then(setInstitutions)
      .finally(() => setLoading(false))
  }, [])

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.place ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError("Name is required"); return }
    setSubmitting(true)
    setError("")
    try {
      const inst = await institutionsApi.create({
        ...form,
        place:          form.place          || null,
        address:        form.address        || null,
        phone:          form.phone          || null,
        email:          form.email          || null,
        bank_name:      form.bank_name      || null,
        bank_branch:    form.bank_branch    || null,
        account_name:   form.account_name   || null,
        account_number: form.account_number || null,
        ifsc_code:      form.ifsc_code      || null,
      })
      setInstitutions(p => [...p, inst])
      setShowAdd(false)
      setForm({ name: "", place: "", address: "", phone: "", email: "",
        bank_name: "", bank_branch: "", account_name: "", account_number: "", ifsc_code: "" })
    } catch (err: any) {
      setError(err.message || "Failed to create institution")
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>Welcome back, {user.full_name.split(" ")[0]}</p>
          <h1 className={styles.title}>Select Institution</h1>
          <p className={styles.sub}>Choose an institution to manage</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>
          + Add Institution
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          placeholder="Search institutions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading institutions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span>🏫</span>
          <p>No institutions found.</p>
          <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add Institution</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(inst => (
            <button key={inst.id} className={styles.card} onClick={() => selectInstitution(inst)}>
              <div className={styles.logoWrap}>
                {inst.logo
                  ? <img src={inst.logo} alt={inst.name} className={styles.logo} />
                  : <span className={styles.initials}>
                      {inst.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                }
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.instName}>{inst.name}</h2>
                {inst.place && <p className={styles.instMeta}>📍 {inst.place}</p>}
                {inst.phone && <p className={styles.instMeta}>📞 {inst.phone}</p>}
                {inst.email && <p className={styles.instMeta}>✉ {inst.email}</p>}
              </div>
              <div className={styles.cardFooter}>
                <span className={`${styles.activeBadge} ${inst.is_active ? styles.active : styles.inactive}`}>
                  {inst.is_active ? "Active" : "Inactive"}
                </span>
                <span className={styles.enterHint}>Enter →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Institution Modal */}
      {showAdd && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Institution</h2>
              <button className={styles.closeBtn} onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <form onSubmit={handleAdd} className={styles.modalForm}>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Basic Info</p>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Name *</label>
                    <input className={styles.input} placeholder="Institution name"
                      value={form.name} onChange={e => setField("name", e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Place</label>
                    <input className={styles.input} placeholder="City / Town"
                      value={form.place} onChange={e => setField("place", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone</label>
                    <input className={styles.input} placeholder="Phone number"
                      value={form.phone} onChange={e => setField("phone", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} type="email" placeholder="Email address"
                      value={form.email} onChange={e => setField("email", e.target.value)} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Address</label>
                  <input className={styles.input} placeholder="Full address"
                    value={form.address} onChange={e => setField("address", e.target.value)} />
                </div>
              </div>

              <div className={styles.section}>
                <p className={styles.sectionLabel}>Bank Details</p>
                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>Bank Name</label>
                    <input className={styles.input} placeholder="Bank name"
                      value={form.bank_name} onChange={e => setField("bank_name", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Branch</label>
                    <input className={styles.input} placeholder="Branch name"
                      value={form.bank_branch} onChange={e => setField("bank_branch", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Account Name</label>
                    <input className={styles.input} placeholder="Account holder name"
                      value={form.account_name} onChange={e => setField("account_name", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Account Number</label>
                    <input className={styles.input} placeholder="Account number"
                      value={form.account_number} onChange={e => setField("account_number", e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>IFSC Code</label>
                    <input className={styles.input} placeholder="IFSC code"
                      value={form.ifsc_code} onChange={e => setField("ifsc_code", e.target.value)} />
                  </div>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Adding..." : "Add Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
