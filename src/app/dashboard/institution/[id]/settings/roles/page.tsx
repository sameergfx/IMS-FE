"use client"

import { useEffect, useState } from "react"
import { Trash2, LoaderCircle } from "lucide-react"
import { accessApi } from "@/lib/api"
import { Role, Permission } from "@/types"
import styles from "./roles.module.css"

export default function RolesPermissionsPage() {
  const [roles, setRoles]             = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [toggling, setToggling]       = useState<number | null>(null)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm, setRoleForm]       = useState({ name: "", description: "" })
  const [savingRole, setSavingRole]   = useState(false)
  const [roleError, setRoleError]     = useState("")

  const [showPermModal, setShowPermModal] = useState(false)
  const [permForm, setPermForm]       = useState({ code: "", description: "" })
  const [savingPerm, setSavingPerm]   = useState(false)
  const [permError, setPermError]     = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [r, p] = await Promise.all([accessApi.getRoles(), accessApi.getPermissions()])
      setRoles(r)
      setPermissions(p)
      setSelectedRoleId(prev => prev ?? r[0]?.id ?? null)
    } catch (err: any) {
      setError(err.message || "Failed to load roles and permissions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null

  const hasPermission = (permissionId: number) =>
    !!selectedRole?.permissions.some(p => p.id === permissionId)

  const togglePermission = async (permission: Permission) => {
    if (!selectedRole || accessBusy) return
    setError("")
    setToggling(permission.id)
    try {
      const updated = hasPermission(permission.id)
        ? await accessApi.removePermissionFromRole(selectedRole.id, permission.id)
        : await accessApi.addPermissionToRole(selectedRole.id, permission.id)
      setRoles(prev => prev.map(r => (r.id === updated.id ? updated : r)))
    } catch (err: any) {
      setError(err.message || "Failed to update permission")
    } finally {
      setToggling(null)
    }
  }

  const handleCreateRole = async () => {
    setRoleError("")
    if (!roleForm.name.trim()) { setRoleError("Role name is required"); return }

    setSavingRole(true)
    try {
      const role = await accessApi.createRole({
        name: roleForm.name.trim(),
        description: roleForm.description || null,
      })
      setRoles(prev => [...prev, role])
      setSelectedRoleId(role.id)
      setShowRoleModal(false)
      setRoleForm({ name: "", description: "" })
    } catch (err: any) {
      setRoleError(err.message || "Failed to create role")
    } finally {
      setSavingRole(false)
    }
  }

  const handleCreatePermission = async () => {
    setPermError("")

    let requests: { code: string; description: string | null }[]

    if (bulkPermissions) {
      const resourceName = resource.trim().toLowerCase()

      if (!/^[a-z][a-z0-9_]*$/.test(resourceName)) {
        setPermError(
          "Enter a resource starting with a letter, using only letters, numbers, and underscores."
        )
        return
      }

      if (selectedActions.length === 0) {
        setPermError("Select at least one action.")
        return
      }

      requests = selectedActions.map(action => ({
        code: `${resourceName}.${action}`,
        description: `${
          action.charAt(0).toUpperCase() + action.slice(1)
        } ${resourceName.replaceAll("_", " ")}`,
      }))
    } else {
      const code = permForm.code.trim()

      if (!code) {
        setPermError("Permission code is required.")
        return
      }

      requests = [{
        code,
        description: permForm.description.trim() || null,
      }]
    }

    setSavingPerm(true)

    try {
      // Refresh the list so already-existing codes can be skipped.
      const existing = await accessApi.getPermissions()
      setPermissions(existing)

      const existingCodes = new Set(existing.map(p => p.code))
      const pending = requests.filter(item => !existingCodes.has(item.code))

      if (pending.length === 0) {
        setPermError("All selected permission codes already exist.")
        return
      }

      const failures: string[] = []

      // Each successful creation is kept, even if a later request fails.
      for (const item of pending) {
        try {
          const permission = await accessApi.createPermission(item)

          setPermissions(current =>
            current.some(p => p.id === permission.id)
              ? current
              : [...current, permission]
          )
        } catch (err: unknown) {
          const message = err instanceof Error
            ? err.message
            : "Request failed"

          failures.push(`${item.code}: ${message}`)
        }
      }

      if (failures.length > 0) {
        setPermError(
          `Some permissions could not be created. Successful permissions were saved. ${failures.join("; ")}`
        )
        return
      }

      setShowPermModal(false)
      setPermForm({ code: "", description: "" })
      setResource("")
    } catch (err: unknown) {
      setPermError(
        err instanceof Error ? err.message : "Failed to load permissions."
      )
    } finally {
      setSavingPerm(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (accessBusy) return

    if (!window.confirm(
      `Delete role "${role.name}"? Assigned roles must be removed from users before deletion.`
    )) return

    setDeletingRole(role.id)
    setError("")

    try {
      await accessApi.deleteRole(role.id)

      setRoles(current => current.filter(item => item.id !== role.id))

      setSelectedRoleId(current =>
        current === role.id ? null : current
      )
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete role."
      )
    } finally {
      setDeletingRole(null)
    }
  }

  const handleDeletePermission = async (permission: Permission) => {
    if (accessBusy) return

    if (!window.confirm(
      `Delete "${permission.code}" globally? Remove it from all roles before deleting it.`
    )) return

    setDeletingPermission(permission.id)
    setError("")

    try {
      await accessApi.deletePermission(permission.id)

      setPermissions(current =>
        current.filter(item => item.id !== permission.id)
      )

      // Update role checkboxes and permission counts.
      setRoles(current =>
        current.map(role => ({
          ...role,
          permissions: role.permissions.filter(
            item => item.id !== permission.id
          ),
        }))
      )
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete permission."
      )
    } finally {
      setDeletingPermission(null)
    }
  }

  const permissionActions = ["create", "read", "update", "delete"] as const
  type PermissionAction = (typeof permissionActions)[number]

  const [bulkPermissions, setBulkPermissions] = useState(false)
  const [resource, setResource] = useState("")
  const [selectedActions, setSelectedActions] = useState<PermissionAction[]>([
    "create", "read", "update", "delete",
  ])

  const toggleAction = (action: PermissionAction) => {
    setSelectedActions(current =>
      current.includes(action)
        ? current.filter(item => item !== action)
        : [...current, action]
    )
  }

  const [deletingRole, setDeletingRole] = useState<number | null>(null)
  const [deletingPermission, setDeletingPermission] = useState<number | null>(null)

  const accessBusy =
    toggling !== null ||
    deletingRole !== null ||
    deletingPermission !== null

  const modulePermissions = new Map<string, Partial<Record<PermissionAction, Permission>>>()
  const customPermissions: Permission[] = []
  for (const permission of permissions) {
    const separator = permission.code.lastIndexOf(".")
    const module = permission.code.slice(0, separator)
    const action = permission.code.slice(separator + 1) as PermissionAction
    if (separator > 0 && permissionActions.includes(action)) {
      const actions = modulePermissions.get(module) ?? {}
      actions[action] = permission
      modulePermissions.set(module, actions)
    } else {
      customPermissions.push(permission)
    }
  }
  const modules = [...modulePermissions.entries()].sort(([a], [b]) => a.localeCompare(b))
  const grantedCount = permissions.filter(permission => hasPermission(permission.id)).length

  if (loading) return <div className={styles.state}>Loading roles and permissions...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Roles & Permissions</h1>
          <p className={styles.sub}>Define what each role can do, then assign roles to users per institution.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={() => setShowPermModal(true)}>+ New Permission</button>
          <button className={styles.primaryBtn} onClick={() => setShowRoleModal(true)}>+ New Role</button>
        </div>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <section className={styles.matrixCard} aria-label="Role permissions">
        <div className={styles.roleToolbar}>
          <div className={styles.rolePicker}>
            <label htmlFor="active-role">Active Role</label>
            <select id="active-role" value={selectedRoleId ?? ""} disabled={accessBusy || roles.length === 0}
              onChange={event => setSelectedRoleId(Number(event.target.value))}>
              <option value="" disabled>Select a role</option>
              {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <p className={styles.saveStatus} role="status">{accessBusy ? "Saving changes…" : "Changes save automatically"}</p>
        </div>
        <div className={styles.legend}>
          {permissionActions.map(action => (
            <span key={action} className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles[action]}`} />
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </span>
          ))}
          <span className={styles.legendItem}><span className={styles.inactiveDot} />Not granted</span>
        </div>

        <div className={styles.matrixHeading}>
          <div>
            <h2 className={styles.roleTitle}>{selectedRole?.name ?? "Choose a role"}</h2>
            <p className={styles.roleDesc}>
              {selectedRole?.description || "Select a cell to grant or revoke access. Changes save automatically."}
            </p>
          </div>
          {selectedRole && (
            <button type="button" className={styles.dangerBtn}
              onClick={() => handleDeleteRole(selectedRole)} disabled={accessBusy}>
              {deletingRole === selectedRole.id ? "Deleting..." : "Delete Role"}
            </button>
          )}
        </div>

        {roles.length === 0 ? (
          <p className={styles.empty}>No roles yet. Create a role to start assigning permissions.</p>
        ) : permissions.length === 0 ? (
          <p className={styles.empty}>No permissions yet. Use New Permission to generate actions for a module.</p>
        ) : (
          <>
            {modules.length > 0 && (
              <div className={styles.matrixScroll}>
                <table className={styles.matrix}>
                  <caption className={styles.srOnly}>Module permissions for {selectedRole?.name ?? "the selected role"}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.moduleHeading}>Module</th>
                      {permissionActions.map(action => (
                        <th scope="col" key={action}>
                          <span className={styles.columnTitle}>{action}</span>
                          <span className={styles.columnHint}>
                            {{ create: "Add new", read: "View", update: "Edit", delete: "Remove" }[action]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(([module, actions]) => (
                      <tr key={module}>
                        <th scope="row" className={styles.moduleName}>{module.replaceAll("_", " ").replaceAll(".", " / ")}</th>
                        {permissionActions.map(action => {
                          const permission = actions[action]
                          const granted = !!permission && hasPermission(permission.id)
                          return (
                            <td key={action}>
                              {permission ? (
                                <button type="button"
                                  className={`${styles.matrixCell} ${granted ? `${styles.granted} ${styles[action]}` : styles.notGranted}`}
                                  aria-label={`${action} ${module} for ${selectedRole?.name ?? "selected role"}`}
                                  aria-pressed={granted}
                                  aria-busy={toggling === permission.id}
                                  title={`${permission.description || permission.code} — ${granted ? "Granted; click to revoke" : "Not granted; click to grant"}`}
                                  disabled={accessBusy || !selectedRole}
                                  onClick={() => togglePermission(permission)}>
                                  <span className={styles.cellDot} aria-hidden="true">{toggling === permission.id ? "…" : granted ? "✓" : ""}</span>
                                </button>
                              ) : (
                                <span className={styles.unavailable} title={`${module}.${action} has not been created`}>
                                  <span aria-hidden="true">—</span><span className={styles.srOnly}>{module}.{action} not defined</span>
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={styles.matrixNote}>✓ Granted · Click a cell to change access · — Permission not defined</p>
              </div>
            )}
            {customPermissions.length > 0 && (
              <div className={styles.customPermissions}>
                <h3 className={styles.roleTitle}>Additional permissions</h3>
                {customPermissions.map(permission => (
                  <label key={permission.id} className={styles.permRow}>
                    <input type="checkbox" checked={hasPermission(permission.id)} disabled={accessBusy || !selectedRole}
                      onChange={() => togglePermission(permission)} />
                    <span><span className={styles.permCode}>{permission.code}</span>
                      <span className={styles.permDesc}>{permission.description}</span></span>
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        <div className={styles.stats} aria-live="polite">
          <div><span>Target Role</span><strong>{selectedRole?.name ?? "None selected"}</strong></div>
          <div><span>Grants Active</span><strong>{grantedCount} / {permissions.length}</strong></div>
          <div><span>Modules</span><strong>{modules.length}</strong></div>
        </div>

      </section>

      {permissions.length > 0 && (
        <details className={styles.managePermissions}>
          <summary>Manage permission definitions <span>({permissions.length})</span></summary>
          <p className={styles.hint}>Deleting a definition removes it globally. Remove it from all roles first.</p>
          <div className={styles.definitionGrid}>
            {permissions.map(permission => (
              <div key={permission.id} className={styles.permissionItem}>
                <div className={styles.permissionDefinition}>
                  <span className={styles.permCode}>{permission.code}</span>
                  <span className={styles.permDesc}>{permission.description}</span>
                </div>
                <button type="button" className={styles.deleteIconBtn} disabled={accessBusy}
                  onClick={() => handleDeletePermission(permission)} title={`Delete ${permission.code}`} aria-busy={deletingPermission === permission.id} aria-label={deletingPermission === permission.id ? `Deleting permission ${permission.code}` : `Delete permission ${permission.code}`}>
                  {deletingPermission === permission.id ? <LoaderCircle size={17} className={styles.deleteSpinner} aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* New role modal */}
      {showRoleModal && (
        <div className={styles.overlay} onClick={() => !savingRole && setShowRoleModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>New Role</h3>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input className={styles.input} placeholder="e.g. Exam Coordinator"
                value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input className={styles.input} placeholder="Optional"
                value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {roleError && <div className={styles.error}>{roleError}</div>}
            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setShowRoleModal(false)} disabled={savingRole}>Cancel</button>
              <button className={styles.primaryBtn} onClick={handleCreateRole} disabled={savingRole}>
                {savingRole ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New permission modal */}
      {showPermModal && (
        <div
          className={styles.overlay}
          onClick={() => !savingPerm && setShowPermModal(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-modal-title"
            onClick={e => e.stopPropagation()}
          >
            <h3
              id="permission-modal-title"
              className={styles.modalTitle}
            >
              {bulkPermissions ? "Generate Permissions" : "New Permission"}
            </h3>

            <div className={styles.field}>
              <label className={styles.permRow}>
                <input
                  type="checkbox"
                  checked={bulkPermissions}
                  disabled={savingPerm}
                  onChange={e => {
                    setBulkPermissions(e.target.checked)
                    setPermError("")
                  }}
                />
                <span>Generate multiple permissions</span>
              </label>
            </div>

            {bulkPermissions ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="permission-resource" className={styles.label}>
                    Resource / Module
                  </label>

                  <input
                    id="permission-resource"
                    className={styles.input}
                    placeholder="e.g. invoices, students, staff"
                    value={resource}
                    disabled={savingPerm}
                    onChange={e => setResource(e.target.value)}
                  />

                  <span className={styles.hint}>
                    Example: invoices generates invoices.create, invoices.read,
                    invoices.update, and invoices.delete.
                  </span>
                </div>

                <div className={styles.field}>
                  <label className={styles.permRow}>
                    <input
                      type="checkbox"
                      checked={selectedActions.length === permissionActions.length}
                      disabled={savingPerm}
                      onChange={e =>
                        setSelectedActions(
                          e.target.checked ? [...permissionActions] : []
                        )
                      }
                    />
                    <strong>Select All</strong>
                  </label>

                  {permissionActions.map(action => (
                    <label key={action} className={styles.permRow}>
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action)}
                        disabled={savingPerm}
                        onChange={() => toggleAction(action)}
                      />

                      <span>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </span>

                      {resource.trim() && (
                        <code className={styles.hint}>
                          {resource.trim().toLowerCase()}.{action}
                        </code>
                      )}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={styles.field}>
                  <label htmlFor="permission-code" className={styles.label}>
                    Code
                  </label>

                  <input
                    id="permission-code"
                    className={styles.input}
                    placeholder="e.g. invoices.create"
                    value={permForm.code}
                    disabled={savingPerm}
                    onChange={e =>
                      setPermForm(f => ({ ...f, code: e.target.value }))
                    }
                  />

                  <span className={styles.hint}>
                    Use dot notation: resource.action
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="permission-description" className={styles.label}>
                    Description
                  </label>

                  <input
                    id="permission-description"
                    className={styles.input}
                    placeholder="Optional"
                    value={permForm.description}
                    disabled={savingPerm}
                    onChange={e =>
                      setPermForm(f => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
              </>
            )}

            {permError && (
              <div className={styles.error} role="alert">
                {permError}
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowPermModal(false)}
                disabled={savingPerm}
              >
                Cancel
              </button>

              <button
                className={styles.primaryBtn}
                onClick={handleCreatePermission}
                disabled={
                  savingPerm ||
                  (bulkPermissions && selectedActions.length === 0)
                }
              >
                {savingPerm
                  ? "Creating..."
                  : bulkPermissions
                    ? "Generate Permissions"
                    : "Create Permission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}