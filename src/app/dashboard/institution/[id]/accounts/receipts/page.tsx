"use client"
import PermissionGate from "@/components/access/PermissionGate"

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

  const [period, setPeriod] = useState("all")
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    setReceipts([])
    const load = async () => {
      const all: Receipt[] = []
      // The API returns at most one page by default; totals need every receipt.
      for (let skip = 0; active; skip += 100) {
        const page = await accountingApi.getReceiptsByInstitution(Number(id), skip, 100)
        all.push(...page)
        if (page.length < 100) break
      }
      if (active) setReceipts(all)
    }
    load().catch(err => {
      if (active) setError(err instanceof Error ? err.message : "Failed to load receipts")
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const dateError = period === "custom"
    ? (!startDate || !endDate ? "Select both a start and end date."
      : startDate > endDate ? "End date must be on or after start date." : "")
    : period === "monthly" && !month ? "Select a month." : ""

  const filtered = receipts.filter(r => {
    const matchesSearch = r.receipt_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.donor_name || "").toLowerCase().includes(search.toLowerCase()) || String(r.user_id ?? "").includes(search)
    const date = r.receipt_date.slice(0, 10)
    const matchesDate = period === "all" ||
      (period === "today" && date === today) ||
      (period === "monthly" && date.slice(0, 7) === month) ||
      (period === "custom" && date >= startDate && date <= endDate)
    return !dateError && matchesSearch && matchesDate
  })
  const total = filtered.filter(r => r.status === "active")
    .reduce((sum, r) => sum + Math.round(Number(r.amount_paid) * 100), 0) / 100

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Receipts</h1>
          <p className={styles.sub}>{receipts.length} payments recorded — receipts are generated from Invoices</p>
        </div>
        <PermissionGate action="invoices.read"><Link href={`/dashboard/institution/${id}/accounts/invoices`} className={styles.createBtn}>
          Go to Invoices →
        </Link></PermissionGate>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search by receipt no or user..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filters}>
          <label className={styles.dateField}>Period
            <select className={styles.dateInput} value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom date range</option>
            </select>
          </label>
          {period === "monthly" && (
            <label className={styles.dateField}>Month
              <input className={styles.dateInput} type="month" value={month} onChange={e => setMonth(e.target.value)} />
            </label>
          )}
          {period === "custom" && (<>
            <label className={styles.dateField}>From
              <input className={styles.dateInput} type="date" value={startDate} max={endDate || undefined}
                onChange={e => setStartDate(e.target.value)} />
            </label>
            <label className={styles.dateField}>To
              <input className={styles.dateInput} type="date" value={endDate} min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)} />
            </label>
          </>)}
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading...</div>
      ) : error ? (
        <div className={styles.state} role="alert">{error}</div>
      ) : dateError ? (
        <div className={styles.state} role="status">{dateError}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          No receipts match the selected filters.
          <PermissionGate action="invoices.read"><Link href={`/dashboard/institution/${id}/accounts/invoices`} className={styles.createBtn}>Go to Invoices</Link></PermissionGate>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Receipt No</th><th>Party</th><th>Date</th><th>Invoice</th><th>Method</th><th>Amount Paid</th><th>Notes</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><span className={styles.receiptNo}>{r.receipt_number}</span></td>
                  <td><PartyBadge donorName={r.donor_name} userId={r.user_id} compact /></td>
                  <td>{new Date(r.receipt_date).toLocaleDateString()}</td>
                  <td>
                    <PermissionGate action="invoices.read"><Link href={`/dashboard/institution/${id}/accounts/invoices/${r.invoice_id}`} className={styles.invLink}>
                      {r.invoice_number ?? "—"}
                    </Link></PermissionGate>
                  </td>
                  <td><span className={styles.payBadge}>{r.payment_method.replace("_", " ")}</span></td>
                  <td className={styles.amount}>₹{Number(r.amount_paid).toLocaleString()}</td>
                  <td>{r.notes || "-"}</td>
                  <td>
                    <span className={`${styles.status} ${r.status === "active" ? styles.statusActive : styles.statusCancelled}`}>{r.status}</span>
                  </td>
                  <td>
                    <PermissionGate action="receipts.read"><Link href={`/dashboard/institution/${id}/accounts/receipts/${r.id}`} className={styles.viewBtn}>View →</Link></PermissionGate>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && !dateError && (
        <div className={styles.totalBar} aria-live="polite">
          <span>Total received <small>(excluding cancelled receipts)</small></span>
          <span className={styles.totalValue}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      )}
    </div>
  )
}
