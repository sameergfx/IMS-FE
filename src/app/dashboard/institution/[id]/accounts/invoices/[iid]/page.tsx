"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { accountingApi } from "@/lib/api"
import { Invoice, Receipt, PaymentMethod } from "@/types/accounting"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./detail.module.css"

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "upi", "bank_transfer", "cheque", "online"]

export default function InvoiceDetailPage() {
  const { id, iid } = useParams()
  const router = useRouter()

  const [invoice,  setInvoice]  = useState<Invoice | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading,  setLoading]  = useState(true)

  const [showPay,    setShowPay]    = useState(false)
  const [paying,     setPaying]     = useState(false)
  const [payError,   setPayError]   = useState("")
  const [payForm, setPayForm] = useState({
    amount_paid:      "",
    receipt_date:     new Date().toISOString().split("T")[0],
    payment_method:   "cash" as PaymentMethod,
    reference_number: "",
    bank_name:        "",
    notes:            "",
  })

  const load = () => {
    accountingApi.getInvoice(Number(iid)).then(setInvoice)
    accountingApi.getInvoiceReceipts(Number(iid)).then(setReceipts)
  }

  useEffect(() => { load(); setLoading(false) }, [iid])

  const setPayField = (k: string, v: string) => setPayForm(f => ({ ...f, [k]: v }))

  const openPayModal = (full: boolean) => {
    if (!invoice) return
    setPayForm(f => ({ ...f, amount_paid: full ? String(invoice.balance_due) : "" }))
    setPayError("")
    setShowPay(true)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return
    setPayError("")

    const amt = Number(payForm.amount_paid)
    if (!amt || amt <= 0) { setPayError("Enter a valid amount"); return }
    if (amt > invoice.balance_due) { setPayError(`Amount exceeds balance due (₹${invoice.balance_due})`); return }

    setPaying(true)
    try {
      await accountingApi.createReceipt({
        invoice_id:       invoice.id,
        institution_id:   invoice.institution_id,
        user_id:          invoice.user_id,
        receipt_date:     payForm.receipt_date,
        payment_method:   payForm.payment_method,
        amount_paid:      amt,
        reference_number: payForm.reference_number || null,
        bank_name:        payForm.bank_name || null,
        notes:            payForm.notes || null,
        issued_by:        null,
      })
      setShowPay(false)
      load()
    } catch (err: any) {
      setPayError(err.message || "Payment failed")
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className={styles.state}>Loading invoice...</div>
  if (!invoice) return <div className={styles.state}>Invoice not found.</div>

  const statusStyle =
    invoice.status === "paid" ? styles.statusPaid :
    invoice.status === "partially_paid" ? styles.statusPartial :
    invoice.status === "cancelled" ? styles.statusCancelled : styles.statusUnpaid

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
          <h1 className={styles.title}>{invoice.invoice_number}</h1>
          <span className={`${styles.status} ${statusStyle}`}>{invoice.status.replace("_", " ")}</span>
        </div>
        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <div className={styles.headerActions}>
            <button className={styles.partialBtn} onClick={() => openPayModal(false)}>Record Partial Payment</button>
            <button className={styles.payBtn} onClick={() => openPayModal(true)}>Record Full Payment</button>
          </div>
        )}
      </div>

      {/* Invoice card */}
      <div className={styles.card}>
        {/* Party info — full card with name + ref number */}
        <div className={styles.partySection}>
          <p className={styles.partyLabel}>Bill To</p>
          <PartyBadge userId={invoice.user_id} />
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}><span className={styles.metaLabel}>Invoice Date</span><span className={styles.metaValue}>{new Date(invoice.invoice_date).toLocaleDateString()}</span></div>
          {invoice.due_date && <div className={styles.metaItem}><span className={styles.metaLabel}>Due Date</span><span className={styles.metaValue}>{new Date(invoice.due_date).toLocaleDateString()}</span></div>}
          {invoice.academic_year && <div className={styles.metaItem}><span className={styles.metaLabel}>Academic Year</span><span className={styles.metaValue}>{invoice.academic_year}</span></div>}
          {invoice.description && <div className={styles.metaItem} style={{ gridColumn: "1/-1" }}><span className={styles.metaLabel}>Description</span><span className={styles.metaValue}>{invoice.description}</span></div>}
        </div>

        <table className={styles.table}>
          <thead><tr><th>#</th><th>Description</th><th>Amount</th><th>Discount</th><th>Net</th></tr></thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id}>
                <td>{i + 1}</td><td>{item.description}</td>
                <td>₹{Number(item.amount).toLocaleString()}</td>
                <td>{Number(item.discount) > 0 ? `₹${Number(item.discount).toLocaleString()}` : "—"}</td>
                <td className={styles.net}>₹{Number(item.net_amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <div className={styles.totalRow}><span>Subtotal</span><span>₹{Number(invoice.subtotal).toLocaleString()}</span></div>
          {Number(invoice.discount) > 0 && <div className={styles.totalRow}><span>Discount</span><span>− ₹{Number(invoice.discount).toLocaleString()}</span></div>}
          <div className={`${styles.totalRow} ${styles.bold}`}><span>Total Amount</span><span>₹{Number(invoice.total_amount).toLocaleString()}</span></div>
          <div className={`${styles.totalRow} ${styles.greenRow}`}><span>Paid</span><span>₹{Number(invoice.paid_amount).toLocaleString()}</span></div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}><span>Balance Due</span><span>₹{Number(invoice.balance_due).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Payment history */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Payment History ({receipts.length})</h2>
        {receipts.length === 0 ? (
          <p className={styles.noReceipts}>No payments recorded yet.</p>
        ) : (
          <div className={styles.receiptsList}>
            {receipts.map(r => (
              <div key={r.id} className={styles.receiptRow}>
                <div>
                  <p className={styles.receiptNo}>{r.receipt_number}</p>
                  <p className={styles.receiptMeta}>{new Date(r.receipt_date).toLocaleDateString()} · {r.payment_method.replace("_", " ")}</p>
                </div>
                <div className={styles.receiptRight}>
                  <span className={styles.receiptAmount}>₹{Number(r.amount_paid).toLocaleString()}</span>
                  <span className={`${styles.receiptStatus} ${r.status === "active" ? styles.active : styles.cancelled}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {showPay && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Record Payment</h3>
            <p className={styles.modalSub}>Balance due: ₹{Number(invoice.balance_due).toLocaleString()}</p>

            <form onSubmit={handlePay} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label}>Amount Paid *</label>
                <input className={styles.input} type="number" min="0" max={invoice.balance_due} step="0.01"
                  value={payForm.amount_paid} onChange={e => setPayField("amount_paid", e.target.value)} required />
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Payment Date *</label>
                  <input className={styles.input} type="date" value={payForm.receipt_date}
                    onChange={e => setPayField("receipt_date", e.target.value)} required />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Payment Method *</label>
                  <select className={styles.input} value={payForm.payment_method}
                    onChange={e => setPayField("payment_method", e.target.value)}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Reference No</label>
                  <input className={styles.input} placeholder="Cheque / UTR / UPI ref"
                    value={payForm.reference_number} onChange={e => setPayField("reference_number", e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Bank Name</label>
                  <input className={styles.input} placeholder="If applicable"
                    value={payForm.bank_name} onChange={e => setPayField("bank_name", e.target.value)} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Notes</label>
                <input className={styles.input} placeholder="Optional notes"
                  value={payForm.notes} onChange={e => setPayField("notes", e.target.value)} />
              </div>

              {payError && <div className={styles.error}>{payError}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancel} onClick={() => setShowPay(false)}>Cancel</button>
                <button type="submit" className={styles.modalConfirm} disabled={paying}>
                  {paying ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
