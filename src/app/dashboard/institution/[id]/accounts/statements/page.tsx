"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { AccountStatement } from "@/types/accounting"
import styles from "./page.module.css"

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const money = (value: string | number) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function StatementsPage() {
  const { id } = useParams()
  const [period, setPeriod] = useState("monthly")
  const [month, setMonth] = useState(() => localDate(new Date()).slice(0, 7))
  const [from, setFrom] = useState(() => localDate(new Date()).slice(0, 8) + "01")
  const [to, setTo] = useState(() => localDate(new Date()))
  const [statement, setStatement] = useState<AccountStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const today = localDate(new Date())
  const startDate = period === "today" ? today : period === "monthly" ? `${month}-01` : from
  const endDate = period === "today" ? today : period === "monthly" && month
    ? localDate(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)) : to
  const valid = Boolean(startDate && endDate && (period !== "monthly" || month) && startDate <= endDate)

  useEffect(() => {
    let active = true
    setStatement(null)
    setError("")
    if (!valid) { setLoading(false); return }
    setLoading(true)
    accountingApi.getStatement(Number(id), startDate, endDate)
      .then(data => { if (active) setStatement(data) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Failed to load statement") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, startDate, endDate, valid])

  // Never display/export the previous institution or date range while a new request starts.
  const current = statement?.institution_id === Number(id) && statement.start_date === startDate && statement.end_date === endDate ? statement : null
  const exportCsv = () => {
    if (!current) return
    const rows: (string | number | null)[][] = [
      ["Institution", current.institution_name], ["From", current.start_date, "To", current.end_date],
      ["Opening net balance", current.opening_balance],
      ["Date", "Type", "Number", "Party", "Invoice", "Category", "Description", "Received", "Spent", "Balance"],
      ...current.entries.map(entry => [entry.date, entry.kind, entry.number, entry.party, entry.invoice_number, entry.category, entry.description, entry.money_in, entry.money_out, entry.balance]),
      ["Total received", current.total_receipts], ["Total spent", current.total_expenses],
      ["Closing net balance", current.closing_balance],
    ]
    const cell = (value: string | number | null) => {
      let text = String(value ?? "")
      if (/^[\s]*[=+@-]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = "'" + text
      return `"${text.replace(/"/g, '""')}"`
    }
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `statement-${id}-${current.start_date}-${current.end_date}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Statement</h1><p className={styles.sub}>Institution receipts and expenses</p></div>
        <button className={styles.button} onClick={exportCsv} disabled={!valid || loading || !current}>Export CSV</button>
      </div>
      <div className={styles.filters}>
        <label>Period<select value={period} onChange={event => setPeriod(event.target.value)}>
          <option value="today">Today</option><option value="monthly">Monthly</option><option value="custom">Custom date range</option>
        </select></label>
        {period === "monthly" && <label>Month<input type="month" value={month} onChange={event => setMonth(event.target.value)} /></label>}
        {period === "custom" && <>
          <label>From<input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label>
          <label>To<input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>
        </>}
      </div>
      <p className={styles.note}>Balances reflect recorded receipts minus expenses, across all payment methods. Cancelled records are excluded. Opening balance includes transactions before the selected period.</p>
      {!valid ? <div className={styles.state} role="alert">Select a valid date range; the end date must be on or after the start date.</div>
        : loading ? <div className={styles.state}>Loading statement...</div>
        : error ? <div className={styles.state} role="alert">{error}</div>
        : current && <>
          <h2 className={styles.institution}>{current.institution_name}</h2>
          <p className={styles.sub}>{current.start_date} to {current.end_date} · {current.entries.length} transactions</p>
          <div className={styles.summary}>
            <div><span>Opening net balance</span><strong>{money(current.opening_balance)}</strong></div>
            <div><span>Total received</span><strong>{money(current.total_receipts)}</strong></div>
            <div><span>Total spent</span><strong>{money(current.total_expenses)}</strong></div>
            <div><span>Closing net balance</span><strong>{money(current.closing_balance)}</strong></div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Date</th><th>Type</th><th>Number</th><th>Party / Paid To</th><th>Invoice / Category</th><th>Description</th><th>Received</th><th>Spent</th><th>Balance</th></tr></thead>
              <tbody>
                <tr><td colSpan={8}>Opening net balance</td><td className={styles.amount}>{money(current.opening_balance)}</td></tr>
                {current.entries.map(entry => <tr key={`${entry.kind}-${entry.id}`}>
                  <td>{entry.date}</td><td>{entry.kind === "receipt" ? "Receipt" : "Expense"}</td>
                  <td><Link href={`/dashboard/institution/${id}/accounts/${entry.kind === "receipt" ? "receipts" : "expenses"}/${entry.id}`}>{entry.number}</Link></td>
                  <td>{entry.party || "—"}</td>
                  <td>{entry.invoice_number && entry.invoice_id ? <PermissionGate action="invoices.read"><Link href={`/dashboard/institution/${id}/accounts/invoices/${entry.invoice_id}`}>{entry.invoice_number}</Link></PermissionGate> : entry.category || "—"}</td>
                  <td>{entry.description || "—"}</td><td className={styles.amount}>{money(entry.money_in)}</td><td className={styles.amount}>{money(entry.money_out)}</td><td className={styles.amount}>{money(entry.balance)}</td>
                </tr>)}
                {!current.entries.length && <tr><td colSpan={9}>No transactions in this period.</td></tr>}
              </tbody>
              <tfoot><tr><td colSpan={6}>Closing net balance</td><td className={styles.amount}>{money(current.total_receipts)}</td><td className={styles.amount}>{money(current.total_expenses)}</td><td className={styles.amount}>{money(current.closing_balance)}</td></tr></tfoot>
            </table>
          </div>
        </>}
    </div>
  )
}
