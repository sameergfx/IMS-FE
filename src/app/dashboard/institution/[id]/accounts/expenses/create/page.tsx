"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { ExpenseCategory, PaymentMethod } from "@/types/accounting"
import styles from "./create.module.css"

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "upi", "bank_transfer", "cheque", "online"]

export default function CreateExpensePage() {
  const { id, eid } = useParams()
  const editing = Boolean(eid)
  const [loadingExpense, setLoadingExpense] = useState(Boolean(eid))
  const [editError, setEditError] = useState("")
  const router = useRouter()

  const [categories,   setCategories]   = useState<ExpenseCategory[]>([])
  const [loadError,  setLoadError]  = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")

  const [items, setItems] = useState([{ category_id: 0, description: "", amount: "", discount: "" }])
  const [categoryRow, setCategoryRow] = useState(0)
  const updateItem = (index: number, key: string, value: string | number) =>
    setItems(current => current.map((item, row) => row === index ? { ...item, [key]: value } : item))
  const cents = (value: string) => Math.round(Number(value || 0) * 100)
  const subtotal = items.reduce((sum, item) => sum + cents(item.amount), 0) / 100
  const discount = items.reduce((sum, item) => sum + cents(item.discount), 0) / 100
  const total = Math.round((subtotal - discount) * 100) / 100

  const categoryDialog = useRef<HTMLDialogElement>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState("")
  const [newCategory, setNewCategory] = useState({ name: "", code: "" })

  const openCategoryModal = (row: number) => {
    setCategoryRow(row)
    setCategoryError("")
    setNewCategory({ name: "", code: "" })
    categoryDialog.current?.showModal()
  }

  const handleCreateCategory = async (event: React.FormEvent) => {
    event.preventDefault()
    if (creatingCategory) return
    setCategoryError("")
    const name = newCategory.name.trim()
    const code = newCategory.code.trim()
    if (!name || !code) {
      setCategoryError("Category name and code are required")
      return
    }
    setCreatingCategory(true)
    try {
      const category = await accountingApi.createExpenseCategory({ name, code, is_active: true })
      setCategories(current => [...current.filter(item => item.id !== category.id), category])
      updateItem(categoryRow, "category_id", category.id)
      categoryDialog.current?.close()
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to create category")
    } finally {
      setCreatingCategory(false)
    }
  }

  const [form, setForm] = useState({
    paid_to:          "",
    expense_date:     new Date().toISOString().split("T")[0],
    payment_method:   "cash" as PaymentMethod,
    reference_number: "",
    bank_name:        "",
    description:      "",
    notes:            "",
  })

  useEffect(() => {
    accountingApi.getExpenseCategories()
      .then(data => setCategories(data.filter(category => category.is_active)))
      .catch(err => setLoadError(`Expense categories: ${err.message}.`))
  }, [])

  useEffect(() => {
    if (!eid) return
    let active = true
    setLoadingExpense(true); setEditError("")
    accountingApi.getExpense(Number(eid)).then(expense => {
      if (!active) return
      if (expense.institution_id !== Number(id)) throw new Error("Expense does not belong to this institution")
      if (expense.status === "cancelled") throw new Error("Cancelled expenses cannot be edited")
      setForm({ paid_to: expense.paid_to || "", expense_date: expense.expense_date,
        payment_method: expense.payment_method || "cash", reference_number: expense.reference_number || "",
        bank_name: expense.bank_name || "", description: expense.description || "", notes: expense.notes || "" })
      setItems(expense.items.length ? expense.items.map(item => ({ category_id: item.category_id || expense.category_id || 0,
        description: item.description, amount: String(item.amount), discount: String(item.discount || 0) })) :
        [{ category_id: expense.category_id || 0, description: expense.description || "Expense", amount: String(expense.total_amount), discount: "0" }])
    }).catch(err => { if (active) setEditError(err instanceof Error ? err.message : "Could not load expense") })
      .finally(() => { if (active) setLoadingExpense(false) })
    return () => { active = false }
  }, [eid, id])

  const setField = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (submitting || loadingExpense || editError) return
    if (!items.length || items.some(item => !item.category_id || !item.description.trim() || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0 || !Number.isFinite(Number(item.discount)) || Number(item.discount) < 0 || cents(item.discount) > cents(item.amount))) {
      setError("Each item needs a category, description, positive amount and valid discount."); return
    }
    if (total <= 0) { setError("Expense total must be greater than zero"); return }
    if (!form.paid_to.trim())   { setError("Enter who was paid"); return }

    setSubmitting(true)
    try {
      const payload = {
        institution_id:   Number(id),
        expense_date:     form.expense_date,
        paid_to:          form.paid_to,
        payment_method:   form.payment_method,
        items: items.map(item => ({ category_id: item.category_id, description: item.description.trim(), amount: Number(item.amount), discount: Number(item.discount || 0) })),
        reference_number: form.reference_number || null,
        bank_name:        form.bank_name || null,
        description:      form.description || null,
        notes:            form.notes || null,
      }
      const expense = editing ? await accountingApi.updateExpense(Number(eid), payload) : await accountingApi.createExpense(payload)
      router.push(`/dashboard/institution/${id}/accounts/expenses/${expense.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to record expense")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExpense) return <div className={styles.page}>Loading expense…</div>
  if (editError) return <div className={styles.page} role="alert">{editError}</div>

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>{editing ? "Edit Expense" : "Record Expense"}</h1>
        <p className={styles.sub}>{editing ? "Update expense details and items" : "Log a new expense for this institution"}</p>
      </div>

      {loadError && <div className={styles.loadError}>⚠ {loadError}</div>}

      {categories.length === 0 && !loadError && (
        <div className={styles.loadError}>
          ⚠ No expense categories found. Use + New Category below
          (e.g. Salaries, Utilities, Maintenance) before recording an expense.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Expense Details</h2>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Paid To *</label>
              <input className={styles.input} placeholder="Vendor / payee name"
                value={form.paid_to} onChange={e => setField("paid_to", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Expense Date *</label>
              <input className={styles.input} type="date"
                value={form.expense_date} onChange={e => setField("expense_date", e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Payment Method *</label>
              <select className={styles.input} value={form.payment_method}
                onChange={e => setField("payment_method", e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Reference No</label>
              <input className={styles.input} placeholder="Cheque / UTR / UPI ref"
                value={form.reference_number} onChange={e => setField("reference_number", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Bank Name</label>
              <input className={styles.input} placeholder="If applicable"
                value={form.bank_name} onChange={e => setField("bank_name", e.target.value)} />
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: "1rem" }}>
            <label className={styles.label}>Description</label>
            <input className={styles.input} placeholder="e.g. June electricity bill"
              value={form.description} onChange={e => setField("description", e.target.value)} />
          </div>

          <div className={styles.field} style={{ marginTop: "1rem" }}>
            <label className={styles.label}>Notes</label>
            <input className={styles.input} placeholder="Optional notes"
              value={form.notes} onChange={e => setField("notes", e.target.value)} />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.itemsHeader}>
            <h2 className={styles.cardTitle}>Expense Items</h2>
            <div className={styles.itemsHeaderActions}>
              <PermissionGate action="expense-categories.create"><button type="button" className={styles.newCategoryBtn} onClick={() => openCategoryModal(Math.max(0, items.findIndex(item => !item.category_id)))} disabled={submitting}>+ New Category</button></PermissionGate>
              <button type="button" className={styles.addItemBtn} disabled={submitting || items.length >= 100} onClick={() => setItems(current => [...current, { category_id: 0, description: "", amount: "", discount: "" }])}>+ Add Item</button>
            </div>
          </div>
          <div className={styles.itemsHead}><span>Category</span><span>Description</span><span>Amount (₹)</span><span>Discount (₹)</span><span>Net</span><span /></div>
          {items.map((item, index) => <div className={styles.itemRow} key={index}>
            <select aria-label={`Item ${index + 1} category`} className={styles.input} value={item.category_id} onChange={event => updateItem(index, "category_id", Number(event.target.value))} disabled={submitting}>
              <option value={0}>Select category</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input aria-label={`Item ${index + 1} description`} className={styles.input} placeholder="Description" value={item.description} required maxLength={300} disabled={submitting} onChange={event => updateItem(index, "description", event.target.value)} />
            <input aria-label={`Item ${index + 1} amount`} className={styles.input} placeholder="0.00" type="number" min="0.01" step="0.01" required value={item.amount} disabled={submitting} onChange={event => updateItem(index, "amount", event.target.value)} />
            <input aria-label={`Item ${index + 1} discount`} className={styles.input} placeholder="0.00" type="number" min="0" max={item.amount || undefined} step="0.01" value={item.discount} disabled={submitting} onChange={event => updateItem(index, "discount", event.target.value)} />
            <span className={styles.net}>₹{((cents(item.amount) - cents(item.discount)) / 100).toLocaleString("en-IN")}</span>
            {items.length > 1 && <button type="button" aria-label={`Remove item ${index + 1}`} className={styles.removeBtn} disabled={submitting} onClick={() => setItems(current => current.filter((_, row) => row !== index))}>✕</button>}
          </div>)}
          <p className={styles.hint}>Add a category and description for each expense item. Discounts are deducted from the item amount.</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Summary</h2>
          <div className={styles.totals}>
            <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className={styles.totalRow}><span>Discount</span><span>₹{discount.toFixed(2)}</span></div>
            <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total Amount</span><span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Save Changes" : "Record Expense"}
          </button>
        </div>
      </form>

      <dialog ref={categoryDialog} className={styles.modalBox} aria-labelledby="category-title"
        onCancel={event => { if (creatingCategory) event.preventDefault() }}>
        <form onSubmit={handleCreateCategory}>
          <h3 id="category-title" className={styles.modalTitle}>New Expense Category</h3>
          <p className={styles.modalSub}>Create a category without leaving this page.</p>
          <div className={styles.modalField}>
            <label className={styles.label} htmlFor="category-name">Name *</label>
            <input id="category-name" className={styles.input} placeholder="e.g. Office Supplies"
              value={newCategory.name} maxLength={255} required autoFocus disabled={creatingCategory}
              onChange={event => setNewCategory(current => ({ ...current, name: event.target.value }))} />
          </div>
          <div className={styles.modalField}>
            <label className={styles.label} htmlFor="category-code">Code *</label>
            <input id="category-code" className={styles.input} placeholder="e.g. OFFICE"
              value={newCategory.code} maxLength={50} required disabled={creatingCategory}
              onChange={event => setNewCategory(current => ({ ...current, code: event.target.value }))} />
          </div>
          {categoryError && <div className={styles.error} role="alert">{categoryError}</div>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} disabled={creatingCategory}
              onClick={() => categoryDialog.current?.close()}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={creatingCategory}>
              {creatingCategory ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
