"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { Receipt, Invoice } from "@/types/accounting"
import styles from "./detail.module.css"

export default function ReceiptDetailPage() {
  const { id, rid } = useParams()
  const router = useRouter()
  const [receipt,    setReceipt]    = useState<Receipt | null>(null)
  const [invoice,    setInvoice]    = useState<Invoice | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [reason,     setReason]     = useState("")
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    accountingApi.getReceipt(Number(rid)).then(r => {
      setReceipt(r)
      accountingApi.getInvoice(r.invoice_id).then(setInvoice)
    }).finally(() => setLoading(false))
  }, [rid])

  const handleCancel = async () => {
    if (!reason.trim()) return
    setCancelling(true)
    try {
      const updated = await accountingApi.cancelReceipt(Number(rid), reason)
      setReceipt(updated)
      setShowCancel(false)
    } finally { setCancelling(false) }
  }

  if (loading) return <div className={styles.state}>Loading receipt...</div>
  if (!receipt) return <div className={styles.state}>Receipt not found.</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
          <h1 className={styles.title}>{receipt.receipt_number}</h1>
          <span className={`${styles.status} ${receipt.status === "active" ? styles.statusActive : styles.statusCancelled}`}>{receipt.status}</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.printBtn} onClick={() => window.print()}>🖨 Print</button>
          {receipt.status === "active" && (
            <button className={styles.cancelBtn} onClick={() => setShowCancel(true)}>Cancel Receipt</button>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Receipt No</span><span className={styles.metaValue}>{receipt.receipt_number}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Date</span><span className={styles.metaValue}>{new Date(receipt.receipt_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>User ID</span><span className={styles.metaValue}>#{receipt.user_id}</span></div>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Payment Method</span><span className={styles.metaValue}>{receipt.payment_method.replace("_", " ").toUpperCase()}</span></div>
          {receipt.reference_number && <div className={styles.metaItem}><span className={styles.metaLabel}>Reference No</span><span className={styles.metaValue}>{receipt.reference_number}</span></div>}
          {receipt.bank_name && <div className={styles.metaItem}><span className={styles.metaLabel}>Bank</span><span className={styles.metaValue}>{receipt.bank_name}</span></div>}
          {receipt.notes && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Notes</span><span className={styles.metaValue}>{receipt.notes}</span></div>}
        </div>

        <div className={styles.amountPaid}>
          <span>Amount Paid</span>
          <span className={styles.amountValue}>₹{Number(receipt.amount_paid).toLocaleString()}</span>
        </div>

        {invoice && (
          <div className={styles.invoiceLink}>
            <div>
              <p className={styles.invLabel}>Against Invoice</p>
              <p className={styles.invNo}>{invoice.invoice_number}</p>
            </div>
            <div className={styles.invStats}>
              <span>Total: ₹{Number(invoice.total_amount).toLocaleString()}</span>
              <span>Balance: ₹{Number(invoice.balance_due).toLocaleString()}</span>
            </div>
            <Link href={`/dashboard/institution/${id}/accounts/invoices/${invoice.id}`} className={styles.invViewBtn}>
              View Invoice →
            </Link>
          </div>
        )}

        {receipt.cancellation_reason && (
          <div className={styles.cancelNote}><strong>Cancelled:</strong> {receipt.cancellation_reason}</div>
        )}
      </div>

      {showCancel && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Cancel Receipt</h3>
            <p className={styles.modalSub}>This will reverse the payment from the invoice balance.</p>
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
