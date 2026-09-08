"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  UserCog,
  Receipt,
  Building2,
} from "lucide-react";

import { useAppSelector } from "@/store/hooks";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Students",
    href: "/students",
    icon: GraduationCap,
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: BookOpen,
  },
  {
    name: "Members",
    href: "/members",
    icon: Users,
  },
  {
    name: "Staffs",
    href: "/staffs",
    icon: UserCog,
  },
  {
    name: "Invoice & Billing",
    href: "/invoices",
    icon: Receipt,
  },
];

export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const selectedInstitution = useAppSelector(
    (state) => state.institution.selectedInstitution
  );

  return (
    <aside
      className={`bg-white border-r transition-all shadow-sm duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 font-bold text-lg border-b">
        {collapsed ? "ERP" : "School ERP"}
      </div>

      {/* Current institution / switcher */}
      <button
        onClick={() => router.push("/institutions")}
        className="flex w-full items-center gap-3 px-4 py-3 border-b text-left hover:bg-slate-50 transition"
        title="Switch institution"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-900/10 text-blue-900">
          <Building2 size={16} />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {selectedInstitution?.name ?? "Select institution"}
            </p>
            <p className="truncate text-xs text-slate-400">Switch</p>
          </div>
        )}
      </button>

      <nav className="p-2 space-y-1">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm
                ${
                  active
                    ? "bg-blue-900 text-white shadow-sm "
                    : "hover:bg-slate-100 text-slate-700"
                }`}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
