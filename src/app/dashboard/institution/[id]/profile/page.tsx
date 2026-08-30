"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { usersApi, userMetaApi } from "@/lib/api"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./profile.module.css"

export default function MyProfilePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState("")

  const [form, setForm] = useState({
    full_name: "",
    email:     "",
    phone:     "",
  })

  const [metaForm, setMetaForm] = useState<any>({})

  useEffect(() => {
    if (!user) return

    setForm({
      full_name: user.full_name,
      email:     user.email,
      phone:     user.phone || "",
    })

    const loadMeta = async () => {
      let m: any = null
      if (user.user_type === "student") {
        m = await userMetaApi.getStudentMeta(user.id)
      } else if (user.user_type === "teacher") {
        m = await userMetaApi.getTeacherMeta(user.id)
      } else if (user.user_type === "staff") {
        m = await userMetaApi.getStaffMeta(user.id)
      } else if (user.user_type === "member") {
        m = await userMetaApi.getMemberMeta(user.id)
      }
      setMetaForm(m || {})
      setLoading(false)
    }
    loadMeta()
  }, [user])

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setMetaField = (k: string, v: string) => setMetaForm((f: any) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!user) return
    setError("")
    setSuccess("")

    if (!form.full_name.trim()) { setError("Name is required"); return }
    if (!form.email.trim()) { setError("Email is required"); return }

    setSaving(true)
    try {
      await usersApi.update(user.id, {
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone || null,
      })

      // Update meta — contact/address style fields only, not admin-controlled ones
      if (user.user_type === "student") {
        await userMetaApi.updateStudentMeta(user.id, metaForm)
      } else if (user.user_type === "teacher") {
        await userMetaApi.updateTeacherMeta(user.id, metaForm)
      } else if (user.user_type === "staff") {
        await userMetaApi.updateStaffMeta(user.id, metaForm)
      } else if (user.user_type === "member") {
        await userMetaApi.updateMemberMeta(user.id, metaForm)
      }

      if (refreshUser) await refreshUser()
      setSuccess("Profile updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Some fields may require admin approval.")
    } finally {
      setSaving(false)
    }
  }

  if (!user || loading) return <div className={styles.state}>Loading profile...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.sub}>Manage your personal information</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Account Information</h2>
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
            <label className={styles.label}>User Type</label>
            <input className={styles.input} type="text" value={user.user_type} disabled />
          </div>
        </div>
      </div>

      {/* Meta fields by user type — self-editable contact details */}
      {user.user_type === "student" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Student Details</h2>
          <div className={styles.formGroup}>
            <div className={styles.field}>
              <label className={styles.label}>Admission Number</label>
              <input className={styles.input} type="text" value={metaForm.admission_number || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Class/Grade</label>
              <input className={styles.input} type="text" value={metaForm.class_grade || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
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
              <input className={styles.input} type="text" value={metaForm.employee_id || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Qualification</label>
              <input className={styles.input} type="text"
                value={metaForm.qualification || ""} onChange={e => setMetaField("qualification", e.target.value)} />
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
              <input className={styles.input} type="text" value={metaForm.employee_id || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Designation</label>
              <input className={styles.input} type="text" value={metaForm.designation || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Department</label>
              <input className={styles.input} type="text" value={metaForm.department || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
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
              <input className={styles.input} type="text" value={metaForm.membership_number || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Member Type</label>
              <input className={styles.input} type="text" value={metaForm.member_type || ""} disabled />
              <span className={styles.hint}>Contact admin to change</span>
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
