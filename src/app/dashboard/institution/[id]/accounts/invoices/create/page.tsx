"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi, accountingApi } from "@/lib/api"
import { UserResponse } from "@/types"
import { Account, InvoiceCategory, InvoiceItemCreate } from "@/types/accounting"
import styles from "./create.module.css"
import { usePermissions } from "@/lib/permissions-context"

const emptyItem = (): InvoiceItemCreate => ({ account_id: 0, category_name: "", category_id: 0, description: "", amount: 0, discount: 0 })

export default function CreateInvoicePage() {
  const { id } = useParams()
  const { hasPermission } = usePermissions()
  const router = useRouter()
  const pickerRef = useRef<HTMLDivElement>(null)

  const [users,      setUsers]      = useState<UserResponse[]>([])
  const [categories, setCategories] = useState<InvoiceCategory[]>([])
  const [loadError,  setLoadError]  = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [activeUserIndex, setActiveUserIndex] = useState(-1)
  const [showUserList, setShowUserList] = useState(false)

  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [items, setItems] = useState<InvoiceItemCreate[]>([emptyItem()])

    // New-category popup
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [creatingCategory, setCreatingCategory]   = useState(false)
  const [categoryError,    setCategoryError]      = useState("")
  const [newCategory, setNewCategory] = useState({
    name: "", created_by: selectedUser?.id || 0,
  })

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

    accountingApi.getInvoiceCategories()
      .then(data => setCategories(data))
      .catch(err => setLoadError(prev => prev + ` Invoice categories: ${err.message}.`))
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
    [u.full_name, u.admission_number, u.employee_id, u.ref_number].some(value =>
      value?.toLowerCase().includes(userSearch.trim().toLowerCase()))
  )
  const suggestions = filteredUsers.slice(0, 10)
  const userDetails = (u: UserResponse) => [
    u.admission_number ? `Admission No: ${u.admission_number}` : null,
    u.employee_id ? `Employee ID: ${u.employee_id}` : null,
    !u.admission_number && !u.employee_id && u.ref_number ? `${u.ref_label || "ID"}: ${u.ref_number}` : null,
    u.user_type,
  ].filter(Boolean).join(" · ")
  const chooseUser = (u: UserResponse) => {
    setSelectedUser(u); setShowUserList(false); setUserSearch(""); setActiveUserIndex(-1)
  }

  const subtotal    = items.reduce((s, it) => s + (Number(it.amount) - Number(it.discount)), 0)
  const totalAmount = subtotal - Number(form.discount)

    const openCategoryModal = () => {
    setCategoryError("")
    setNewCategory({ name: "", created_by: selectedUser?.id || 0 })
    setShowCategoryModal(true)
  }

  const handleCreateCategory = async () => {
    setCategoryError("")
    if (!newCategory.name.trim()) { setCategoryError("Category name is required"); return }

    setCreatingCategory(true)
    try {
      const account = await accountingApi.createInvoiceCategory({
        name:         newCategory.name.trim(), created_by: selectedUser?.id || 0,
      })
      setCategories(prev => [...prev, account])
      setShowCategoryModal(false)
    } catch (err: any) {
      setCategoryError(err.message || "Failed to create category")
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedUser) { setError("Please select a user"); return }
    if (items.some(it => !it.category_id || !it.description || !it.amount)) {
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
          category_id: Number(it.category_id),
          category_name: categories.find(c => c.id === Number(it.category_id))?.name || "",
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

      {categories.length === 0 && !loadError && (
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
                <p className={styles.userMeta}>{userDetails(selectedUser)}</p>
              </div>
              <button type="button" className={styles.changeBtn} onClick={() => { setSelectedUser(null); setShowUserList(true) }}>
                Change
              </button>
            </div>
          ) : (
            <div className={styles.userPicker} ref={pickerRef}>
              <input
                className={styles.input}
                placeholder={users.length === 0 ? "No users found for this institution" : "Search by name, admission no. or employee ID..."}
                role="combobox" aria-label="Search invoice user" aria-autocomplete="list" autoComplete="off"
                aria-expanded={showUserList} aria-controls="invoice-user-options"
                aria-activedescendant={showUserList && suggestions[activeUserIndex] ? `invoice-user-${suggestions[activeUserIndex].id}` : undefined}
                onBlur={() => setShowUserList(false)}
                onKeyDown={e => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setShowUserList(true); setActiveUserIndex(index => Math.max(0, Math.min(suggestions.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))) }
                  if (e.key === "Escape") { e.preventDefault(); setShowUserList(false) }
                  if (e.key === "Enter" && showUserList) { e.preventDefault(); if (suggestions[activeUserIndex]) chooseUser(suggestions[activeUserIndex]) }
                }}
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setShowUserList(true); setActiveUserIndex(-1) }}
                onFocus={() => setShowUserList(true)}
                disabled={users.length === 0}
              />
              {showUserList && users.length > 0 && (
                <div className={styles.userDropdown} id="invoice-user-options" role="listbox" aria-label="Matching users">
                  {filteredUsers.length === 0 ? (
                    <p className={styles.noUsers}>No users match &quot;{userSearch}&quot;</p>
                  ) : (
                    suggestions.map((u, index) => (
                      <button
                        type="button" role="option" tabIndex={-1} id={`invoice-user-${u.id}`} aria-selected={activeUserIndex === index}
                        style={activeUserIndex === index ? { background: "var(--slate-lt)" } : undefined}
                        onClick={() => chooseUser(u)}
                        key={u.id}
                        className={styles.userOption}
                        onMouseDown={(e) => {
                          // onMouseDown fires before blur — prevents the dropdown
                          // from closing before the click is registered
                          e.preventDefault()

                        }}
                      >
                        <div className={styles.userAvatarSm}>
                          {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.optName}>{u.full_name}</p>
                          <p className={styles.optMeta}>{userDetails(u)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {filteredUsers.length > 10 && <p className={styles.hint}>Showing the first 10 matches. Type more to narrow your search.</p>}
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
            <div>
              <PermissionGate action="invoice-categories.create"><button type="button" className={styles.newCategoryBtn} onClick={openCategoryModal}>
              + New Category
            </button></PermissionGate>
            <span> </span>
            <button type="button" className={styles.addItemBtn} onClick={() => setItems(p => [...p, emptyItem()])}>
              + Add Item
            </button>
            </div>
            
          </div>

          <div className={styles.itemsHead}>
            <span>Category</span><span>Description</span><span>Amount (₹)</span><span>Discount (₹)</span><span>Net (₹)</span><span></span>
          </div>

          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <select
                className={styles.input}
                value={item.category_id}
                onChange={e => setItem(i, "category_id", Number(e.target.value))}
              >
                <option value={0}>Select Category</option>
                {categories.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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

      {showCategoryModal && (
        <div className={styles.modalOverlay} onClick={() => !creatingCategory && setShowCategoryModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>New Category</h3>
            <p className={styles.modalSub}>Create a payment type (e.g. Tuition Fee, Bus Fee) without leaving this page.</p>

            <div className={styles.modalField}>
              <label className={styles.label}>Name *</label>
              <input
                className={styles.input}
                placeholder="e.g. Tuition Fee"
                value={newCategory.name}
                onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))}
                autoFocus
              />
            </div>

            {categoryError && <div className={styles.error}>{categoryError}</div>}

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowCategoryModal(false)} disabled={creatingCategory}>
                Cancel
              </button>
              <button type="button" className={styles.submitBtn} onClick={handleCreateCategory} disabled={creatingCategory}>
                {creatingCategory ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
