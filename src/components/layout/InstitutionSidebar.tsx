"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { UserResponse } from "@/types"
import { Institution } from "@/types/institution"
import styles from "./InstitutionSidebar.module.css"

interface NavChild { href: string; label: string }
interface NavItem  { href?: string; label: string; icon: string; children?: NavChild[] }

const buildNav = (id: number): NavItem[] => [
  { href:  `/dashboard/institution/${id}`,          icon: "⊞", label: "Dashboard" },
  { 
    href:  `/dashboard/institution/${id}/users`,    icon: "👥", label: "Users",
    children: [
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
      { href: `/dashboard/institution/${id}/accounts/receipts`,   label: "Receipts"   },
      { href: `/dashboard/institution/${id}/accounts/expenses`,   label: "Expenses"   },
      { href: `/dashboard/institution/${id}/accounts/statements`, label: "Statements" },
    ],
  },
  { href: `/dashboard/institution/${id}/settings`, icon: "⚙", label: "Settings"   },
  { href: `/dashboard/institution/${id}/profile`,  icon: "👤", label: "My Profile" },
]

export default function InstitutionSidebar({
  institution, user,
}: {
  institution: Institution
  user: UserResponse
}) {
  const pathname   = usePathname()
  const { logout, clearInstitution } = useAuth()
  const NAV        = buildNav(institution.id)

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
          {institution.logo
            ? <img src={institution.logo} alt="" className={styles.logoImg} />
            : <span>{institution.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className={styles.instInfo}>
          <p className={styles.instName}>{institution.name}</p>
          {institution.place && <p className={styles.instPlace}>{institution.place}</p>}
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
