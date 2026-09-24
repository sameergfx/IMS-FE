"use client"
import PermissionGate from "@/components/access/PermissionGate"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { Expense } from "@/types/accounting"
import styles from "./detail.module.css"

export default function ExpenseDetailPage() {
  const { id, eid } = useParams()
  const router = useRouter()

  const [expense,   setExpense]   = useState<Expense | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [reason,     setReason]     = useState("")
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    accountingApi.getExpense(Number(eid)).then(exp => {
      setExpense(exp)
    }).catch(() => setExpense(null)).finally(() => setLoading(false))
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
        {expense.status === "active" && !expense.assistance_application_id && (
          <div className={styles.actions}>
            <PermissionGate action="expenses.update"><Link href={`/dashboard/institution/${id}/accounts/expenses/${eid}/edit`} className={styles.editBtn}>Edit Expense</Link></PermissionGate>
            <PermissionGate action="expenses.cancel"><button className={styles.cancelBtn} onClick={() => setShowCancel(true)}>Cancel Expense</button></PermissionGate>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.partySection}>
          <p className={styles.partyLabel}>Paid To</p>
          <p className={styles.paidTo}>{expense.paid_to}</p>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Category</span><span className={styles.metaValue}>{expense.items.length ? [...new Set(expense.items.map(item => item.category?.name || "Uncategorized"))].join(", ") : expense.category?.name ?? "—"}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Date</span><span className={styles.metaValue}>{new Date(expense.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Payment Method</span><span className={styles.metaValue}>{expense.payment_method?.replace("_", " ").toUpperCase() ?? "—"}</span></div>
          {expense.reference_number && <div className={styles.metaItem}><span className={styles.metaLabel}>Reference No</span><span className={styles.metaValue}>{expense.reference_number}</span></div>}
          {expense.bank_name && <div className={styles.metaItem}><span className={styles.metaLabel}>Bank</span><span className={styles.metaValue}>{expense.bank_name}</span></div>}
          {expense.description && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Description</span><span className={styles.metaValue}>{expense.description}</span></div>}
          {expense.notes && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Notes</span><span className={styles.metaValue}>{expense.notes}</span></div>}
        </div>

        {expense.items.length > 0 && <div style={{ overflowX: "auto" }}><table className={styles.itemsTable}>
          <thead><tr><th>#</th><th>Category</th><th>Description</th><th>Amount</th><th>Discount</th><th>Net</th></tr></thead>
          <tbody>{expense.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.category?.name ?? "—"}</td><td>{item.description}</td><td>₹{Number(item.amount).toFixed(2)}</td><td>₹{Number(item.discount).toFixed(2)}</td><td>₹{Number(item.net_amount).toFixed(2)}</td></tr>)}</tbody>
        </table></div>}

        <div className={styles.amountPaid}>
          <span>Amount</span>
          <span className={styles.amountValue}>₹{Number(expense.total_amount).toLocaleString()}</span>
        </div>

        {expense.assistance_application_id && <p>This payment is managed through its assistance application. <PermissionGate action="applications.read"><Link href={`/dashboard/institution/${id}/applications?application=${expense.assistance_application_id}`}>Open application</Link></PermissionGate></p>}
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
              <PermissionGate action="expenses.cancel"><button className={styles.modalConfirm} onClick={handleCancel} disabled={cancelling || !reason.trim()}>
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button></PermissionGate>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
