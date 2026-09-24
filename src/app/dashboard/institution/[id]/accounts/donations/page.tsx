"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { Receipt } from "@/types/accounting"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "../receipts/receipts.module.css"
import DonationForm from "./DonationForm"
import modalStyles from "./donations.module.css"

export default function DonationsPage() {
  const { id } = useParams()
  const dialog = useRef<HTMLDialogElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => { if (showForm) dialog.current?.showModal(); else dialog.current?.close() }, [showForm])
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
      // Donation receipts carry the donor snapshot, including existing users and Anonymous.
      if (active) setReceipts(all.filter(receipt => Boolean(receipt.donor_name)))
    }
    load().catch(err => {
      if (active) setError(err instanceof Error ? err.message : "Failed to load receipts")
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, revision])

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
      <dialog ref={dialog} className={modalStyles.dialog} aria-label="Receive Donation" onCancel={event => event.preventDefault()}>
        {showForm && <DonationForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); setRevision(value => value + 1) }} />}
      </dialog>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Donation</h1>
          <p className={styles.sub}>{receipts.length} donations recorded</p>
        </div>
        <PermissionGate action="receipts.create"><button type="button" className={styles.createBtn} onClick={() => setShowForm(true)}>+ Receive Donation</button></PermissionGate>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search by receipt number or donor..." value={search} onChange={e => setSearch(e.target.value)} />
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
          No donations match the selected filters.

        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Receipt No</th><th>Party</th><th>Date</th><th>Method</th><th>Amount Paid</th><th>Notes</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><Link className={styles.receiptNo} href={`/dashboard/institution/${id}/accounts/receipts/${r.id}`}>{r.receipt_number}</Link></td>
                  <td><PartyBadge donorName={r.donor_name} userId={r.user_id} compact /></td>
                  <td>{new Date(r.receipt_date).toLocaleDateString()}</td>

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
