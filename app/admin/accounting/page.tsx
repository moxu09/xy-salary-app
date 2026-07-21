"use client";

import { useState } from "react";

export default function AdminAccountingPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  return <main className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-sky-600">財務中心</p><h2 className="mt-1 text-3xl font-black">會計報表</h2><p className="mt-2 text-sm text-slate-500">依月份彙整營收、抽成、薪資與待付款項。</p></div><label className="text-sm font-bold text-slate-600">月份<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2" /></label></header><section className="grid gap-4 md:grid-cols-4">{[["訂單營收","$0"],["員工薪資","$0"],["平台抽成","$0"],["待發薪資","$0"]].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-3 text-2xl font-black text-slate-900">{value}</p></div>)}</section><div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">選擇月份後，會在此顯示可匯出的會計明細。</div></main>;
}
