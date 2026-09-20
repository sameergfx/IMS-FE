"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { institutionUserTypes } from "@/lib/institution-types"
import { institutionsApi } from "@/lib/api"
import { InstitutionDashboardData } from "@/types/dashboard"
import styles from "./page.module.css"

const money = (value: string | number) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function InstitutionDashboard() {
  const { id } = useParams()
  const { selectedInstitution: inst } = useAuth()
  const [data, setData] = useState<InstitutionDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const base = `/dashboard/institution/${id}`

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    setData(null)
    institutionsApi.getDashboard(Number(id), today)
      .then(result => { if (active) setData(result) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Failed to load dashboard") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, today, refresh])

  if (!inst || inst.id !== Number(id)) return <div className={styles.state}>Loading institution...</div>
  const current = data?.institution_id === Number(id) ? data : null
  const stats = current ? [
    { label: "Users", value: current.total_users.toLocaleString(), note: `${current.active_users} active`, href: `${base}/users` },
    { label: "Invoices", value: current.invoice_count.toLocaleString(), note: "Excluding cancelled", href: `${base}/accounts/invoices` },
    { label: "Receipts", value: current.receipt_count.toLocaleString(), note: "Active receipts · all dates", href: `${base}/accounts/receipts` },
    { label: "Expenses", value: current.expense_count.toLocaleString(), note: "Active expenses · all dates", href: `${base}/accounts/expenses` },
  ] : []

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.instBadge}>
          <div className={styles.instInitials}>{inst.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
          <div><h1 className={styles.title}>{inst.name}</h1><p className={styles.sub}>{inst.place ? `${inst.place} · ` : ""}Overview · {today}</p></div>
        </div>
        <button className={styles.refreshBtn} disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
      </div>
      <div className={styles.quickLinks}>
        <PermissionGate action="users.create"><Link href={`${base}/users/create`}>+ Add User</Link></PermissionGate>
        <PermissionGate action="invoices.create"><Link href={`${base}/accounts/invoices/create`}>+ Create Invoice</Link></PermissionGate>
        <PermissionGate action="expenses.create"><Link href={`${base}/accounts/expenses/create`}>+ Record Expense</Link></PermissionGate>
        <PermissionGate action="statements.read"><Link href={`${base}/accounts/statements`}>View Statement →</Link></PermissionGate>
      </div>
      {loading ? <div className={styles.state}>Loading dashboard...</div>
        : error ? <div className={styles.state} role="alert">{error} <button className={styles.refreshBtn} onClick={() => setRefresh(value => value + 1)}>Retry</button></div>
        : current && <>
          <div className={styles.statsGrid}>
            {stats.map(stat => <Link key={stat.label} href={stat.href} className={styles.statCard}>
              <div><p className={styles.statLabel}>{stat.label}</p><p className={styles.statValue}>{stat.value}</p><p className={styles.sub}>{stat.note}</p></div>
            </Link>)}
          </div>
          <div className={styles.userTypes}>
            {([['student', 'Students'], ['teacher', 'Teachers'], ['staff', 'Staff'], ['member', 'Members']] as const).filter(([type]) => institutionUserTypes(inst.institution_type).includes(type)).map(([type, label]) =>
              <Link key={type} href={`${base}/users/${type}`}>{label} <strong>{current.users_by_type[type] ?? 0}</strong></Link>)}
            <span>Admins <strong>{current.users_by_type.admin ?? 0}</strong></span>
          </div>
          <h2 className={styles.sectionTitle}>This month <span>{current.month_start} to {current.as_of}</span></h2>
          <div className={styles.financeGrid}>
            <PermissionGate action="receipts.read"><Link className={styles.statCard} href={`${base}/accounts/receipts`}><div><p className={styles.statLabel}>Received</p><p className={styles.statValue}>{money(current.month_receipts)}</p></div></Link></PermissionGate>
            <PermissionGate action="expenses.read"><Link className={styles.statCard} href={`${base}/accounts/expenses`}><div><p className={styles.statLabel}>Spent</p><p className={styles.statValue}>{money(current.month_expenses)}</p></div></Link></PermissionGate>
            <PermissionGate action="statements.read"><Link className={styles.statCard} href={`${base}/accounts/statements`}><div><p className={styles.statLabel}>Net receipts minus expenses</p><p className={styles.statValue}>{money(current.month_net)}</p></div></Link></PermissionGate>
          </div>
          <p className={styles.note}>Includes all payment methods. Cancelled receipts and expenses are excluded.</p>
          <div className={styles.balanceGrid}>
            <PermissionGate action="invoices.read"><Link className={styles.infoCard} href={`${base}/accounts/invoices`}><p className={styles.statLabel}>Outstanding invoices · all dates</p><p className={styles.statValue}>{money(current.outstanding_amount)}</p><p className={styles.sub}>{current.outstanding_count} invoices with a balance due</p></Link></PermissionGate>
            <PermissionGate action="invoices.read"><Link className={styles.infoCard} href={`${base}/accounts/invoices`}><p className={styles.statLabel}>Overdue invoices</p><p className={styles.statValue}>{money(current.overdue_amount)}</p><p className={styles.sub}>{current.overdue_count} invoices due before {today} · included in outstanding</p></Link></PermissionGate>
          </div>
          <div className={styles.infoCard}>
            <h2 className={styles.cardTitle}>Recent transactions</h2>
            {current.recent_transactions.length === 0 ? <p className={styles.sub}>No receipts or expenses recorded yet.</p> :
              <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th>Date</th><th>Type</th><th>Number</th><th>Party / Paid To</th><th>Amount</th></tr></thead>
                <tbody>{current.recent_transactions.map(row => <tr key={`${row.kind}-${row.id}`}>
                  <td>{row.date}</td><td>{row.kind === "receipt" ? "Receipt" : "Expense"}</td>
                  <td><Link href={`${base}/accounts/${row.kind === "receipt" ? "receipts" : "expenses"}/${row.id}`}>{row.number}</Link></td>
                  <td>{row.party || "—"}</td><td className={styles.amount}>{row.kind === "receipt" ? "+" : "−"}{money(row.amount)}</td>
                </tr>)}</tbody>
              </table></div>}
          </div>
        </>}
      {(inst.phone || inst.email || inst.address || inst.bank_name) && <div className={styles.infoCard}>
        <h2 className={styles.cardTitle}>Institution Info</h2>
        <div className={styles.infoGrid}>
          {inst.phone && <div className={styles.infoItem}><span className={styles.infoLabel}>Phone</span><span>{inst.phone}</span></div>}
          {inst.email && <div className={styles.infoItem}><span className={styles.infoLabel}>Email</span><span>{inst.email}</span></div>}
          {inst.address && <div className={styles.infoItem}><span className={styles.infoLabel}>Address</span><span>{inst.address}</span></div>}
          {inst.bank_name && <div className={styles.infoItem}><span className={styles.infoLabel}>Bank</span><span>{inst.bank_name}</span></div>}
        </div>
      </div>}
    </div>
  )
}
