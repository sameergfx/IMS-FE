"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { usePermissions } from "@/lib/permissions-context"
import { Invoice, InvoiceCategory, InvoiceUpdate } from "@/types/accounting"
import styles from "../../create/create.module.css"

export default function EditInvoicePage() {
  const { id, iid } = useParams()
  const router = useRouter()
  const { hasPermission, loading: permissionsLoading } = usePermissions()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [categories, setCategories] = useState<InvoiceCategory[]>([])
  const [locked, setLocked] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ invoice_date: "", due_date: "", description: "", academic_year: "", discount: "0" })
  const [items, setItems] = useState<{ category_id: number; description: string; amount: string; discount: string }[]>([])
  useEffect(() => {
    let active = true
    setLoading(true); setError(""); setInvoice(null)
    Promise.all([accountingApi.getInvoice(Number(iid)), accountingApi.getInvoiceReceipts(Number(iid)), accountingApi.getInvoiceCategories()])
      .then(([inv, receipts, cats]) => {
        if (!active) return
        if (inv.institution_id !== Number(id)) throw new Error("Invoice does not belong to this institution")
        if (inv.status === "cancelled") throw new Error("Cancelled invoices cannot be edited")
        setInvoice(inv); setCategories(cats)
        setLocked(Number(inv.paid_amount) > 0 || receipts.length > 0)
        setForm({ invoice_date: inv.invoice_date, due_date: inv.due_date || "", description: inv.description || "", academic_year: inv.academic_year || "", discount: String(inv.discount) })
        setItems(inv.items.map(item => ({ category_id: item.category_id, description: item.description, amount: String(item.amount), discount: String(item.discount) })))
      }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load invoice") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, iid])
  const cents = (value: string) => Math.round(Number(value || 0) * 100)
  const subtotal = items.reduce((sum, item) => sum + cents(item.amount) - cents(item.discount), 0) / 100
  const total = (Math.round(subtotal * 100) - cents(form.discount)) / 100
  const updateItem = (index: number, field: string, value: string | number) => setItems(current => current.map((item, row) => row === index ? { ...item, [field]: value } : item))
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !invoice || !hasPermission("invoices.update")) return
    setError("")
    const payload: InvoiceUpdate = { due_date: form.due_date || null, description: form.description || null, academic_year: form.academic_year || null }
    if (!locked) {
      if (!items.length || total <= 0 || !Number.isFinite(total) || items.some(item => !item.category_id || !item.description.trim() || Number(item.amount) <= 0 || Number(item.discount) < 0 || cents(item.discount) > cents(item.amount))) {
        setError("Check item categories, descriptions, amounts and discounts. The total must be positive."); return
      }
      payload.invoice_date = form.invoice_date
      payload.discount = Number(form.discount)
      payload.items = items.map(item => ({ category_id: item.category_id, category_name: categories.find(category => category.id === item.category_id)?.name || "", description: item.description, amount: Number(item.amount), discount: Number(item.discount) }))
    }
    setSaving(true)
    try {
      await accountingApi.updateInvoice(invoice.id, payload)
      router.push(`/dashboard/institution/${id}/accounts/invoices/${iid}`)
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save invoice") }
    finally { setSaving(false) }
  }
  if (loading || permissionsLoading) return <p>Loading invoice…</p>
  if (!hasPermission("invoices.update")) return <p role="alert">You do not have permission to edit invoices.</p>
  if (!invoice) return <p role="alert">{error || "Invoice not found"}</p>
  return <div className={styles.page}>
    <div className={styles.header}><button className={styles.backBtn} onClick={() => router.back()}>← Back</button><h1 className={styles.title}>Edit {invoice.invoice_number}</h1></div>
    {locked && <p className={styles.hint}>This invoice has receipt history. You can update its due date, description and academic year. Items, amounts and invoice date are locked.</p>}
    <form className={styles.form} onSubmit={save}>
      <div className={styles.card}><h2 className={styles.cardTitle}>Invoice Details</h2><div className={styles.grid2}>
        <label className={styles.field}>Invoice date<input className={styles.input} type="date" required disabled={locked || saving} value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} /></label>
        <label className={styles.field}>Due date<input className={styles.input} type="date" disabled={saving} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></label>
        <label className={styles.field}>Academic year<input className={styles.input} maxLength={20} disabled={saving} value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} /></label>
      </div><label className={styles.field}>Description<input className={styles.input} disabled={saving} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label></div>
      <div className={styles.card}><div className={styles.itemsHeader}><h2 className={styles.cardTitle}>Payment Items</h2>{!locked && <button type="button" className={styles.addItemBtn} disabled={saving || items.length >= 100} onClick={() => setItems([...items, { category_id: 0, description: "", amount: "", discount: "0" }])}>+ Add Item</button>}</div>
        <div className={styles.itemsHead}><span>Category</span><span>Description</span><span>Amount</span><span>Discount</span><span>Net</span><span /></div>
        {items.map((item, index) => <div key={index} className={styles.itemRow}>
          <select aria-label={`Item ${index + 1} category`} className={styles.input} disabled={locked || saving} value={item.category_id} onChange={e => updateItem(index, "category_id", Number(e.target.value))}><option value={0}>Select category</option>{categories.map(category => <option key={category.id} value={category.id} disabled={!category.is_active}>{category.name}{!category.is_active ? " (inactive)" : ""}</option>)}</select>
          <input aria-label={`Item ${index + 1} description`} className={styles.input} required maxLength={300} disabled={locked || saving} value={item.description} onChange={e => updateItem(index, "description", e.target.value)} />
          <input aria-label={`Item ${index + 1} amount`} className={styles.input} type="number" required min="0.01" step="0.01" disabled={locked || saving} value={item.amount} onChange={e => updateItem(index, "amount", e.target.value)} />
          <input aria-label={`Item ${index + 1} discount`} className={styles.input} type="number" min="0" step="0.01" max={item.amount} disabled={locked || saving} value={item.discount} onChange={e => updateItem(index, "discount", e.target.value)} />
          <span className={styles.net}>₹{((cents(item.amount) - cents(item.discount)) / 100).toFixed(2)}</span>
          {!locked && items.length > 1 && <button type="button" className={styles.removeBtn} aria-label={`Remove item ${index + 1}`} disabled={saving} onClick={() => setItems(items.filter((_, row) => row !== index))}>✕</button>}
        </div>)}
      </div>
      <div className={styles.card}><h2 className={styles.cardTitle}>Summary</h2><div className={styles.totals}>
        <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <label className={styles.totalRow}>Overall discount (₹)<input className={styles.input} style={{ width: 120 }} type="number" min="0" step="0.01" disabled={locked || saving} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></label>
        <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
      </div></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button><button className={styles.submitBtn} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button></div>
    </form>
  </div>
}
