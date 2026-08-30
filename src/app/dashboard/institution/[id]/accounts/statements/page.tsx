"use client"
import styles from "./page.module.css"
export default function StatementsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Statements</h1>
      <p className={styles.sub}>Account statements and reports</p>
      <div className={styles.empty}><span>📊</span><p>Statements coming soon.</p></div>
    </div>
  )
}
