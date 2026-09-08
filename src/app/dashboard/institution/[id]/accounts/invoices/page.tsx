"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { Invoice } from "@/types/accounting"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./page.module.css"

export default function InvoicesPage() {
  const { id } = useParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState("all")

  useEffect(() => {
    accountingApi.getInvoicesByInstitution(Number(id)).then(setInvoices).finally(() => setLoading(false))
  }, [id])

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.admission_number ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || inv.status === filter
    return matchSearch && matchFilter
  })

  const statusStyle = (s: string) =>
    s === "paid" ? styles.statusPaid :
    s === "partially_paid" ? styles.statusPartial :
    s === "cancelled" ? styles.statusCancelled : styles.statusUnpaid

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.sub}>{invoices.length} total invoices</p>
        </div>
        <Link href={`/dashboard/institution/${id}/accounts/invoices/create`} className={styles.createBtn}>
          + Create Invoice
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search invoices..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filters}>
          {["all","unpaid","partially_paid","paid","cancelled"].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading invoices...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          No invoices found.
          <Link href={`/dashboard/institution/${id}/accounts/invoices/create`} className={styles.createBtn}>
            + Create Invoice
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Name</th>
                <th>Admission Number</th>
                <th>Description</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.full_name}</td>
                  <td>{inv.admission_number}</td>
                  <td>{inv.description}</td>
                  <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                  <td className={styles.amount}>₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td className={styles.paid}>₹{Number(inv.paid_amount).toLocaleString()}</td>
                  <td className={styles.balance}>₹{Number(inv.balance_due).toLocaleString()}</td>
                  <td>
                    <span className={`${styles.status} ${statusStyle(inv.status)}`}>
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/institution/${id}/accounts/invoices/${inv.id}`} className={styles.viewBtn}>
                      View →
                    </Link>
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
