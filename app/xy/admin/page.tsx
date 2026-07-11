"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Banknote,
  CalendarHeart,
  Loader2,
  LogOut,
  RefreshCw,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react";

type Staff = {
  id: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  real_name?: string | null;
  is_active?: boolean | null;
  is_online?: boolean | null;
};

type SalaryOrder = {
  id: string;
  order_amount?: number | null;
  price?: number | null;
  staff_salary?: number | null;
  bonus_amount?: number | null;
  status?: string | null;
  is_deleted?: boolean | null;
};

type Bonus = {
  id: string;
  amount?: number | null;
  status?: string | null;
};

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

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export default function XYAdminPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<SalaryOrder[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  const activeStaffCount = staffList.filter(
    (staff) => staff.is_active !== false
  ).length;

  const onlineStaffCount = staffList.filter((staff) => staff.is_online).length;

  const monthIncome = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.order_amount || order.price || 0),
      0
    );
  }, [orders]);

  const monthSalary = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum + Number(order.staff_salary || 0) + Number(order.bonus_amount || 0),
      0
    );
  }, [orders]);

  const monthBonus = useMemo(() => {
    return bonuses.reduce((sum, bonus) => sum + Number(bonus.amount || 0), 0);
  }, [bonuses]);

  const unpaidOrders = orders.filter(
    (order) => order.status !== "已發薪"
  ).length;
  const unpaidBonuses = bonuses.filter(
    (bonus) => bonus.status !== "已發薪"
  ).length;

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

      await loadDashboard();
    } catch (error) {
      console.error("xy admin boot error:", error);
      alert("檢查 XY 後台權限失敗");
      window.location.href = "/xy/staff";
    } finally {
      setChecking(false);
    }
  }

  async function loadDashboard() {
    setLoading(true);

    const { startIso, endIso } = getCurrentMonthRange();

    const [staffRes, orderRes, bonusRes] = await Promise.all([
      supabase
        .from("xy_players")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("xy_play_orders")
        .select("*")
        .or("is_deleted.eq.false,is_deleted.is.null")
        .gte("order_finished_at", startIso)
        .lte("order_finished_at", endIso)
        .order("order_finished_at", { ascending: false }),
      supabase
        .from("xy_players_bonus")
        .select("*")
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
      console.error("load xy orders error:", orderRes.error);
      setOrders([]);
    } else {
      setOrders((orderRes.data || []) as SalaryOrder[]);
    }

    if (bonusRes.error) {
      console.error("load xy bonuses error:", bonusRes.error);
      setBonuses([]);
    } else {
      setBonuses((bonusRes.data || []) as Bonus[]);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/xy/admin-login";
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
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-orange-600">XY Admin</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
                XY陪玩｜管理後台
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                管理員工、薪資總表與發薪預覽。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                重新整理
              </button>

              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600"
              >
                <LogOut size={16} />
                登出
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard title="啟用員工" value={`${activeStaffCount} 人`} />
          <StatCard title="目前上線" value={`${onlineStaffCount} 人`} />
          <StatCard title="本月收入" value={money(monthIncome)} />
          <StatCard title="本月薪資" value={money(monthSalary + monthBonus)} />
          <StatCard
            title="待發項目"
            value={`${unpaidOrders + unpaidBonuses} 筆`}
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <HomeCard
            href="/xy/admin/staff"
            icon={<Users size={24} />}
            title="員工管理"
            desc="管理員工資料、銀行帳號、生日月份、上下線狀態。"
          />

          <HomeCard
            href="/xy/admin/salary"
            icon={<WalletCards size={24} />}
            title="薪資總表"
            desc="新增訂單、獎金扣除、福利獎金與薪資查詢。"
          />

          <HomeCard
            href="/xy/admin/payroll"
            icon={<Banknote size={24} />}
            title="發薪模式"
            desc="預覽有薪水要發的員工、銀行帳號、獎金與應發合計。"
          />

          <HomeCard
            href="/xy/staff"
            icon={<CalendarHeart size={24} />}
            title="員工端預覽"
            desc="查看員工看到的薪資中心、抽成進度與福利狀態。"
          />
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <Settings2 size={20} className="text-orange-500" />
            XY 薪資規則
          </h2>

          <div className="mt-3 grid gap-3 text-sm font-semibold text-slate-600 md:grid-cols-2">
            <div className="rounded-2xl bg-orange-50/70 p-4">
              基礎抽成 75%，累積薪資滿 5000 後永久變 80%。
            </div>

            <div className="rounded-2xl bg-orange-50/70 p-4">
              單筆金額大於 4999 時，75% 該筆變 80%，80% 該筆變 82%。
            </div>

            <div className="rounded-2xl bg-orange-50/70 p-4">
              當月累積薪水大於 5000，另得 250 元，每月一次。
            </div>

            <div className="rounded-2xl bg-orange-50/70 p-4">
              生日月份當月另得 200 元生日禮金，每月一次。
            </div>
          </div>
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

function HomeCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
        {icon}
      </div>

      <h2 className="mt-5 text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {desc}
      </p>
    </Link>
  );
}
