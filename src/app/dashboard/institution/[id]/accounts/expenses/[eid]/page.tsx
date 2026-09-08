"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { Expense, Account } from "@/types/accounting"
import styles from "./detail.module.css"

export default function ExpenseDetailPage() {
  const { eid } = useParams()
  const router = useRouter()

  const [expense,   setExpense]   = useState<Expense | null>(null)
  const [account,   setAccount]   = useState<Account | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [reason,     setReason]     = useState("")
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    accountingApi.getExpense(Number(eid)).then(exp => {
      setExpense(exp)
      accountingApi.getAccounts().then(accounts => {
        setAccount(accounts.find(a => a.id === exp.account_id) ?? null)
      }).catch(() => {})
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [eid])

  const handleCancel = async () => {
    if (!reason.trim()) return
    setCancelling(true)
    try {
      const updated = await accountingApi.cancelExpense(Number(eid), reason)
      setExpense(updated)
      setShowCancel(false)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className={styles.state}>Loading expense...</div>
  if (!expense) return <div className={styles.state}>Expense not found.</div>

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
          <h1 className={styles.title}>{expense.expense_number}</h1>
          <span className={`${styles.status} ${expense.status === "active" ? styles.statusActive : styles.statusCancelled}`}>
            {expense.status}
          </span>
        </div>
        {expense.status === "active" && (
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => setShowCancel(true)}>Cancel Expense</button>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.partySection}>
          <p className={styles.partyLabel}>Paid To</p>
          <p className={styles.paidTo}>{expense.paid_to}</p>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Category</span><span className={styles.metaValue}>{account?.name ?? "—"}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Date</span><span className={styles.metaValue}>{new Date(expense.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Payment Method</span><span className={styles.metaValue}>{expense.payment_method.replace("_", " ").toUpperCase()}</span></div>
          {expense.reference_number && <div className={styles.metaItem}><span className={styles.metaLabel}>Reference No</span><span className={styles.metaValue}>{expense.reference_number}</span></div>}
          {expense.bank_name && <div className={styles.metaItem}><span className={styles.metaLabel}>Bank</span><span className={styles.metaValue}>{expense.bank_name}</span></div>}
          {expense.description && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Description</span><span className={styles.metaValue}>{expense.description}</span></div>}
          {expense.notes && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Notes</span><span className={styles.metaValue}>{expense.notes}</span></div>}
        </div>

        <div className={styles.amountPaid}>
          <span>Amount</span>
          <span className={styles.amountValue}>₹{Number(expense.amount).toLocaleString()}</span>
        </div>

        {expense.cancellation_reason && (
          <div className={styles.cancelNote}><strong>Cancelled:</strong> {expense.cancellation_reason}</div>
        )}
      </div>

      {showCancel && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Cancel Expense</h3>
            <p className={styles.modalSub}>This will mark the expense as cancelled and exclude it from totals.</p>
            <textarea className={styles.textarea} placeholder="Reason for cancellation..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
            <div className={styles.modalActions}>
              <button className={styles.modalBack} onClick={() => setShowCancel(false)}>Back</button>
              <button className={styles.modalConfirm} onClick={handleCancel} disabled={cancelling || !reason.trim()}>
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
