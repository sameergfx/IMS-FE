"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { Receipt } from "@/types/accounting"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./receipts.module.css"

export default function ReceiptsPage() {
  const { id } = useParams()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")

  useEffect(() => {
    accountingApi.getReceiptsByInstitution(Number(id)).then(setReceipts).finally(() => setLoading(false))
  }, [id])

  const filtered = receipts.filter(r =>
    r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
    String(r.user_id).includes(search)
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Receipts</h1>
          <p className={styles.sub}>{receipts.length} payments recorded — receipts are generated from Invoices</p>
        </div>
        <Link href={`/dashboard/institution/${id}/accounts/invoices`} className={styles.createBtn}>
          Go to Invoices →
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search by receipt no or user..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className={styles.state}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          No receipts yet. Receipts are created when a payment is recorded against an invoice.
          <Link href={`/dashboard/institution/${id}/accounts/invoices`} className={styles.createBtn}>Go to Invoices</Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Receipt No</th><th>Party</th><th>Date</th><th>Invoice</th><th>Method</th><th>Amount Paid</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><span className={styles.receiptNo}>{r.receipt_number}</span></td>
                  <td><PartyBadge userId={r.user_id} compact /></td>
                  <td>{new Date(r.receipt_date).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/dashboard/institution/${id}/accounts/invoices/${r.invoice_id}`} className={styles.invLink}>
                      Invoice #{r.invoice_id}
                    </Link>
                  </td>
                  <td><span className={styles.payBadge}>{r.payment_method.replace("_", " ")}</span></td>
                  <td className={styles.amount}>₹{Number(r.amount_paid).toLocaleString()}</td>
                  <td>
                    <span className={`${styles.status} ${r.status === "active" ? styles.statusActive : styles.statusCancelled}`}>{r.status}</span>
                  </td>
                  <td>
                    <Link href={`/dashboard/institution/${id}/accounts/receipts/${r.id}`} className={styles.viewBtn}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
