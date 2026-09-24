"use client"

import { useUiAccess } from "@/components/access/PermissionGate"
import { routePermission } from "@/lib/ui-permissions"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { UserResponse } from "@/types"
import { institutionUserTypes } from "@/lib/institution-types"
import { Institution } from "@/types/institution"
import styles from "./InstitutionSidebar.module.css"

interface NavChild { href: string; label: string }
interface NavItem  { href?: string; label: string; icon: string; children?: NavChild[] }

const buildNav = (id: number): NavItem[] => [
  { href:  `/dashboard/institution/${id}`,          icon: "⊞", label: "Dashboard" },
  { 
    href:  `/dashboard/institution/${id}/users`,    icon: "👥", label: "Users",
    children: [
      { href: `/dashboard/institution/${id}/users`, label: "All Users" },
      { href: `/dashboard/institution/${id}/users/create`,   label: "Add New"  },
      { href: `/dashboard/institution/${id}/users/student`,   label: "Students"  },
      { href: `/dashboard/institution/${id}/users/teacher`,   label: "Teachers"  },
      { href: `/dashboard/institution/${id}/users/staff`,   label: "Staff"  },
      { href: `/dashboard/institution/${id}/users/member`,   label: "Members"  },
    ],     
  },
  {
    icon: "📒", label: "Accounts",
    children: [
      { href: `/dashboard/institution/${id}/accounts/invoices`,   label: "Invoices"   },
      { href: `/dashboard/institution/${id}/accounts/donations`, label: "Donation" },
      { href: `/dashboard/institution/${id}/accounts/receipts`,   label: "Receipts"   },
      { href: `/dashboard/institution/${id}/accounts/expenses`,   label: "Expenses"   },
      { href: `/dashboard/institution/${id}/accounts/daily-statement`, label: "Daily Statement" },
      { href: `/dashboard/institution/${id}/accounts/statements`, label: "Statements" },
      { href: `/dashboard/institution/${id}/accounts/banking`, label: "Bank & Cash" },
    ],
  },
  { href: `/dashboard/institution/${id}/applications`, icon: "📋", label: "Applications & Assistance" },
  { href: `/dashboard/institution/${id}/settings`, icon: "⚙", label: "Settings"   },
  { href: `/dashboard/institution/${id}/settings/roles`, icon: "🔐", label: "Roles & Permissions" },
  { href: `/dashboard/institution/${id}/profile`,  icon: "👤", label: "My Profile" },
]

export default function InstitutionSidebar({
  institution, user,
}: {
  institution: Institution
  user: UserResponse
}) {
  const { can } = useUiAccess()
  const pathname   = usePathname()
  const { logout, clearInstitution, selectedInstitution } = useAuth()
  const displayedInstitution = selectedInstitution?.id === institution.id ? selectedInstitution : institution
  const allowedTypes = institutionUserTypes(selectedInstitution?.id === institution.id ? selectedInstitution.institution_type : institution.institution_type)
  const NAV = buildNav(institution.id).filter(item => item.label !== "Applications & Assistance" || ["zakat_cell", "social_welfare"].includes(displayedInstitution.institution_type)).map(item => item.label === "Users" ? {
    ...item,
    children: item.children?.filter(child => {
      const type = child.href.split("/").pop()
      return type === "users" || type === "create" || allowedTypes.some(allowed => allowed === type)
    }),
  } : item).map(item => item.children ? { ...item, children: item.children.filter(child => !(["Invoices", "Receipts"].includes(child.label) && ["zakat_cell", "social_welfare"].includes(displayedInstitution.institution_type))).filter(child => can(routePermission(child.href) || "access.manage")) } : item)
    .filter(item => item.children ? item.children.length > 0 : can(routePermission(item.href || "") || "access.manage"))

  const [openMenus, setOpenMenus] = useState<string[]>(
    pathname.includes("/accounts/") ? ["Accounts"] : []
  )

  const toggle = (label: string) =>
    setOpenMenus(p => p.includes(label) ? p.filter(l => l !== label) : [...p, label])

  return (
    <aside className={styles.sidebar}>

      {/* Institution header */}
      <div className={styles.instHeader}>
        <div className={styles.instLogo}>
          {displayedInstitution.logo
            ? <img src={displayedInstitution.logo} alt="" className={styles.logoImg} />
            : <span>{displayedInstitution.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className={styles.instInfo}>
          <p className={styles.instName}>{displayedInstitution.name}</p>
          {displayedInstitution.place && <p className={styles.instPlace}>{displayedInstitution.place}</p>}
        </div>
      </div>

      {/* Switch institution button */}
      <button className={styles.switchBtn} onClick={clearInstitution}>
        ← Switch Institution
      </button>

      <div className={styles.divider} />

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV.map(item => {

          if (item.children) {
            const isOpen    = openMenus.includes(item.label)
            const anyActive = item.children.some(c => pathname === c.href)
            return (
              <div key={item.label}>
                <button
                  className={`${styles.navItem} ${anyActive ? styles.active : ""}`}
                  onClick={() => toggle(item.label)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>‹</span>
                </button>
                {isOpen && (
                  <div className={styles.submenu}>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`${styles.submenuItem} ${pathname === child.href ? styles.submenuActive : ""}`}
                      >
                        <span className={styles.dot} />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const active = pathname === item.href ||
            (item.href !== `/dashboard/institution/${institution.id}` && pathname.startsWith(item.href!))

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`${styles.navItem} ${active ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={styles.userSection}>
        <Link href={`/dashboard/institution/${institution.id}/profile`} className={styles.userLink}>
          <div className={styles.userAvatar}>
            {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className={styles.userMeta}>
            <p className={styles.userName}>{user.full_name}</p>
            <p className={styles.userType}>{user.user_type}</p>
          </div>
        </Link>
        <button className={styles.logoutBtn} onClick={logout} title="Sign out">⎋</button>
      </div>

    </aside>
  )
}
