"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Banknote,
  ClipboardCheck,
  FileText,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

const navItems = [
  { href: "/xy/admin/staff", label: "員工管理", icon: Users },
  { href: "/xy/admin/orders", label: "訂單總覽", icon: FileText },
  { href: "/xy/admin/payroll", label: "發薪模式", icon: Banknote },
  { href: "/xy/admin/salary-rank", label: "薪資排序", icon: BarChart3 },
  { href: "/xy/admin/approvals", label: "簽核申請", icon: ClipboardCheck },
  { href: "/xy/admin/accounting", label: "會計報表", icon: WalletCards },
  { href: "/xy/admin/settings", label: "系統設定", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 md:flex">
      <aside className="w-full shrink-0 bg-[#172536] text-white md:min-h-screen md:w-64">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/xy/admin" className="block">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">XY Salary</p>
            <h1 className="mt-1 text-xl font-black">薪資管理後台</h1>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 md:block md:space-y-1 md:overflow-visible">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/xy/admin/staff" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-max items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition md:min-w-0 ${active ? "bg-sky-500 text-white shadow-lg shadow-sky-900/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <p className="text-sm font-semibold text-slate-500">管理中心</p>
          <p className="mt-0.5 text-lg font-black text-slate-900">深夜不關燈／秋奈電競陪玩</p>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </section>
    </div>
  );
}
