"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { institutionsApi } from "@/lib/api"
import { Institution } from "@/types/institution"
import InstitutionSidebar from "@/components/layout/InstitutionSidebar"
import styles from "./layout.module.css"

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading, selectInstitution } = useAuth()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!authLoading && !user) { router.replace("/login"); return }

    // load institution by id from URL
    institutionsApi.getOne(Number(id))
      .then(inst => {
        setInstitution(inst)
        selectInstitution(inst)      // keep context in sync
      })
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [id, user, authLoading])

  if (authLoading || loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} />
    </div>
  )

  if (!institution || !user) return null

  return (
    <div className={styles.shell}>
      <InstitutionSidebar institution={institution} user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
