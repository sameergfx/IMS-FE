"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi, userMetaApi } from "@/lib/api"
import { UserResponse } from "@/types"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./detail.module.css"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]

export default function UserDetailPage({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
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

  const [metaForm, setMetaForm] = useState({
    admission_number: "",
    roll_number:      "",
    grade:            "",
    date_of_birth:    "",
    blood_group:      "",
    gender:           "",
    employee_id:      "",
    qualification:    "",
    specialization:   "",
    designation:      "",
    department:       "",
    experience_years:  "",
    membership_number:"",
    membership_type:      "",
    joining_date:     "",
    membership_expiry: "",
    address:          "",
    city:             "",
    state:            "",
    country:          "",
    guardian_name:     "",
    guardian_relation: "",
    guardian_phone:    "",
    guardian_email:    "",
  })

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
      setMetaForm({
        admission_number: u.admission_number || "",
        roll_number:      u.roll_number || "",
        grade:            u.grade || "",
        date_of_birth:    u.date_of_birth || "",
        blood_group:      u.blood_group || "",
        gender:           u.gender || "",
        employee_id:      u.employee_id || "",
        qualification:    u.qualification || "",
        specialization:   u.specialization || "",
        designation:      u.designation || "",
        department:       u.department || "",
        experience_years:  u.experience_years || "",
        membership_number:u.membership_number || "",
        membership_type:      u.membership_type || "",
        joining_date:     u.joining_date || "",
        membership_expiry: u.membership_expiry || "",
        address:          u.address || "",
        city:             u.city || "",
        state:            u.state || "",
        country:          u.country || "",
        guardian_name:     u.guardian_name || "",
        guardian_relation: u.guardian_relation || "",
        guardian_phone:    u.guardian_phone || "",
        guardian_email:    u.guardian_email || "",
      }) // Reset meta form before fetching new meta

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

  const f = (label: string, key: string, type = "text", placeholder = "", value = "", req = false) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder} value={value}
         onChange={e => setMetaField(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[], value = "", req = false) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}{req && " *"}</label>
      <select className={styles.input} value={value} onChange={e => setMetaField(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

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
          {f("Full Name *", "full_name", "text", "", user.full_name, true)}
          {f("Email *", "email", "email", "eg: user@example.com", user.email, true)}
          {f("Phone", "phone", "tel", "Optional", user.phone || "", false)}
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
            {f("Admission Number *", "admission_number", "text", metaForm.admission_number || "", metaForm.admission_number || "")}
            {f("Roll Number", "roll_number", "text", metaForm.roll_number || "", metaForm.roll_number || "")}
            {f("Class/Grade", "grade", "text", metaForm.grade || "", metaForm.grade || "")}
            {f("Date of Birth", "date_of_birth", "date", metaForm.date_of_birth || "", metaForm.date_of_birth || "")}
            {sel("Gender", "gender", GENDERS, metaForm.gender || "")}
            {sel("Blood Group", "blood_group", BLOOD_GROUPS, metaForm.blood_group || "")}
            {f("Address", "address", "text", metaForm.address || "", metaForm.address || "")}
            {f("Date of Birth", "date_of_birth", "date", metaForm.date_of_birth || "", metaForm.date_of_birth || "")}
            {f("City", "city", "text", metaForm.city || "", metaForm.city || "")}
            {f("State", "state", "text", metaForm.state || "", metaForm.state || "")}
            {f("Country", "country", "text", metaForm.country || "", metaForm.country || "")}
            {f("Guardian Name", "guardian_name", "text", metaForm.guardian_name || "", metaForm.guardian_name || "")}
            {f("Guardian Relation", "guardian_relation", "text", metaForm.guardian_relation || "", metaForm.guardian_relation || "")}
            {f("Guardian Phone", "guardian_phone", "text", metaForm.guardian_phone || "", metaForm.guardian_phone || "")}
            {f("Guardian Email", "guardian_email", "text", metaForm.guardian_email || "", metaForm.guardian_email || "")}
          </div>
        </div>
      )}

      {user.user_type === "teacher" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Teacher Details</h2>
          <div className={styles.formGroup}>
            {f("Employee ID *", "employee_id", "text", "", metaForm.employee_id || "", true)}
            {f("Designation", "designation", "text", metaForm.designation || "", metaForm.designation || "")}
            {f("Department", "department", "text", metaForm.department || "", metaForm.department || "")}
            {f("Qualification", "qualification", "text", metaForm.qualification || "", metaForm.qualification || "")}
            {f("Specialization", "specialization", "text", metaForm.specialization || "", metaForm.specialization || "")}
            {f("Date of Joining", "joining_date", "date", metaForm.joining_date || "", metaForm.joining_date || "")}
            {f("Experience (in years)", "experience_years", "text", metaForm.experience_years || "", metaForm.experience_years || "")}
            {f("Date of Birth", "date_of_birth", "date", metaForm.date_of_birth || "", metaForm.date_of_birth || "")}
            {f("Address", "address", "text", metaForm.address || "", metaForm.address || "")}
            {f("City", "city", "text", metaForm.city || "", metaForm.city || "")}
            {f("State", "state", "text", metaForm.state || "", metaForm.state || "")}
            {f("Country", "country", "text", metaForm.country || "", metaForm.country || "")} 
          </div>
        </div>
      )}

      {user.user_type === "staff" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Staff Details</h2>
          <div className={styles.formGroup}>
            {f("Employee ID", "employee_id", "text", metaForm.employee_id || "", metaForm.employee_id || "")}
            {f("Designation", "designation", "text", metaForm.designation || "", metaForm.designation || "")}
            {f("Department", "department", "text", metaForm.department || "", metaForm.department || "")}
            {f("Date of Joining", "joining_date", "date", metaForm.joining_date || "", metaForm.joining_date || "")}
            {f("Date of Birth", "date_of_birth", "date", metaForm.date_of_birth || "", metaForm.date_of_birth || "")}
            {sel("Gender", "gender", GENDERS, metaForm.gender || "")}
            {sel("Blood Group", "blood_group", BLOOD_GROUPS, metaForm.blood_group || "")}
            {f("Address", "address", "text", metaForm.address || "", metaForm.address || "")}
            {f("City", "city", "text", metaForm.city || "", metaForm.city || "")}
            {f("State", "state", "text", metaForm.state || "", metaForm.state || "")}
            {f("Country", "country", "text", metaForm.country || "", metaForm.country || "")}
          </div>
        </div>
      )}

      {user.user_type === "member" && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Member Details</h2>
          <div className={styles.formGroup}>
            {f("Membership Number", "membership_number", "text", metaForm.membership_number || "", metaForm.membership_number || "")}
            {f("Membership Type", "membership_type", "text", metaForm.membership_type || "", metaForm.membership_type || "")}
            {f("Joining Date", "joining_date", "date", metaForm.joining_date || "", metaForm.joining_date || "")}
            {f("Membership Expiry Date", "membership_expiry", "date", metaForm.membership_expiry || "", metaForm.membership_expiry || "")}
            {f("Date of Birth", "date_of_birth", "date", metaForm.date_of_birth || "", metaForm.date_of_birth || "")}
            {sel("Gender", "gender", GENDERS, metaForm.gender || "")}
            {sel("Blood Group", "blood_group", BLOOD_GROUPS, metaForm.blood_group || "")}
            {f("Address", "address", "text", metaForm.address || "", metaForm.address || "")}
            {f("City", "city", "text", metaForm.city || "", metaForm.city || "")}
            {f("State", "state", "text", metaForm.state || "", metaForm.state || "")}
            {f("Country", "country", "text", metaForm.country || "", metaForm.country || "")}
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
