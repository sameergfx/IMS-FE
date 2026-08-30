"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import styles from "./layout.module.css"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  // Institution pages have their own layout — skip topbar for them
  const isInstitutionPage = pathname.includes("/dashboard/institution/")

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [user, loading, router])

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinner} />
    </div>
  )

  if (!user) return null

  // Institution pages render their own full layout (sidebar + main)
  if (isInstitutionPage) return <>{children}</>

  // Selector page gets a simple topbar layout
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLogo}>
          <span className={styles.logoMark}>S</span>
          <span className={styles.logoText}>SchoolMS</span>
        </div>
        <div className={styles.topbarUser}>
          <span className={styles.userBadge}>{user.user_type}</span>
          <span className={styles.userName}>{user.full_name}</span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
