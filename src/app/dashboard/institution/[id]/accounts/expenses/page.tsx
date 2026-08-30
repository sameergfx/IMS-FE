"use client"
import styles from "./page.module.css"
export default function StatementsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Expenses</h1>
      <p className={styles.sub}>Account statements and reports</p>
      <div className={styles.empty}><span>📊</span><p>Expenses coming soon.</p></div>
    </div>
  )
}
