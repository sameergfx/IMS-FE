"use client"

import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import styles from "./page.module.css"

export default function InstitutionDashboard() {
  const { selectedInstitution: inst } = useAuth()
  if (!inst) return null

  const stats = [
    { label: "Users",    value: "—", icon: "👥" },
    { label: "Receipts", value: "—", icon: "🧾" },
    { label: "Invoices", value: "—", icon: "📄" },
    { label: "Accounts", value: "—", icon: "📊" },
  ]

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.instBadge}>
          <div className={styles.instInitials}>
            {inst.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.title}>{inst.name}</h1>
            {inst.place && <p className={styles.sub}>📍 {inst.place}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <div>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statValue}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
      {(inst.phone || inst.email || inst.address) && (
        <div className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Institution Info</h2>
          <div className={styles.infoGrid}>
            {inst.phone   && <div className={styles.infoItem}><span className={styles.infoLabel}>Phone</span><span>{inst.phone}</span></div>}
            {inst.email   && <div className={styles.infoItem}><span className={styles.infoLabel}>Email</span><span>{inst.email}</span></div>}
            {inst.address && <div className={styles.infoItem}><span className={styles.infoLabel}>Address</span><span>{inst.address}</span></div>}
            {inst.bank_name && <div className={styles.infoItem}><span className={styles.infoLabel}>Bank</span><span>{inst.bank_name}</span></div>}
          </div>
        </div>
      )}
    </div>
  )
}
