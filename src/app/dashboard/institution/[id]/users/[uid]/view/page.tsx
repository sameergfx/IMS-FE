"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { usersApi, userMetaApi } from "@/lib/api"
import { UserResponse } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./view.module.css"

export default function UserViewPage({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const { id, uid } = useParams()
  const router = useRouter()

  const [user,    setUser]    = useState<UserResponse | null>(null)
  const [meta,    setMeta]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  useEffect(() => {
    usersApi.getUser(Number(uid))
      .then(async u => {
        setUser(u)
        
        // Fetch meta
        let m: any = null
        if (u.user_type === "student") {
          m = await userMetaApi.getStudentMeta(u.id)
          console.log("Student meta:", m)
        } else if (u.user_type === "teacher") {
          m = await userMetaApi.getTeacherMeta(u.id)
        } else if (u.user_type === "staff") {
          m = await userMetaApi.getStaffMeta(u.id)
        } else if (u.user_type === "member") {
          m = await userMetaApi.getMemberMeta(u.id)
          console.log("Member meta:", m)
        }
        setMeta(m || {})
      })
      .catch(err => setError(err.message || "Failed to load user"))
      .finally(() => setLoading(false))
  }, [uid])

  if (loading) return <div className={styles.state}>Loading user...</div>
  if (!user) return <div className={styles.state}>User not found.</div>

  const f = (label: string,  value = "") => (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>User Profile</h1>
        <div className={styles.actions}>
          <Link href={`/dashboard/institution/${id}/users/${uid}/edit`} className={styles.editLink}>
            Edit
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>User Information</h2>
        <div className={styles.partySection}>
          <PartyBadge userId={user.id} />
        </div>

        <div className={styles.infoGrid}>
          {f("Phone", user.phone || "—")}
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status</span>
            <span className={styles.infoValue}>
              <span className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.inactive}`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Meta sections by user type */}
      {user.user_type === "student" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Student Details</h2>
          <div className={styles.infoGrid}>
            {f("Admission Number", meta?.admission_number || "—")}
            {f("Roll Number", meta?.roll_number || "—")}
            {f("Class/Grade", meta?.grade || "—")}
            {f("Date of Birth", meta?.date_of_birth ? new Date(meta.date_of_birth).toLocaleDateString() : "—")}
            {f("Gender", meta?.gender ? meta.gender.charAt(0).toUpperCase() + meta.gender.slice(1) : "—")}
            {f("Blood Group", meta?.blood_group || "—")}
            {f("Address", meta?.address || "—")}
            {f("City", meta?.city || "—")}
            {f("State", meta?.state || "—")}
            {f("Country", meta?.country || "—")}
            {f("Guardian Name", meta?.guardian_name || "—")}
            {f("Guardian Relation", meta?.guardian_relation || "—")}
            {f("Guardian Phone", meta?.guardian_phone || "—")}
            {f("Guardian Email", meta?.guardian_email || "—")}
          </div>
        </div>
      )}

      {user.user_type === "teacher" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Teacher Details</h2>
          <div className={styles.infoGrid}>
            {f("Employee ID", meta?.employee_id || "—")}
            {f("Qualification", meta?.qualification || "—")}
            {f("Specialization", meta?.specialization || "—")}
            {f("Date of Birth", meta?.date_of_birth ? new Date(meta.date_of_birth).toLocaleDateString() : "—")}
            {f("Experience (in years)", meta?.experience_years || "—")}
            {f("Designation", meta?.designation || "—")}
            {f("Department", meta?.department || "—")}
            {f("Date of Joining", meta?.joining_date ? new Date(meta.joining_date).toLocaleDateString() : "—")}
            {f("Address", meta?.address || "—")}
            {f("City", meta?.city || "—")}
            {f("State", meta?.state || "—")}
            {f("Country", meta?.country || "—")}
          </div>
        </div>
      )}

      {user.user_type === "staff" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Staff Details</h2>
          <div className={styles.infoGrid}>
            {f("Employee ID", meta?.employee_id || "—")}
            {f("Designation", meta?.designation || "—")}
            {f("Date of Birth", meta?.date_of_birth ? new Date(meta.date_of_birth).toLocaleDateString() : "—")}
            {f("Blood Group", meta?.blood_group || "—")}
            {f("Department", meta?.department || "—")}
            {f("Date of Joining", meta?.joining_date ? new Date(meta.joining_date).toLocaleDateString() : "—")}
            {f("Address", meta?.address || "—")}
            {f("City", meta?.city || "—")}
            {f("State", meta?.state || "—")}
            {f("Country", meta?.country || "—")}
          </div>
        </div>
      )}

      {user.user_type === "member" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Member Details</h2>
          <div className={styles.infoGrid}>
            {f("Date of Birth", meta?.date_of_birth ? new Date(meta.date_of_birth).toLocaleDateString() : "—")}
            {f("Joining Date", meta?.joining_date ? new Date(meta.joining_date).toLocaleDateString() : "—")}
            {f("Gender", meta?.gender || "—")}
            {f("Blood Group", meta?.blood_group || "—")}
            {f("Membership Number", meta?.membership_number || "—")}
            {f("Membership Type", meta?.membership_type || "—")}
            {f("Membership Expiry Date", meta?.membership_expiry ? new Date(meta.membership_expiry).toLocaleDateString() : "—")}
            {f("Address", meta?.address || "—")}
            {f("City", meta?.city || "—")}
            {f("State", meta?.state || "—")}
            {f("Country", meta?.country || "—")}
          </div>
        </div>
      )}



      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
