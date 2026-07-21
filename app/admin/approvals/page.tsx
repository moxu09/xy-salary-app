"use client";

import { useState } from "react";

const approvalTypes = ["行政服務簽核", "報銷簽核", "福利簽核", "請假單簽核", "留職停薪簽核"];

export default function AdminApprovalsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-sky-600">簽核中心</p><h2 className="mt-1 text-3xl font-black">簽核申請</h2><p className="mt-2 text-sm text-slate-500">依月份檢視各類申請的日期、項目與簽核結果。</p></div>
        <label className="text-sm font-bold text-slate-600">月份<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2" /></label>
      </header>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm font-black text-slate-500"><span>申請日期</span><span>申請項目</span><span>類型</span><span>簽核結果</span></div>{approvalTypes.map((type) => <div key={type} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 px-5 py-5 text-sm"><span className="text-slate-500">尚無資料</span><span>-</span><span>{type}</span><span className="text-slate-400">待申請</span></div>)}</div>
    </main>
  );
}
