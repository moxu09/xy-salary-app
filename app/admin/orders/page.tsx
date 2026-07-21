"use client";

import Link from "next/link";
import { FileText, Gift, Sparkles, WalletCards } from "lucide-react";

const items = [
  ["訂單明細", "查看所選月份的訂單與抽成", "/xy/admin/salary", FileText],
  ["打賞明細", "查看員工收到的打賞紀錄", "/xy/admin/salary", Gift],
  ["獎金明細", "查看福利、生日與其他獎金", "/xy/admin/salary", Sparkles],
  ["薪資扣項", "查看並管理薪資扣除項目", "/xy/admin/salary", WalletCards],
] as const;

export default function AdminOrdersPage() {
  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-bold text-sky-600">後台管理</p>
        <h2 className="mt-1 text-3xl font-black">訂單總覽</h2>
        <p className="mt-2 text-sm text-slate-500">依月份集中查看訂單、打賞、獎金與薪資扣項。</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map(([title, desc, href, Icon]) => (
          <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300">
            <Icon className="text-sky-600" size={25} />
            <h3 className="mt-5 font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
