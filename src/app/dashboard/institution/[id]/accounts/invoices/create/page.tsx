"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi, accountingApi } from "@/lib/api"
import { UserResponse } from "@/types"
import { Account, InvoiceItemCreate } from "@/types/accounting"
import styles from "./create.module.css"

const emptyItem = (): InvoiceItemCreate => ({ account_id: 0, description: "", amount: 0, discount: 0 })

export default function CreateInvoicePage() {
  const { id } = useParams()
  const router = useRouter()
  const pickerRef = useRef<HTMLDivElement>(null)

  const [users,      setUsers]      = useState<UserResponse[]>([])
  const [accounts,   setAccounts]   = useState<Account[]>([])
  const [loadError,  setLoadError]  = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [showUserList, setShowUserList] = useState(false)

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [items, setItems] = useState<InvoiceItemCreate[]>([emptyItem()])

  const [form, setForm] = useState({
    invoice_date:  new Date().toISOString().split("T")[0],
    due_date:      "",
    discount:      "0",
    description:   "",
    academic_year: "",
  })

  // Load users + accounts, surface real errors instead of swallowing them
  useEffect(() => {
    usersApi.getAll(Number(id))
      .then(data => setUsers(data))
      .catch(err => setLoadError(prev => prev + ` Users: ${err.message}.`))

    accountingApi.getAccounts()
      .then(data => setAccounts(data))
      .catch(err => setLoadError(prev => prev + ` Payment types: ${err.message}.`))
  }, [id])

  // Close user dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowUserList(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setItem  = (i: number, k: keyof InvoiceItemCreate, v: string | number) =>
    setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const subtotal    = items.reduce((s, it) => s + (Number(it.amount) - Number(it.discount)), 0)
  const totalAmount = subtotal - Number(form.discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedUser) { setError("Please select a user"); return }
    if (items.some(it => !it.account_id || !it.description || !it.amount)) {
      setError("Fill all item fields, including payment type"); return
    }

    setSubmitting(true)
    try {
      const invoice = await accountingApi.createInvoice({
        user_id:       selectedUser.id,
        institution_id: Number(id),
        invoice_date:  form.invoice_date,
        due_date:      form.due_date || null,
        discount:      Number(form.discount),
        description:   form.description || null,
        academic_year: form.academic_year || null,
        issued_by:     null,
        items: items.map(it => ({
          account_id:  Number(it.account_id),
          description: it.description,
          amount:      Number(it.amount),
          discount:    Number(it.discount),
        })),
      })
      router.push(`/dashboard/institution/${id}/accounts/invoices/${invoice.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
          <h1 className={styles.title}>Create Invoice</h1>
          <p className={styles.sub}>Generate a new invoice for a user</p>
        </div>
      </div>

      {loadError && (
        <div className={styles.loadError}>
          ⚠ {loadError.trim()}
        </div>
      )}

      {accounts.length === 0 && !loadError && (
        <div className={styles.loadError}>
          ⚠ No payment types found. Go to <strong>Accounts → Add Account</strong> first (e.g. Tuition Fee, Bus Fee, Donation) before creating an invoice.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* User selection */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Select User</h2>

          {selectedUser ? (
            <div className={styles.selectedUser}>
              <div className={styles.userAvatar}>
                {selectedUser.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{selectedUser.full_name}</p>
                <p className={styles.userMeta}>{selectedUser.email} · <span className={styles.userType}>{selectedUser.user_type}</span></p>
              </div>
              <button type="button" className={styles.changeBtn} onClick={() => { setSelectedUser(null); setShowUserList(true) }}>
                Change
              </button>
            </div>
          ) : (
            <div className={styles.userPicker} ref={pickerRef}>
              <input
                className={styles.input}
                placeholder={users.length === 0 ? "No users found for this institution" : "Search by name or email..."}
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setShowUserList(true) }}
                onFocus={() => setShowUserList(true)}
                disabled={users.length === 0}
              />
              {showUserList && users.length > 0 && (
                <div className={styles.userDropdown}>
                  {filteredUsers.length === 0 ? (
                    <p className={styles.noUsers}>No users match &quot;{userSearch}&quot;</p>
                  ) : (
                    filteredUsers.slice(0, 8).map(u => (
                      <button
                        type="button"
                        key={u.id}
                        className={styles.userOption}
                        onMouseDown={(e) => {
                          // onMouseDown fires before blur — prevents the dropdown
                          // from closing before the click is registered
                          e.preventDefault()
                          setSelectedUser(u)
                          setShowUserList(false)
                          setUserSearch("")
                        }}
                      >
                        <div className={styles.userAvatarSm}>
                          {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.optName}>{u.full_name}</p>
                          <p className={styles.optMeta}>{u.email} · {u.user_type}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice details */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Invoice Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Invoice Date *</label>
              <input className={styles.input} type="date"
                value={form.invoice_date} onChange={e => setField("invoice_date", e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Due Date</label>
              <input className={styles.input} type="date"
                value={form.due_date} onChange={e => setField("due_date", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Academic Year</label>
              <input className={styles.input} placeholder="e.g. 2024-25"
                value={form.academic_year} onChange={e => setField("academic_year", e.target.value)} />
            </div>
          </div>
          <div className={styles.field} style={{ marginTop: "1rem" }}>
            <label className={styles.label}>Description</label>
            <input className={styles.input} placeholder="e.g. June 2025 Term Fees"
              value={form.description} onChange={e => setField("description", e.target.value)} />
          </div>
        </div>

        {/* Payment items */}
        <div className={styles.card}>
          <div className={styles.itemsHeader}>
            <h2 className={styles.cardTitle}>Payment Items</h2>
            <button type="button" className={styles.addItemBtn} onClick={() => setItems(p => [...p, emptyItem()])}>
              + Add Item
            </button>
          </div>

          <div className={styles.itemsHead}>
            <span>Type</span><span>Description</span><span>Amount (₹)</span><span>Discount (₹)</span><span>Net (₹)</span><span></span>
          </div>

          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <select
                className={styles.input}
                value={item.account_id}
                onChange={e => setItem(i, "account_id", Number(e.target.value))}
              >
                <option value={0}>Select type</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input className={styles.input} placeholder="Description"
                value={item.description} onChange={e => setItem(i, "description", e.target.value)} />
              <input className={styles.input} type="number" min="0" placeholder="0.00"
                value={item.amount || ""} onChange={e => setItem(i, "amount", e.target.value)} />
              <input className={styles.input} type="number" min="0" placeholder="0.00"
                value={item.discount || ""} onChange={e => setItem(i, "discount", e.target.value)} />
              <span className={styles.net}>₹{(Number(item.amount) - Number(item.discount)).toLocaleString()}</span>
              {items.length > 1 && (
                <button type="button" className={styles.removeBtn} onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>✕</button>
              )}
            </div>
          ))}

          <p className={styles.hint}>
            Common types: Tuition Fee, Bus Fee, Donation, Books & Stationery, Exam Fee, Library Fee — set these up under Accounts.
          </p>
        </div>

        {/* Totals */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Summary</h2>
          <div className={styles.totals}>
            <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className={styles.totalRow}>
              <span>Overall Discount</span>
              <div className={styles.discountInput}>
                <span>₹</span>
                <input type="number" min="0" value={form.discount} onChange={e => setField("discount", e.target.value)} />
              </div>
            </div>
            <div className={`${styles.totalRow} ${styles.totalFinal}`}>
              <span>Total Amount Due</span><span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  )
}
