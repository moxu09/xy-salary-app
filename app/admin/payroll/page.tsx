"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";

type Staff = {
  id: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  real_name?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
};

type SalaryOrder = {
  id: string;
  discord_id?: string | null;
  staff_name?: string | null;
  assigned_player?: string | null;
  order_no?: string | null;
  order_id?: string | null;
  customer_name?: string | null;
  service_name?: string | null;
  order_amount?: number | null;
  price?: number | null;
  staff_salary?: number | null;
  bonus_amount?: number | null;
  status?: string | null;
  order_finished_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type Bonus = {
  id: string;
  discord_id: string;
  staff_name?: string | null;
  bonus_type?: string | null;
  description?: string | null;
  amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type PayrollRow = {
  staff: Staff;
  orders: SalaryOrder[];
  bonuses: Bonus[];
  orderSalary: number;
  orderBonus: number;
  extraBonus: number;
  totalPay: number;
};

function getCurrentMonthInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(monthText: string) {
  const [yearText, monthValueText] = monthText.split("-");
  const year = Number(yearText);
  const monthValue = Number(monthValueText);

  const source =
    Number.isInteger(year) && Number.isInteger(monthValue) && monthValue >= 1
      ? new Date(year, monthValue - 1, 1)
      : new Date();

  const start = new Date(source.getFullYear(), source.getMonth(), 1, 0, 0, 0);
  const end = new Date(
    source.getFullYear(),
    source.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function money(value: number | string | null | undefined) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function getDiscordIdFromSession(session: any) {
  const user = session?.user;
  const metadata = user?.user_metadata || {};

  return String(
    metadata.provider_id ||
      metadata.sub ||
      metadata.user_id ||
      user?.identities?.[0]?.identity_data?.sub ||
      user?.identities?.[0]?.identity_data?.id ||
      ""
  ).trim();
}

function getDisplayName(staff: Staff | null | undefined) {
  if (!staff) return "未知員工";

  return (
    staff.display_name ||
    staff.real_name ||
    staff.discord_name ||
    staff.discord_id ||
    "未知員工"
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("zh-TW", {
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderDate(order: SalaryOrder) {
  return order.order_finished_at || order.completed_at || order.created_at || null;
}

function getOrderAmount(order: SalaryOrder) {
  return Number(order.order_amount ?? order.price ?? 0);
}

export default function XYAdminPayrollPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<SalaryOrder[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthInput());
  const [staffFilter, setStaffFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);
  const [copying, setCopying] = useState(false);

  const payrollRows = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    return staffList
      .filter((staff) => {
        if (staffFilter !== "all" && staff.discord_id !== staffFilter) {
          return false;
        }

        if (!key) return true;

        const text = [
          staff.discord_id,
          staff.discord_name,
          staff.display_name,
          staff.real_name,
          staff.bank_name,
          staff.bank_account,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(key);
      })
      .map((staff) => {
        const staffOrders = orders.filter(
          (order) => order.discord_id === staff.discord_id
        );

        const staffBonuses = bonuses.filter(
          (bonus) => bonus.discord_id === staff.discord_id
        );

        const orderSalary = staffOrders.reduce(
          (sum, order) => sum + Number(order.staff_salary || 0),
          0
        );

        const orderBonus = staffOrders.reduce(
          (sum, order) => sum + Number(order.bonus_amount || 0),
          0
        );

        const extraBonus = staffBonuses.reduce(
          (sum, bonus) => sum + Number(bonus.amount || 0),
          0
        );

        const totalPay = orderSalary + orderBonus + extraBonus;

        return {
          staff,
          orders: staffOrders,
          bonuses: staffBonuses,
          orderSalary,
          orderBonus,
          extraBonus,
          totalPay,
        };
      })
      .filter((row) => row.totalPay !== 0);
  }, [staffList, orders, bonuses, staffFilter, keyword]);

  const totalOrderSalary = payrollRows.reduce(
    (sum, row) => sum + row.orderSalary,
    0
  );

  const totalOrderBonus = payrollRows.reduce(
    (sum, row) => sum + row.orderBonus,
    0
  );

  const totalExtraBonus = payrollRows.reduce(
    (sum, row) => sum + row.extraBonus,
    0
  );

  const totalPay = payrollRows.reduce((sum, row) => sum + row.totalPay, 0);

  const totalOrderCount = payrollRows.reduce(
    (sum, row) => sum + row.orders.length,
    0
  );

  const totalBonusCount = payrollRows.reduce(
    (sum, row) => sum + row.bonuses.length,
    0
  );

  useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function boot() {
    setChecking(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        window.location.href = "/xy/admin-login";
        return;
      }

      const discordId = getDiscordIdFromSession(session);

      if (!discordId) {
        alert("無法取得 Discord ID，請重新登入。");
        await supabase.auth.signOut();
        window.location.href = "/xy/admin-login";
        return;
      }

      const { data: admin, error } = await supabase
        .from("xy_admins")
        .select("*")
        .eq("discord_id", discordId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("check xy admin error:", error);
        alert("檢查 XY 後台權限失敗");
        window.location.href = "/xy/staff";
        return;
      }

      if (!admin) {
        alert("你沒有 XY 後台管理權限");
        window.location.href = "/xy/staff";
        return;
      }

      await loadPayroll();
    } catch (error) {
      console.error("xy payroll boot error:", error);
      alert("檢查 XY 後台權限失敗");
      window.location.href = "/xy/staff";
    } finally {
      setChecking(false);
    }
  }

  async function loadPayroll() {
    setLoading(true);

    const { startIso, endIso } = getMonthRange(selectedMonth);

    const [staffRes, orderRes, bonusRes] = await Promise.all([
      supabase
        .from("xy_players")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("xy_play_orders")
        .select("*")
        .or("is_deleted.eq.false,is_deleted.is.null")
        .or("status.neq.已發薪,status.is.null")
        .gte("order_finished_at", startIso)
        .lte("order_finished_at", endIso)
        .order("order_finished_at", { ascending: false }),
      supabase
        .from("xy_players_bonus")
        .select("*")
        .or("status.neq.已發薪,status.is.null")
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false }),
    ]);

    setLoading(false);

    if (staffRes.error) {
      console.error("load xy staff error:", staffRes.error);
      setStaffList([]);
    } else {
      setStaffList((staffRes.data || []) as Staff[]);
    }

    if (orderRes.error) {
      console.error("load xy unpaid orders error:", orderRes.error);
      alert(`讀取未發薪訂單失敗：${orderRes.error.message}`);
      setOrders([]);
    } else {
      setOrders((orderRes.data || []) as SalaryOrder[]);
    }

    if (bonusRes.error) {
      console.error("load xy unpaid bonuses error:", bonusRes.error);
      alert(
        `讀取未發薪獎金失敗：${bonusRes.error.message}\n\n如果錯誤是找不到 status 欄位，請先在 Supabase 執行新增欄位 SQL。`
      );
      setBonuses([]);
    } else {
      setBonuses((bonusRes.data || []) as Bonus[]);
    }
  }

  function makePayrollText() {
    const lines = [
      `XY 陪玩發薪預覽`,
      `月份：${selectedMonth}`,
      `總發薪：${money(totalPay)}`,
      "",
      "姓名｜銀行｜帳號｜薪水｜訂單獎金｜額外獎金/扣除｜應發合計",
      ...payrollRows.map((row) => {
        const staff = row.staff;

        return [
          getDisplayName(staff),
          staff.bank_name || "未填銀行",
          staff.bank_account || "未填帳號",
          money(row.orderSalary),
          money(row.orderBonus),
          money(row.extraBonus),
          money(row.totalPay),
        ].join("｜");
      }),
    ];

    return lines.join("\n");
  }

  async function copyPayrollText() {
    setCopying(true);

    try {
      await navigator.clipboard.writeText(makePayrollText());
      alert("已複製發薪預覽文字");
    } catch (error) {
      console.error("copy payroll text error:", error);
      alert("複製失敗，請改用手動選取。");
    } finally {
      setCopying(false);
    }
  }

  async function markCurrentPayrollPaid() {
    if (payrollRows.length === 0) {
      alert("目前沒有可發薪資料。");
      return;
    }

    const ok = window.confirm(
      `確定要將目前畫面中的 ${payrollRows.length} 位員工標記為已發薪嗎？\n\n包含：${totalOrderCount} 筆訂單、${totalBonusCount} 筆獎金 / 扣除\n總金額：${money(totalPay)}`
    );

    if (!ok) return;

    setMarkingPaid(true);

    const now = new Date().toISOString();

    const orderIds = payrollRows.flatMap((row) =>
      row.orders.map((order) => order.id)
    );

    const bonusIds = payrollRows.flatMap((row) =>
      row.bonuses.map((bonus) => bonus.id)
    );

    const updateJobs = [];

    if (orderIds.length > 0) {
      updateJobs.push(
        supabase
          .from("xy_play_orders")
          .update({
            status: "已發薪",
            paid_at: now,
            updated_at: now,
          })
          .in("id", orderIds)
      );
    }

    if (bonusIds.length > 0) {
      updateJobs.push(
        supabase
          .from("xy_players_bonus")
          .update({
            status: "已發薪",
            paid_at: now,
            updated_at: now,
          })
          .in("id", bonusIds)
      );
    }

    const results = await Promise.all(updateJobs);
    setMarkingPaid(false);

    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      console.error("mark payroll paid error:", firstError);
      alert(`標記已發薪失敗：${firstError.message}`);
      return;
    }

    alert("已標記為已發薪");
    await loadPayroll();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7ed]">
        <div className="rounded-[28px] border border-orange-100 bg-white px-8 py-7 text-center shadow-sm shadow-orange-100">
          <Loader2 className="mx-auto animate-spin text-orange-500" size={34} />
          <p className="mt-4 text-sm font-semibold text-slate-600">
            正在檢查 XY 後台權限...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7ed] px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[30px] border border-orange-100 bg-white px-6 py-5 shadow-sm shadow-orange-100">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link
                href="/xy/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                <ArrowLeft size={16} />
                回 XY 管理後台
              </Link>

              <p className="mt-4 text-sm font-bold text-orange-600">
                XY Payroll
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
                發薪模式
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                預覽本月每位有薪水要發的員工，包含姓名、銀行、帳號、薪水與獎金。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/xy/admin/staff"
                className="inline-flex items-center justify-center rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50"
              >
                員工管理
              </Link>

              <Link
                href="/xy/admin/salary"
                className="inline-flex items-center justify-center rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50"
              >
                薪資總表
              </Link>

              <button
                onClick={loadPayroll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                重新整理
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard title="待發員工" value={`${payrollRows.length} 人`} />
          <StatCard title="待發訂單" value={`${totalOrderCount} 筆`} />
          <StatCard title="訂單薪水" value={money(totalOrderSalary)} />
          <StatCard title="獎金 / 扣除" value={money(totalOrderBonus + totalExtraBonus)} />
          <StatCard title="應發合計" value={money(totalPay)} />
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
          <div className="grid gap-3 lg:grid-cols-[180px_220px_1fr_auto_auto]">
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
            />

            <select
              value={staffFilter}
              onChange={(event) => setStaffFilter(event.target.value)}
              className="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="all">全部員工</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.discord_id}>
                  {getDisplayName(staff)}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2">
              <Search size={17} className="text-orange-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜尋姓名、Discord ID、銀行、帳號"
                className="min-h-0 flex-1 border-none bg-transparent p-0 text-sm outline-none focus:shadow-none"
              />
            </div>

            <button
              onClick={loadPayroll}
              disabled={loading}
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
            >
              查詢
            </button>

            <button
              onClick={copyPayrollText}
              disabled={copying || payrollRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
            >
              <Copy size={16} />
              複製表
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
          <div className="flex flex-col gap-4 border-b border-orange-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Banknote size={20} className="text-orange-500" />
                發薪預覽
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                只顯示目前還沒有標記已發薪、且金額不為 0 的員工。
              </p>
            </div>

            <button
              onClick={markCurrentPayrollPaid}
              disabled={markingPaid || payrollRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-100 hover:bg-emerald-600 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {markingPaid ? "處理中..." : "將目前預覽標記已發薪"}
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              讀取中...
            </div>
          ) : payrollRows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              目前沒有需要發薪的人員
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>員工</th>
                    <th>銀行</th>
                    <th>帳號</th>
                    <th>訂單</th>
                    <th>訂單薪水</th>
                    <th>訂單獎金</th>
                    <th>額外獎金 / 扣除</th>
                    <th>應發合計</th>
                  </tr>
                </thead>

                <tbody>
                  {payrollRows.map((row) => (
                    <tr key={row.staff.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 text-orange-600">
                            {row.staff.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.staff.avatar_url}
                                alt="avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={20} />
                            )}
                          </div>

                          <div>
                            <p className="font-black text-slate-900">
                              {getDisplayName(row.staff)}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              {row.staff.discord_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>{row.staff.bank_name || "未填寫"}</td>
                      <td>{row.staff.bank_account || "未填寫"}</td>
                      <td>
                        {row.orders.length} 筆
                        {row.bonuses.length > 0 ? ` / 獎金 ${row.bonuses.length} 筆` : ""}
                      </td>
                      <td className="font-bold text-slate-700">
                        {money(row.orderSalary)}
                      </td>
                      <td
                        className={`font-bold ${
                          row.orderBonus < 0 ? "text-red-500" : "text-orange-600"
                        }`}
                      >
                        {money(row.orderBonus)}
                      </td>
                      <td
                        className={`font-bold ${
                          row.extraBonus < 0 ? "text-red-500" : "text-orange-600"
                        }`}
                      >
                        {money(row.extraBonus)}
                      </td>
                      <td className="text-lg font-black text-orange-600">
                        {money(row.totalPay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <DetailCard title="未發薪訂單明細">
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                沒有未發薪訂單
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {order.staff_name || order.assigned_player || order.discord_id}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {order.order_no || order.order_id || "無訂單編號"}｜{formatDateTime(getOrderDate(order))}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {order.customer_name || "未填客人"}｜{order.service_name || "未填項目"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">
                          訂單 {money(getOrderAmount(order))}
                        </p>
                        <p className="text-sm font-black text-orange-600">
                          薪資 {money(order.staff_salary)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailCard>

          <DetailCard title="未發薪獎金 / 扣除明細">
            {bonuses.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                沒有未發薪獎金 / 扣除
              </p>
            ) : (
              <div className="space-y-2">
                {bonuses.map((bonus) => (
                  <div
                    key={bonus.id}
                    className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {bonus.staff_name || bonus.discord_id}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {bonus.bonus_type || "獎金"}｜{formatDateTime(bonus.created_at)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {bonus.description || "-"}
                        </p>
                      </div>

                      <p
                        className={`text-sm font-black ${
                          Number(bonus.amount || 0) < 0
                            ? "text-red-500"
                            : "text-orange-600"
                        }`}
                      >
                        {money(bonus.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailCard>
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
      <p className="text-sm font-bold text-orange-600">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
        <WalletCards size={20} className="text-orange-500" />
        {title}
      </h2>

      {children}
    </div>
  );
}
