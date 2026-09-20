"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { accountingApi } from "@/lib/api"
import { ExpenseRecord } from "@/types/accounting"
import styles from "./page.module.css"

export default function ExpensesPage() {
  const { id } = useParams()
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setExpenses([])
    accountingApi.getExpensesByInstitution(Number(id))
      .then(data => { if (active) setExpenses(data) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Failed to load expenses") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])


  const filtered = expenses.filter(exp =>
    exp.expense_number.toLowerCase().includes(search.toLowerCase()) ||
    (exp.category?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (exp.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    exp.items.some(item => `${item.category?.name ?? ""} ${item.description}`.toLowerCase().includes(search.toLowerCase()))
  )

  const total = filtered.filter(expense => expense.status !== "cancelled").reduce((sum, expense) => sum + Number(expense.total_amount), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
          <p className={styles.sub}>{expenses.length} total expenses</p>
        </div>
        <PermissionGate action="expenses.create"><Link href={`/dashboard/institution/${id}/accounts/expenses/create`} className={styles.createBtn}>
          + Record Expense
        </Link></PermissionGate>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} placeholder="Search expenses..."
          value={search} onChange={e => setSearch(e.target.value)} />

      </div>

      {loading ? (
        <div className={styles.state}>Loading expenses...</div>
      ) : error ? (
        <div className={styles.state} role="alert">{error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.state}>
          No expenses found.
          <PermissionGate action="expenses.create"><Link href={`/dashboard/institution/${id}/accounts/expenses/create`} className={styles.createBtn}>
            + Record Expense
          </Link></PermissionGate>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expense No</th>
                  <th>Paid To</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => (
                  <tr key={exp.id}>
                    <td><span className={styles.expNo}>{exp.expense_number}</span></td>
                    <td>{exp.paid_to || "—"}</td>
                    <td>{exp.items.length ? [...new Set(exp.items.map(item => item.category?.name || "Uncategorized"))].join(", ") : exp.category?.name ?? "—"}</td>
                    <td className={styles.desc}>{exp.description || exp.items.map(item => item.description).join(", ")}</td>
                    <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className={styles.amount}>₹{Number(exp.total_amount).toLocaleString()}</td>
                    <td>
                      <PermissionGate action="expenses.read"><Link href={`/dashboard/institution/${id}/accounts/expenses/${exp.id}`} className={styles.viewBtn}>
                        View →
                      </Link></PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.totalBar}>
            <span>Total</span>
            <span className={styles.totalValue}>₹{total.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}
