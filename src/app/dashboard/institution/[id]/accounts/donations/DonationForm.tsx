"use client"
import MoneyAccountSelect from "@/components/accounting/MoneyAccountSelect"
import { useEffect, useState, useRef } from "react"
import PermissionGate, { useUiAccess } from "@/components/access/PermissionGate"
import { useAuth } from "@/lib/auth-context"
import { useParams } from "next/navigation"
import { accountingApi, usersApi } from "@/lib/api"
import { InvoiceCategory } from "@/types/accounting"
import { UserResponse } from "@/types"
import styles from "../invoices/create/create.module.css"

export default function DonationForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { id } = useParams()
  const { user, selectedInstitution } = useAuth()
  const isZakat = selectedInstitution?.id === Number(id) && selectedInstitution.institution_type === "zakat_cell"
  const { can } = useUiAccess()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryError, setCategoryError] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || creatingCategory || !can("invoice-categories.create")) return
    const name = categoryName.trim()
    if (!name) { setCategoryError("Category name is required"); return }
    if (categories.some(category => category.name.toLowerCase() === name.toLowerCase())) {
      setCategoryError("This category already exists. Select it from the category list."); return
    }
    setCreatingCategory(true); setCategoryError("")
    try {
      const category = await accountingApi.createInvoiceCategory({ name, created_by: user.id })
      setCategories(previous => [...previous, category])
      field("category_id", String(category.id))
      setShowCategoryModal(false)
    } catch (err) { setCategoryError(err instanceof Error ? err.message : "Failed to create category") }
    finally { setCreatingCategory(false) }
  }
  const [categories, setCategories] = useState<InvoiceCategory[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeOption, setActiveOption] = useState(-1)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState("")
  const searchInput = useRef<HTMLInputElement>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [error, setError] = useState("")
  const [moneyAccount, setMoneyAccount] = useState("")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ donor_type: "external", user_id: "", donor_name: "", donor_phone: "", donor_address: "", category_id: "", amount: "", received_date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` })(), payment_method: "cash", reference_number: "", notes: "" })
  const field = (name: string, value: string) => setForm(previous => ({ ...previous, [name]: value }))
  useEffect(() => { if (!isZakat) accountingApi.getInvoiceCategories().then(setCategories).catch(err => setError(err.message)) }, [isZakat])
  useEffect(() => {
    let active = true
    setUsers([]); setUsersError(""); setUsersLoading(form.donor_type === "existing")
    field("user_id", ""); setUserSearch(""); setPickerOpen(false)
    if (form.donor_type === "existing") usersApi.getAll(Number(id))
      .then(value => { if (active) setUsers(value.filter(user => user.is_active)) })
      .catch(err => { if (active) setUsersError(err.message) })
      .finally(() => { if (active) setUsersLoading(false) })
    return () => { active = false }
  }, [id, form.donor_type])
  const selectedDonor = users.find(user => String(user.id) === form.user_id)
  const query = userSearch.trim().toLowerCase()
  const matchingUsers = users.filter(user => [user.full_name, user.ref_number, user.employee_id, user.phone, user.email].some(value => value?.toLowerCase().includes(query)))
  const suggestions = matchingUsers.slice(0, 10)
  const chooseDonor = (donor: UserResponse) => {
    field("user_id", String(donor.id)); setUserSearch(donor.full_name); setPickerOpen(false); setActiveOption(-1)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || !can("receipts.create")) return
    if (form.donor_type === "existing" && !selectedDonor) { setError("Select a donor from the search results"); searchInput.current?.focus(); return }
    setBusy(true); setError("")
    try {
      await accountingApi.receiveDonation({ ...form, money_account_id: moneyAccount ? Number(moneyAccount) : null, institution_id: Number(id), user_id: form.donor_type === "existing" ? Number(form.user_id) : null, category_id: isZakat ? null : Number(form.category_id), amount: form.amount })
      onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to record donation"); setBusy(false) }
  }
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} disabled={busy} onClick={onClose}>Close</button>
        <h1 className={styles.title}>Receive Donation</h1>
        <p className={styles.sub}>Record the donation and issue its receipt in one step.</p>
      </div>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className={styles.form} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Donor Details</h2>
            <div className={styles.grid2}>
              <label className={styles.field}><span className={styles.label}>Received From *</span>
                <select className={styles.input} value={form.donor_type} onChange={e => field("donor_type", e.target.value)}>
                  <option value="external">External donor</option><option value="existing">Existing user</option><option value="anonymous">Anonymous</option>
                </select>
              </label>
              {form.donor_type === "existing" && <div className={styles.field} style={{ gridColumn: "1 / -1" }}>
                <label className={styles.label} htmlFor="donor-search">User *</label>
                {selectedDonor ? <div className={styles.selectedUser}>
                  <div className={styles.userInfo}><p className={styles.userName}>{selectedDonor.full_name}</p><p className={styles.userMeta}>{[selectedDonor.ref_number || selectedDonor.employee_id, selectedDonor.phone, selectedDonor.email].filter(Boolean).join(" · ")}</p></div>
                  <button type="button" className={styles.changeBtn} onClick={() => { field("user_id", ""); setUserSearch(""); setActiveOption(-1); setPickerOpen(true); setTimeout(() => searchInput.current?.focus(), 0) }}>Change</button>
                </div> : <div className={styles.userPicker}>
                  <input id="donor-search" ref={searchInput} className={styles.input} role="combobox" aria-autocomplete="list" aria-expanded={pickerOpen} aria-controls="donor-options"
                    aria-activedescendant={pickerOpen && suggestions[activeOption] ? `donor-option-${suggestions[activeOption].id}` : undefined}
                    autoComplete="off" placeholder="Search by name, ID, phone or email…" value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setPickerOpen(true); setActiveOption(-1) }}
                    onFocus={() => setPickerOpen(true)} onBlur={() => setPickerOpen(false)}
                    onKeyDown={e => {
                      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setPickerOpen(true); setActiveOption(index => Math.max(0, Math.min(suggestions.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))) }
                      if (e.key === "Escape") { e.preventDefault(); setPickerOpen(false) }
                      if (e.key === "Enter" && pickerOpen) { e.preventDefault(); if (suggestions[activeOption]) chooseDonor(suggestions[activeOption]) }
                    }} />
                  {pickerOpen && <div className={styles.userDropdown} id="donor-options" role="listbox" aria-label="Matching donors">
                    {suggestions.map((donor, index) => <div key={donor.id} id={`donor-option-${donor.id}`} role="option" aria-selected={index === activeOption}
                      className={styles.userOption} style={index === activeOption ? { background: "var(--slate-lt)" } : undefined}
                      onMouseDown={e => e.preventDefault()} onClick={() => chooseDonor(donor)}>
                      <div><p className={styles.optName}>{donor.full_name}</p><p className={styles.optMeta}>{[donor.ref_number || donor.employee_id, donor.phone, donor.email].filter(Boolean).join(" · ")}</p></div>
                    </div>)}
                  </div>}
                  <p className={styles.hint} role="status">{usersLoading ? "Loading donors…" : usersError || (matchingUsers.length === 0 ? "No matching donors found." : matchingUsers.length > 10 ? "Showing the first 10 matches. Type more to narrow your search." : "Select a donor from the results. Use arrow keys and Enter to select.")}</p>
                </div>}
              </div>}
              {form.donor_type === "external" && <>
                <label className={styles.field}><span className={styles.label}>Donor Name *</span>
                  <input className={styles.input} required maxLength={200} placeholder="Donor full name" value={form.donor_name} onChange={e => field("donor_name", e.target.value)} />
                </label>
                <label className={styles.field}><span className={styles.label}>Phone</span>
                  <input className={styles.input} type="tel" maxLength={50} placeholder="Phone number (optional)" value={form.donor_phone} onChange={e => field("donor_phone", e.target.value)} />
                </label>
              </>}
            </div>
            {form.donor_type === "external" && <label className={styles.field} style={{ marginTop: "1rem" }}><span className={styles.label}>Address</span>
              <textarea className={styles.input} rows={2} maxLength={500} placeholder="Address (optional)" value={form.donor_address} onChange={e => field("donor_address", e.target.value)} />
            </label>}
            {form.donor_type === "anonymous" && <p className={styles.hint}>The receipt will show Anonymous as the donor.</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.itemsHeader}>
              <h2 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 0 }}>Donation Details</h2>
              {!isZakat && <PermissionGate action="invoice-categories.create"><button type="button" className={styles.newCategoryBtn} onClick={() => { setCategoryName(""); setCategoryError(""); setShowCategoryModal(true) }}>+ New Category</button></PermissionGate>}
            </div>
            <div className={styles.grid2}>
              {!isZakat && <label className={styles.field}><span className={styles.label}>Donation Category *</span>
                <select className={styles.input} required value={form.category_id} onChange={e => field("category_id", e.target.value)}>
                  <option value="">Select category</option>{categories.filter(category => category.is_active).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>}
              <label className={styles.field}><span className={styles.label}>Amount (₹) *</span>
                <input className={styles.input} type="number" min="0.01" step="0.01" required placeholder="0.00" value={form.amount} onChange={e => field("amount", e.target.value)} />
              </label>
              <label className={styles.field}><span className={styles.label}>Date *</span>
                <input className={styles.input} type="date" required value={form.received_date} onChange={e => field("received_date", e.target.value)} />
              </label>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Details</h2>
            <div className={styles.grid2}>
              <label className={styles.field}><span className={styles.label}>Payment Method *</span>
                <select className={styles.input} value={form.payment_method} onChange={e => field("payment_method", e.target.value)}>
                  {['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'online'].map(method => <option key={method} value={method}>{method.replaceAll('_', ' ').toUpperCase()}</option>)}
                </select>
              </label>
            <MoneyAccountSelect institutionId={Number(id)} method={form.payment_method} value={moneyAccount} onChange={setMoneyAccount} />
              <label className={styles.field}><span className={styles.label}>Reference Number</span>
                <input className={styles.input} maxLength={100} placeholder="Transaction reference (optional)" value={form.reference_number} onChange={e => field("reference_number", e.target.value)} />
              </label>
            </div>
            <label className={styles.field} style={{ marginTop: "1rem" }}><span className={styles.label}>Notes</span>
              <textarea className={styles.input} rows={3} maxLength={2000} placeholder="Additional notes (optional)" value={form.notes} onChange={e => field("notes", e.target.value)} />
            </label>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Summary</h2>
            <div className={styles.totals}>
              <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total Received</span><span>₹{Number(form.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </div>
          </section>
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={busy}>{busy ? "Recording…" : "Receive Donation & Create Receipt"}</button>
          </div>
        </fieldset>
      </form>
      {showCategoryModal && can("invoice-categories.create") && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} role="dialog" aria-modal="true" aria-labelledby="donation-category-title" onKeyDown={event => { if (event.key === "Escape" && !creatingCategory) setShowCategoryModal(false) }}>
            <h2 id="donation-category-title" className={styles.modalTitle}>New Category</h2>
            <p className={styles.modalSub}>This category will also be available for invoices.</p>
            <form onSubmit={createCategory}>
              <label className={styles.modalField}><span className={styles.label}>Category Name *</span>
                <input autoFocus className={styles.input} value={categoryName} onChange={event => setCategoryName(event.target.value)} maxLength={100} required disabled={creatingCategory} placeholder="e.g. General Donation" />
              </label>
              {categoryError && <p className={styles.error} role="alert">{categoryError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} disabled={creatingCategory} onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={creatingCategory}>{creatingCategory ? "Creating…" : "Create Category"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
