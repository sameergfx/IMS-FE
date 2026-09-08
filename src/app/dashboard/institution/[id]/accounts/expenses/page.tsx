"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { Expense, Account } from "@/types/accounting"
import styles from "./page.module.css"

export default function ExpensesPage() {
  const { id } = useParams()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [filter,   setFilter]   = useState("all")

  useEffect(() => {
    accountingApi.getExpensesByInstitution(Number(id)).then(setExpenses).finally(() => setLoading(false))
    accountingApi.getAccounts().then(setAccounts).catch(() => {})
  }, [id])

  const accountName = (accountId: number) => accounts.find(a => a.id === accountId)?.name ?? "—"

  const filtered = expenses.filter(exp => {
    const matchSearch = exp.expense_number.toLowerCase().includes(search.toLowerCase()) ||
      exp.paid_to.toLowerCase().includes(search.toLowerCase()) ||
      (exp.description ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || exp.status === filter
    return matchSearch && matchFilter
  })

  const total = filtered.reduce((s, e) => s + (e.status === "active" ? Number(e.amount) : 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
          <p className={styles.sub}>{expenses.length} total expenses</p>
        </div>
        <Link href={`/dashboard/institution/${id}/accounts/expenses/create`} className={styles.createBtn}>
          + Record Expense
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search expenses..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className={styles.filters}>
          {["all", "active", "cancelled"].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.state}>Loading expenses...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          No expenses found.
          <Link href={`/dashboard/institution/${id}/accounts/expenses/create`} className={styles.createBtn}>
            + Record Expense
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expense No</th>
                  <th>Category</th>
                  <th>Paid To</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id}>
                    <td><span className={styles.expNo}>{exp.expense_number}</span></td>
                    <td>{accountName(exp.account_id)}</td>
                    <td className={styles.desc}>{exp.paid_to}</td>
                    <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className={styles.method}>{exp.payment_method.replace("_", " ")}</td>
                    <td className={styles.amount}>₹{Number(exp.amount).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.status} ${exp.status === "active" ? styles.statusActive : styles.statusCancelled}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/dashboard/institution/${id}/accounts/expenses/${exp.id}`} className={styles.viewBtn}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.totalBar}>
            <span>Total (active)</span>
            <span className={styles.totalValue}>₹{total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}
