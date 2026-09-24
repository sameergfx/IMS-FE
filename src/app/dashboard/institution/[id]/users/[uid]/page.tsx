"use client"
import PermissionGate from "@/components/access/PermissionGate"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { usersApi, userMetaApi, institutionsApi, accessApi } from "@/lib/api"
import { UserResponse, Role } from "@/types"
import { Institution } from "@/types/institution"
import { metaApi } from "@/lib/metaApi"
import TemporaryAccessPanel from "@/components/access/TemporaryAccessPanel"
import UserPhotoField from "@/components/ui/UserPhotoField"
import PartyBadge from "@/components/ui/PartyBadge"
import styles from "./detail.module.css"

interface UserInstitutionGrant {
  institution_id:   number
  institution_name: string
  role_id:          number
  role_name:        string
}

export default function UserDetailPage() {
  const { id, uid } = useParams()
  const router = useRouter()

  const [user,     setUser]     = useState<UserResponse | null>(null)
  const [meta,     setMeta]     = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [photoUploading, setPhotoUploading] = useState(false)
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

  // Institution access — real Role objects, not the old ad-hoc string
  const [access, setAccess] = useState<UserInstitutionGrant[]>([])
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [granting, setGranting] = useState(false)
  const [grantError, setGrantError] = useState("")
  const [grantForm, setGrantForm] = useState<{ institution_id: number; role_id: number }>({
    institution_id: 0,
    role_id: 0,
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
      if (u.user_type === "admin") { m = await userMetaApi.getAdminMeta(Number(uid)); setMetaForm(m || {}) }
      setMeta(m)
    } catch (err: any) {
      setError(err.message || "Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  const loadAccess = async () => {
    try {
      const [grants, institutions, roles] = await Promise.all([
        accessApi.getUserInstitutions(Number(uid)),
        institutionsApi.getAll(),
        accessApi.getRoles(),
      ])
      setAccess(grants)
      setAllInstitutions(institutions)
      setAllRoles(roles)
    } catch {
      // Non-fatal — the rest of the page still works without this section.
    }
  }

  useEffect(() => { load(); loadAccess() }, [uid])

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setMetaField = (k: string, v: any) => setMetaForm((f: Record<string, unknown>) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (saving || photoUploading) return
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
        await (meta ? userMetaApi.updateStudentMeta(Number(uid), metaForm) : metaApi.createStudent(Number(uid), metaForm))
      } else if (user?.user_type === "teacher") {
        await (meta ? userMetaApi.updateTeacherMeta(Number(uid), metaForm) : metaApi.createTeacher(Number(uid), metaForm))
      } else if (user?.user_type === "staff") {
        await (meta ? userMetaApi.updateStaffMeta(Number(uid), metaForm) : metaApi.createStaff(Number(uid), metaForm))
      } else if (user?.user_type === "member") {
        await (meta ? userMetaApi.updateMemberMeta(Number(uid), metaForm) : metaApi.createMember(Number(uid), metaForm))
      } else if (user?.user_type === "admin") {
        await (meta ? userMetaApi.updateAdminMeta(Number(uid), metaForm) : metaApi.createAdmin(Number(uid), metaForm))
      }

      setSuccess("User saved successfully!")
      setTimeout(() => router.push(`/dashboard/institution/${id}/users`), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const openGrantModal = () => {
    setGrantError("")
    const firstAvailable = allInstitutions.find(
      inst => !access.some(a => a.institution_id === inst.id)
    )
    setGrantForm({ institution_id: firstAvailable?.id ?? allInstitutions[0]?.id ?? 0, role_id: allRoles[0]?.id ?? 0 })
    setShowGrantModal(true)
  }

  const handleGrantAccess = async () => {
    setGrantError("")
    if (!grantForm.institution_id) { setGrantError("Select an institution"); return }
    if (!grantForm.role_id) { setGrantError("Select a role"); return }
    if (access.some(a => a.institution_id === grantForm.institution_id && a.role_id === grantForm.role_id)) {
      setGrantError("User already has this exact role at this institution")
      return
    }

    setGranting(true)
    try {
      await accessApi.assignRole(Number(uid), grantForm.institution_id, grantForm.role_id)
      await loadAccess()
      setShowGrantModal(false)
    } catch (err: any) {
      setGrantError(err.message || "Failed to grant access")
    } finally {
      setGranting(false)
    }
  }

  const handleRevokeAccess = async (institutionId: number, roleId: number) => {
    if (!confirm("Revoke this role at this institution for the user?")) return
    try {
      await accessApi.revokeRole(Number(uid), institutionId, roleId)
      await loadAccess()
    } catch (err: any) {
      setError(err.message || "Failed to revoke access")
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

      <UserPhotoField value={metaForm.profile_photo} onChange={url => setMetaField("profile_photo", url)} onBusyChange={setPhotoUploading} disabled={saving || photoUploading} />
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

      <div className={styles.card}>
        <div className={styles.accessHeader}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0, paddingBottom: 0, border: "none" }}>
            Institution Access
          </h2>
          <PermissionGate action="access.manage"><button className={styles.grantBtn} onClick={openGrantModal}>+ Grant Access</button></PermissionGate>
        </div>

        {access.length === 0 ? (
          <p className={styles.emptyAccess}>No institution access recorded yet.</p>
        ) : (
          <div className={styles.accessList}>
            {access.map(a => (
              <div key={`${a.institution_id}-${a.role_id}`} className={styles.accessRow}>
                <div>
                  <span className={styles.accessInstitution}>{a.institution_name}</span>
                  <span className={styles.accessRole}>{a.role_name}</span>
                </div>
                <PermissionGate action="access.manage"><button className={styles.revokeBtn} onClick={() => handleRevokeAccess(a.institution_id, a.role_id)}>
                  Revoke
                </button></PermissionGate>
              </div>
            ))}
          </div>
        )}
      </div>

      <TemporaryAccessPanel userId={Number(uid)} institutionId={Number(id)} />

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
                value={metaForm.employee_id || ""} readOnly />
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
                value={metaForm.employee_id || ""} readOnly />
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
        <PermissionGate action="students.update"><button className={styles.saveBtn} onClick={handleSave} disabled={saving || photoUploading}>
          {saving ? "Saving..." : "Save Changes"}
        </button></PermissionGate>
      </div>

      {showGrantModal && (
        <div className={styles.overlay} onClick={() => !granting && setShowGrantModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Grant Institution Access</h3>
            <p className={styles.modalSub}>
              Give {user.full_name} access to another institution, with a role for that institution.
            </p>

            <div className={styles.field} style={{ marginBottom: "1rem" }}>
              <label className={styles.label}>Institution</label>
              <select className={styles.input} value={grantForm.institution_id}
                onChange={e => setGrantForm(f => ({ ...f, institution_id: Number(e.target.value) }))}>
                <option value={0}>Select institution</option>
                {allInstitutions.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Role at this institution</label>
              <select className={styles.input} value={grantForm.role_id}
                onChange={e => setGrantForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
                <option value={0}>Select role</option>
                {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {allRoles.length === 0 && (
                <span className={styles.hint}>
                  No roles defined yet — create one on the Roles & Permissions page first.
                </span>
              )}
            </div>

            {grantError && <div className={styles.error} style={{ marginTop: "1rem" }}>{grantError}</div>}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowGrantModal(false)} disabled={granting}>
                Cancel
              </button>
              <PermissionGate action="access.manage"><button className={styles.saveBtn} onClick={handleGrantAccess} disabled={granting || !grantForm.institution_id || !grantForm.role_id}>
                {granting ? "Granting..." : "Grant Access"}
              </button></PermissionGate>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
