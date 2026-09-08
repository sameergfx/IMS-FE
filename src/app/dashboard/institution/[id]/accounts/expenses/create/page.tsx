"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { Account, PaymentMethod } from "@/types/accounting"
import styles from "./create.module.css"

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "upi", "bank_transfer", "cheque", "online"]

export default function CreateExpensePage() {
  const { id } = useParams()
  const router = useRouter()

  const [accounts,   setAccounts]   = useState<Account[]>([])
  const [loadError,  setLoadError]  = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")

  const [form, setForm] = useState({
    account_id:       0,
    paid_to:          "",
    expense_date:     new Date().toISOString().split("T")[0],
    payment_method:   "cash" as PaymentMethod,
    amount:           "",
    reference_number: "",
    bank_name:        "",
    description:      "",
    notes:            "",
  })

  useEffect(() => {
    accountingApi.getAccounts()
      .then(data => setAccounts(data))
      .catch(err => setLoadError(`Payment types: ${err.message}.`))
  }, [])

  const setField = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.account_id)       { setError("Select an expense category"); return }
    if (!form.paid_to.trim())   { setError("Enter who was paid"); return }
    if (!form.amount || Number(form.amount) <= 0) { setError("Enter an amount greater than zero"); return }

    setSubmitting(true)
    try {
      const expense = await accountingApi.createExpense({
        institution_id:   Number(id),
        account_id:       Number(form.account_id),
        expense_date:     form.expense_date,
        paid_to:          form.paid_to,
        payment_method:   form.payment_method,
        amount:           Number(form.amount),
        reference_number: form.reference_number || null,
        bank_name:        form.bank_name || null,
        description:      form.description || null,
        notes:            form.notes || null,
        issued_by:        null,
      })
      router.push(`/dashboard/institution/${id}/accounts/expenses/${expense.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to record expense")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>Record Expense</h1>
        <p className={styles.sub}>Log a new expense for this institution</p>
      </div>

      {loadError && <div className={styles.loadError}>⚠ {loadError}</div>}

      {accounts.length === 0 && !loadError && (
        <div className={styles.loadError}>
          ⚠ No expense categories found. Go to <strong>Accounts → Add Account</strong> first
          (e.g. Salaries, Utilities, Maintenance) before recording an expense.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Expense Details</h2>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Category *</label>
              <select className={styles.input} value={form.account_id}
                onChange={e => setField("account_id", Number(e.target.value))}>
                <option value={0}>Select category</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
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
              <label className={styles.label}>Amount (₹) *</label>
              <input className={styles.input} type="number" min="0" step="0.01" placeholder="0.00"
                value={form.amount} onChange={e => setField("amount", e.target.value)} />
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

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Recording..." : "Record Expense"}
          </button>
        </div>
      </form>
    </div>
  )
}
