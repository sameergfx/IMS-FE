"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi, userMetaApi } from "@/lib/api"
import { UserResponse } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./detail.module.css"

export default function UserDetailPage() {
  const { id, uid } = useParams()
  const router = useRouter()

  const [user,     setUser]     = useState<UserResponse | null>(null)
  const [meta,     setMeta]     = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState("")

  const [form, setForm] = useState({
    full_name: "",
    email:     "",
    phone:     "",
    is_active: true,
  })

  const [metaForm, setMetaForm] = useState<any>({})

  const load = async () => {
    try {
      const u = await usersApi.getUser(Number(uid))
      setUser(u)
      setForm({
        full_name: u.full_name,
        email:     u.email,
        phone:     u.phone || "",
        is_active: u.is_active,
      })

      // Fetch meta based on user type
      let m: any = null
      if (u.user_type === "student") {
        m = await userMetaApi.getStudentMeta(u.id)
        setMetaForm(m || {})
      } else if (u.user_type === "teacher") {
        m = await userMetaApi.getTeacherMeta(u.id)
        setMetaForm(m || {})
      } else if (u.user_type === "staff") {
        m = await userMetaApi.getStaffMeta(u.id)
        setMetaForm(m || {})
      } else if (u.user_type === "member") {
        m = await userMetaApi.getMemberMeta(u.id)
        setMetaForm(m || {})
      }
      setMeta(m)
    } catch (err: any) {
      setError(err.message || "Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [uid])

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setMetaField = (k: string, v: any) => setMetaForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError("")
    setSuccess("")

    if (!form.full_name.trim()) { setError("Name required"); return }
    if (!form.email.trim()) { setError("Email required"); return }

    setSaving(true)
    try {
      // Update user
      await usersApi.update(Number(uid), {
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone || null,
        is_active: form.is_active,
      })

      // Update meta if user type has meta
      if (user?.user_type === "student") {
        await userMetaApi.updateStudentMeta(Number(uid), metaForm)
      } else if (user?.user_type === "teacher") {
        await userMetaApi.updateTeacherMeta(Number(uid), metaForm)
      } else if (user?.user_type === "staff") {
        await userMetaApi.updateStaffMeta(Number(uid), metaForm)
      } else if (user?.user_type === "member") {
        await userMetaApi.updateMemberMeta(Number(uid), metaForm)
      }

      setSuccess("User saved successfully!")
      setTimeout(() => router.push(`/dashboard/institution/${id}/users`), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.state}>Loading user...</div>
  if (!user) return <div className={styles.state}>User not found.</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>Edit User</h1>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>User Information</h2>
        <div className={styles.partySection}>
          <PartyBadge userId={user.id} />
        </div>

        <div className={styles.formGroup}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name *</label>
            <input className={styles.input} type="text"
              value={form.full_name} onChange={e => setField("full_name", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input className={styles.input} type="email"
              value={form.email} onChange={e => setField("email", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input className={styles.input} type="tel" placeholder="Optional"
              value={form.phone} onChange={e => setField("phone", e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={form.is_active}
                onChange={e => setField("is_active", e.target.checked)} />
              <span>Active User</span>
            </label>
          </div>
        </div>
      </div>

      {/* Meta fields by user type */}
      {user.user_type === "student" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Student Details</h2>
          <div className={styles.formGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Admission Number</label>
              <input className={styles.input} type="text"
                value={metaForm.admission_number || ""} onChange={e => setMetaField("admission_number", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Roll Number</label>
              <input className={styles.input} type="text"
                value={metaForm.roll_number || ""} onChange={e => setMetaField("roll_number", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Class/Grade</label>
              <input className={styles.input} type="text"
                value={metaForm.class_grade || ""} onChange={e => setMetaField("class_grade", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date of Birth</label>
              <input className={styles.input} type="date"
                value={metaForm.date_of_birth || ""} onChange={e => setMetaField("date_of_birth", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Gender</label>
              <select className={styles.input} value={metaForm.gender || ""}
                onChange={e => setMetaField("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {user.user_type === "teacher" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Teacher Details</h2>
          <div className={styles.formGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Employee ID</label>
              <input className={styles.input} type="text"
                value={metaForm.employee_id || ""} onChange={e => setMetaField("employee_id", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Qualification</label>
              <input className={styles.input} type="text"
                value={metaForm.qualification || ""} onChange={e => setMetaField("qualification", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date of Birth</label>
              <input className={styles.input} type="date"
                value={metaForm.date_of_birth || ""} onChange={e => setMetaField("date_of_birth", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Specialization</label>
              <input className={styles.input} type="text"
                value={metaForm.specialization || ""} onChange={e => setMetaField("specialization", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {user.user_type === "staff" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Staff Details</h2>
          <div className={styles.formGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Employee ID</label>
              <input className={styles.input} type="text"
                value={metaForm.employee_id || ""} onChange={e => setMetaField("employee_id", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Designation</label>
              <input className={styles.input} type="text"
                value={metaForm.designation || ""} onChange={e => setMetaField("designation", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input className={styles.input} type="text"
                value={metaForm.department || ""} onChange={e => setMetaField("department", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date of Joining</label>
              <input className={styles.input} type="date"
                value={metaForm.date_of_joining || ""} onChange={e => setMetaField("date_of_joining", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {user.user_type === "member" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Member Details</h2>
          <div className={styles.formGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Membership Number</label>
              <input className={styles.input} type="text"
                value={metaForm.membership_number || ""} onChange={e => setMetaField("membership_number", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Member Type</label>
              <input className={styles.input} type="text"
                value={metaForm.member_type || ""} onChange={e => setMetaField("member_type", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Joining Date</label>
              <input className={styles.input} type="date"
                value={metaForm.joining_date || ""} onChange={e => setMetaField("joining_date", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
