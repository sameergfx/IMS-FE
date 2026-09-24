"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useUiAccess } from "@/components/access/PermissionGate"
import { useAuth } from "@/lib/auth-context"
import { accountingApi } from "@/lib/api"
import { printReport } from "@/lib/print-report"
import { DailyStatement, DailyStatementGroup } from "@/types/accounting"
import styles from "./page.module.css"
import printStyles from "./page.module.css"

const money = (value: string | number) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }

export default function DailyStatementPage() {
  const { id } = useParams()
  const { can } = useUiAccess()
  const { selectedInstitution } = useAuth()
  const isZakat = selectedInstitution?.id === Number(id) && selectedInstitution.institution_type === "zakat_cell"
  const [day, setDay] = useState(today)
  const [generatedOn, setGeneratedOn] = useState<Date | null>(null)
  const [data, setData] = useState<DailyStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [category, setCategory] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setData(null); setGeneratedOn(null); setError(""); setCategory(null); setLoading(Boolean(day))
    if (day) accountingApi.getDailyStatement(Number(id), day)
      .then(value => { if (active) { setData(value); setGeneratedOn(new Date()) } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Failed to load daily statement") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, day])
  const current = data?.institution_id === Number(id) && data.date === day ? data : null
  const totals = (groups: DailyStatementGroup[], clickable = false) => <div className={styles.tableWrap}>
    <table className={styles.table}>
      <thead><tr><th>{clickable ? "Category" : "Payment method"}</th><th>Received</th><th>Expenses</th></tr></thead>
      <tbody>{groups.map(row => <tr key={row.name}><td>{clickable ? <button className={printStyles.category} onClick={() => setCategory(row.name)} aria-pressed={category === row.name}>{row.name}</button> : row.name}</td><td>{money(row.received)}</td><td>{money(row.spent)}</td></tr>)}</tbody>
      <tfoot><tr><td>Total</td><td>{money(current?.total_received ?? 0)}</td><td>{money(current?.total_expenses ?? 0)}</td></tr></tfoot>
    </table>
    </div>

  return (
    <div data-statement-print className={`${styles.page} ${printStyles.report}`}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Statement</h1>
          <p className={styles.sub}>
            {isZakat
              ? "Daily collections and expenses"
              : "Daily collections and expenses by category"}
          </p>
        </div>
        <button
          className={`${styles.button} ${printStyles.controls}`}
          disabled={!current || loading}
          onClick={() => {
            if (current) printReport(current.institution_name, "dailystatement");
          }}
        >
          Print / Save PDF
        </button>
      </div>

      {/* FILTERS SECTION */}
      <div className={`${styles.filters} ${printStyles.controls}`}>
        <label>
          Date
          <input type="date" value={day} onChange={e => setDay(e.target.value)} />
        </label>
      </div>

      {/* LEGAL / OPERATIONAL NOTE */}
      <p className={styles.note}>
        Receipts use saved item allocations. Earlier receipts without allocations are estimated
        proportionally across invoice items after discounts. Cancelled receipts and expenses are
        excluded. Opening balance is recorded receipts minus expenses before this date, across
        all payment methods. Closing balance is opening balance plus today’s receipts minus today’s expenses.
      </p>

      {/* CONDITIONAL CONDITIONAL CONDITIONAL RENDERING STATES */}
      {!day ? (
        <p className={styles.state}>Select a date.</p>
      ) : loading ? (
        <p className={styles.state} role="status">Loading daily statement...</p>
      ) : error ? (
        <p className={styles.state} role="alert">{error}</p>
      ) : (
        current && (
          <>
            {/* REPORT SUBHEADING */}
            <div className={styles.reportHeading}>
              <h2 className={styles.institution}>{current.institution_name}</h2>
              <div className={styles.reportDates}>
                <p className={styles.date}>Statement Date: {current.date}</p>
                {generatedOn && (
                  <p className={styles.date}>
                    Generated On:{" "}
                    <time dateTime={generatedOn.toISOString()}>
                      {generatedOn.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })}{" "}
                      IST
                    </time>
                  </p>
                )}
              </div>
            </div>

            {/* FINANCIAL SUMMARY BENTO WIDGET */}
            <div className={styles.summary}>
              <div>
                <span>Opening balance</span>
                <strong>{money(current.opening_balance)}</strong>
              </div>
              <div>
                <span>Total received</span>
                <strong>{money(current.total_received)}</strong>
              </div>
              <div>
                <span>Total expenses</span>
                <strong>{money(current.total_expenses)}</strong>
              </div>
              <div>
                <span>Net movement</span>
                <strong>{money(current.net_movement)}</strong>
              </div>
              <div>
                <span>Closing balance</span>
                <strong>{money(current.closing_balance)}</strong>
              </div>
            </div>

            {/* EMPTY DATA FALLBACK */}
            {!current.entries.length && (
              <p className={styles.state}>No transactions on this date.</p>
            )}

            {/* BREAKDOWNS MATRIX GRID */}
            <div
              className={styles.breakdowns}
              style={isZakat ? { gridTemplateColumns: "1fr" } : undefined}
            >
              {!isZakat && (
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Category breakdown</h2>
                  {totals(current.categories, true)}
                </section>
              )}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Payment methods</h2>
                {totals(current.payment_methods)}
              </section>
            </div>

            {/* CORE TRANSACTION DATA TABLE */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {category ? `${category} — transactions` : "All transactions"}
                </h2>
                {category && (
                  <button
                    className={`${styles.secondaryButton} ${printStyles.controls}`}
                    onClick={() => setCategory(null)}
                  >
                    Show all categories
                  </button>
                )}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Type / Number</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Payment method</th>
                      <th>Received</th>
                      <th>Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.entries.map((entry, index) => (
                      <tr
                        key={`${entry.kind}-${entry.id}-${index}`}
                        className={category && category !== entry.category ? printStyles.filtered : undefined}
                      >
                        <td>
                          {can(`${entry.kind === "receipt" ? "receipts" : "expenses"}.read`) ? (
                            <Link href={`/dashboard/institution/${id}/accounts/${entry.kind === "receipt" ? "receipts" : "expenses"}/${entry.id}`}>
                              {entry.number}
                            </Link>
                          ) : (
                            entry.number
                          )}
                        </td>
                        <td>{entry.category}</td>
                        <td>{entry.description}</td>
                        <td>{entry.payment_method}</td>
                        <td>{money(entry.received)}</td>
                        <td>{money(entry.spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )
      )}
    </div>
  );
}
