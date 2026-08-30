"use client"
import { useAuth } from "@/lib/auth-context"
import styles from "./page.module.css"
export default function SettingsPage() {
  const { selectedInstitution: inst } = useAuth()
  if (!inst) return null
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.sub}>Institution configuration</p>
      <div className={styles.card}>
        <div className={styles.grid}>
          {[["Name", inst.name], ["Place", inst.place], ["Phone", inst.phone], ["Email", inst.email],
            ["Bank", inst.bank_name], ["Branch", inst.bank_branch], ["Account No", inst.account_number], ["IFSC", inst.ifsc_code]
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={String(k)} className={styles.item}>
              <span className={styles.label}>{k}</span>
              <span className={styles.value}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
