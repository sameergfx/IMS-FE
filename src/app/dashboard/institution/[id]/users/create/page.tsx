"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi } from "@/lib/api"
import { metaApi } from "@/lib/metaApi"
import { UserType } from "@/types"
import styles from "./create.module.css"

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Basic Info", "Profile Details"]

// ── Blood group options ───────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"]

// ── Meta form per user type ───────────────────────────────────────────────────

function StudentMetaForm({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const f = (label: string, key: string, type = "text", placeholder = "") => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder}
        value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[], req = false) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}{req && " *"}</label>
      <select className={styles.input} value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📋 Admission Info</h3>
        <div className={styles.grid3}>
          {f("Admission Number *", "admission_number", "text", "e.g. ADM-2024-001")}
          {f("Grade / Class", "grade", "text", "e.g. 10")}
          {f("Section", "section", "text", "e.g. A")}
          {f("Academic Year", "academic_year", "text", "e.g. 2024-25")}
          {f("Date of Birth", "date_of_birth", "date")}
          {sel("Gender", "gender", GENDERS)}
          {sel("Blood Group", "blood_group", BLOOD_GROUPS)}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📍 Address</h3>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Street address"
            value={data.address ?? ""} onChange={e => onChange("address", e.target.value)} />
        </div>
        <div className={styles.grid3}>
          {f("City", "city", "text", "City")}
          {f("State", "state", "text", "State")}
          {f("Country", "country", "text", "Country")}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>👨‍👩‍👦 Guardian Info</h3>
        <div className={styles.grid2}>
          {f("Guardian Name", "guardian_name", "text", "Full name")}
          {f("Relation", "guardian_relation", "text", "e.g. Father, Mother")}
          {f("Guardian Phone", "guardian_phone", "tel", "+91 XXXXX XXXXX")}
          {f("Guardian Email", "guardian_email", "email", "guardian@email.com")}
        </div>
      </div>
    </>
  )
}

function TeacherMetaForm({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const f = (label: string, key: string, type = "text", placeholder = "") => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder}
        value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[]) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={styles.input} value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🏫 Employment Info</h3>
        <div className={styles.grid3}>
          {f("Employee ID *", "employee_id", "text", "e.g. TCH-001")}
          {f("Department", "department", "text", "e.g. Mathematics")}
          {f("Specialization", "specialization", "text", "e.g. Algebra")}
          {f("Qualification", "qualification", "text", "e.g. M.Sc., B.Ed.")}
          {f("Joining Date", "joining_date", "date")}
          {f("Experience (Years)", "experience_years", "number", "0")}
          {f("Date of Birth", "date_of_birth", "date")}
          {sel("Gender", "gender", GENDERS)}
          {sel("Blood Group", "blood_group", BLOOD_GROUPS)}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📍 Address</h3>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Street address"
            value={data.address ?? ""} onChange={e => onChange("address", e.target.value)} />
        </div>
        <div className={styles.grid3}>
          {f("City", "city", "text", "City")}
          {f("State", "state", "text", "State")}
          {f("Country", "country", "text", "Country")}
        </div>
      </div>
    </>
  )
}

function StaffMetaForm({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const f = (label: string, key: string, type = "text", placeholder = "") => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder}
        value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[]) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={styles.input} value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const STAFF_TYPES = ["Administrative", "Clerical", "Maintenance", "Security", "Transport", "Canteen", "Other"]
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🏢 Staff Details</h3>
        <div className={styles.grid3}>
          {f("Employee ID *", "employee_id", "text", "e.g. STF-001")}
          {f("Designation", "designation", "text", "e.g. Office Assistant")}
          {f("Department", "department", "text", "e.g. Administration")}
          {sel("Staff Type", "staff_type", STAFF_TYPES)}
          {f("Joining Date", "joining_date", "date")}
          {f("Date of Birth", "date_of_birth", "date")}
          {sel("Gender", "gender", GENDERS)}
          {sel("Blood Group", "blood_group", BLOOD_GROUPS)}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📍 Address</h3>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Street address"
            value={data.address ?? ""} onChange={e => onChange("address", e.target.value)} />
        </div>
        <div className={styles.grid3}>
          {f("City", "city", "text", "City")}
          {f("State", "state", "text", "State")}
          {f("Country", "country", "text", "Country")}
        </div>
      </div>
    </>
  )
}

function MemberMetaForm({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const f = (label: string, key: string, type = "text", placeholder = "") => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder}
        value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[]) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={styles.input} value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const MEMBERSHIP_TYPES = ["General", "Premium", "Honorary", "Alumni", "Associate"]
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🪪 Membership Info</h3>
        <div className={styles.grid3}>
          {f("Membership Number *", "membership_number", "text", "e.g. MEM-001")}
          {sel("Membership Type", "membership_type", MEMBERSHIP_TYPES)}
          {f("Membership Expiry", "membership_expiry", "date")}
          {f("Organization", "organization", "text", "e.g. Parent Association")}
          {f("Date of Birth", "date_of_birth", "date")}
          {sel("Gender", "gender", GENDERS)}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📍 Address</h3>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Street address"
            value={data.address ?? ""} onChange={e => onChange("address", e.target.value)} />
        </div>
        <div className={styles.grid3}>
          {f("City", "city", "text", "City")}
          {f("State", "state", "text", "State")}
          {f("Country", "country", "text", "Country")}
        </div>
      </div>
    </>
  )
}

function AdminMetaForm({ data, onChange }: { data: any; onChange: (k: string, v: string) => void }) {
  const f = (label: string, key: string, type = "text", placeholder = "") => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type={type} placeholder={placeholder}
        value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)} />
    </div>
  )
  const sel = (label: string, key: string, opts: string[]) => (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <select className={styles.input} value={data[key] ?? ""} onChange={e => onChange(key, e.target.value)}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  return (
    <>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>👤 Personal Info</h3>
        <div className={styles.grid3}>
          {f("Date of Birth", "date_of_birth", "date")}
          {sel("Gender", "gender", GENDERS)}
        </div>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📍 Address</h3>
        <div className={styles.field}>
          <label className={styles.label}>Address</label>
          <textarea className={`${styles.input} ${styles.textarea}`} placeholder="Street address"
            value={data.address ?? ""} onChange={e => onChange("address", e.target.value)} />
        </div>
        <div className={styles.grid3}>
          {f("City", "city", "text", "City")}
          {f("State", "state", "text", "State")}
          {f("Country", "country", "text", "Country")}
        </div>
      </div>
    </>
  )
}

// ── User type cards ───────────────────────────────────────────────────────────

const USER_TYPE_OPTIONS: { type: UserType; label: string; icon: string; desc: string; color: string }[] = [
  { type: "student", label: "Student",  icon: "🎓", desc: "Enrolled learner",      color: "#3b82f6" },
  { type: "teacher", label: "Teacher",  icon: "👩‍🏫", desc: "Faculty member",         color: "#8b5cf6" },
  { type: "staff",   label: "Staff",    icon: "🏢", desc: "Non-teaching staff",     color: "#f59e0b" },
  { type: "member",  label: "Member",   icon: "🪪", desc: "Association member",     color: "#10b981" },
  { type: "admin",   label: "Admin",    icon: "⚙️", desc: "System administrator",   color: "#ef4444" },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function CreateUserPage() {
  const { id } = useParams()
  const router  = useRouter()

  const [step,       setStep]       = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState("")

  // Step 1 — basic info
  const [basic, setBasic] = useState({
    full_name:  "",
    email:      "",
    phone:      "",
    password:   "",
    confirm:    "",
    user_type:  "" as UserType | "",
    is_active:  true,
  })

  // Step 2 — meta data (flat key-value, sent to appropriate endpoint)
  const [meta, setMeta] = useState<Record<string, string>>({})

  const setBasicField  = (k: string, v: string | boolean) => setBasic(p => ({ ...p, [k]: v }))
  const setMetaField   = (k: string, v: string)            => setMeta(p => ({ ...p, [k]: v }))

  // ── Validate step 1 ──────────────────────────────────────────────────────

  const step1Valid = () => {
    if (!basic.full_name.trim())  { setError("Full name is required");         return false }
    if (!basic.email.trim())      { setError("Email is required");              return false }
    if (!basic.password)          { setError("Password is required");           return false }
    if (basic.password.length < 6){ setError("Password must be ≥ 6 characters"); return false }
    if (basic.password !== basic.confirm) { setError("Passwords do not match"); return false }
    if (!basic.user_type)         { setError("Please select a user type");      return false }
    return true
  }

  const handleNext = () => {
    setError("")
    if (step1Valid()) setStep(1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      // 1. Create base user
      const user = await usersApi.create({
        full_name:      basic.full_name,
        email:          basic.email,
        phone:          basic.phone || null,
        password:       basic.password,
        user_type:      basic.user_type,
        is_active:      basic.is_active,
        institution_id: Number(id),
      }) as any

      // 2. Submit meta (only if there's any data)
      const hasMetaData = Object.values(meta).some(v => v !== "" && v !== null)

      if (hasMetaData) {
        // Clean empty strings → undefined so backend treats them as optional
        const cleanMeta: Record<string, any> = {}
        for (const [k, v] of Object.entries(meta)) {
          if (v !== "") cleanMeta[k] = v
        }

        switch (basic.user_type) {
          case "student": await metaApi.createStudent(user.id, cleanMeta); break
          case "teacher": await metaApi.createTeacher(user.id, cleanMeta); break
          case "staff":   await metaApi.createStaff(user.id,   cleanMeta); break
          case "member":  await metaApi.createMember(user.id,  cleanMeta); break
          case "admin":   await metaApi.createAdmin(user.id,   cleanMeta); break
        }
      }

      router.push(`/dashboard/institution/${id}/users`)
    } catch (err: any) {
      setError(err.message || "Failed to create user")
    } finally {
      setSubmitting(false)
    }
  }

  const metaRequired = (type: UserType | "") => {
    if (type === "student") return "admission_number"
    if (type === "teacher") return "employee_id"
    if (type === "staff")   return "employee_id"
    if (type === "member")  return "membership_number"
    return null
  }

  const requiredKey = metaRequired(basic.user_type)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>Add New User</h1>
        <p className={styles.sub}>Create a user account and fill in their profile details</p>
      </div>

      {/* Step indicator */}
      <div className={styles.stepper}>
        {STEPS.map((label, i) => (
          <div key={i} className={`${styles.step} ${i === step ? styles.stepActive : ""} ${i < step ? styles.stepDone : ""}`}>
            <div className={styles.stepDot}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={styles.stepLabel}>{label}</span>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ""}`} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Basic Info ── */}
      {step === 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Information</h2>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>👤 Basic Details</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name *</label>
                <input id="full_name" className={styles.input} placeholder="e.g. Sameer Sharahudeen"
                  value={basic.full_name} onChange={e => setBasicField("full_name", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email *</label>
                <input id="email" className={styles.input} type="email" placeholder="user@school.edu"
                  value={basic.email} onChange={e => setBasicField("email", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <input id="phone" className={styles.input} type="tel" placeholder="+91 XXXXX XXXXX"
                  value={basic.phone} onChange={e => setBasicField("phone", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🔒 Password</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Password *</label>
                <input id="password" className={styles.input} type="password" placeholder="Min. 6 characters"
                  value={basic.password} onChange={e => setBasicField("password", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirm Password *</label>
                <input id="confirm" className={styles.input} type="password" placeholder="Re-enter password"
                  value={basic.confirm} onChange={e => setBasicField("confirm", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🏷️ User Type *</h3>
            <p className={styles.typeHint}>The type determines what profile fields appear in the next step.</p>
            <div className={styles.typeGrid}>
              {USER_TYPE_OPTIONS.map(opt => (
                <button
                  id={`type_${opt.type}`}
                  key={opt.type}
                  type="button"
                  className={`${styles.typeCard} ${basic.user_type === opt.type ? styles.typeCardSelected : ""}`}
                  style={basic.user_type === opt.type ? { "--card-color": opt.color } as any : {}}
                  onClick={() => setBasicField("user_type", opt.type)}
                >
                  <span className={styles.typeIcon}>{opt.icon}</span>
                  <span className={styles.typeLabel}>{opt.label}</span>
                  <span className={styles.typeDesc}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.toggleRow}>
              <span className={styles.label}>Account Active</span>
              <div
                className={`${styles.toggle} ${basic.is_active ? styles.toggleOn : ""}`}
                onClick={() => setBasicField("is_active", !basic.is_active)}
              >
                <div className={styles.toggleThumb} />
              </div>
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
            <button type="button" id="next_btn" className={styles.submitBtn} onClick={handleNext}>
              Next: Profile Details →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Meta form ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit}>
          <div className={styles.card}>
            <div className={styles.cardTitleRow}>
              <h2 className={styles.cardTitle}>
                {USER_TYPE_OPTIONS.find(o => o.type === basic.user_type)?.icon}{" "}
                {USER_TYPE_OPTIONS.find(o => o.type === basic.user_type)?.label} Profile
              </h2>
              <span className={styles.optionalBadge}>All fields optional except *</span>
            </div>

            {basic.user_type === "student" && <StudentMetaForm data={meta} onChange={setMetaField} />}
            {basic.user_type === "teacher" && <TeacherMetaForm data={meta} onChange={setMetaField} />}
            {basic.user_type === "staff"   && <StaffMetaForm   data={meta} onChange={setMetaField} />}
            {basic.user_type === "member"  && <MemberMetaForm  data={meta} onChange={setMetaField} />}
            {basic.user_type === "admin"   && <AdminMetaForm   data={meta} onChange={setMetaField} />}

            {/* Required ID field warning */}
            {requiredKey && !meta[requiredKey] && (
              <div className={styles.requiredNote}>
                ⚠️ <strong>{requiredKey.replace(/_/g, " ")}</strong> is required to save profile details.
                You can also skip and add it later.
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setStep(0)}>← Back</button>
              <button type="button" className={styles.skipBtn} disabled={submitting}
                onClick={async () => {
                  setError("")
                  setSubmitting(true)
                  try {
                    await usersApi.create({
                      full_name:      basic.full_name,
                      email:          basic.email,
                      phone:          basic.phone || null,
                      password:       basic.password,
                      user_type:      basic.user_type,
                      is_active:      basic.is_active,
                      institution_id: Number(id),
                    })
                    router.push(`/dashboard/institution/${id}/users`)
                  } catch (err: any) {
                    setError(err.message || "Failed to create user")
                    setSubmitting(false)
                  }
                }}
              >
                {submitting ? "Saving..." : "Skip & Save"}
              </button>
              <button type="submit" id="create_user_btn" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Creating..." : "✓ Create User"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
