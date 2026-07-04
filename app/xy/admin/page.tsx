"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Gamepad2,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

type Admin = {
  id: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  is_active?: boolean | null;
};

type Staff = {
  id: string;
  discord_id: string;
  is_active?: boolean | null;
  is_online?: boolean | null;
};

type Order = {
  id: string;
  order_amount?: number | null;
  staff_salary?: number | null;
  bonus_amount?: number | null;
  status?: string | null;
  is_deleted?: boolean | null;
};

type Bonus = {
  id: string;
  amount?: number | null;
};

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

function money(value: number | string | null | undefined) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

export default function XYAdminPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  const activeStaffCount = useMemo(() => {
    return staffList.filter((staff) => staff.is_active !== false).length;
  }, [staffList]);

  const onlineStaffCount = useMemo(() => {
    return staffList.filter((staff) => staff.is_online).length;
  }, [staffList]);

  const totalIncome = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.order_amount || 0),
      0
    );
  }, [orders]);

  const totalSalary = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.staff_salary || 0),
      0
    );
  }, [orders]);

  const totalBonus = useMemo(() => {
    const orderBonus = orders.reduce(
      (sum, order) => sum + Number(order.bonus_amount || 0),
      0
    );

    const extraBonus = bonuses.reduce(
      (sum, bonus) => sum + Number(bonus.amount || 0),
      0
    );

    return orderBonus + extraBonus;
  }, [orders, bonuses]);

  const unpaidAmount = useMemo(() => {
    const unpaidOrders = orders
      .filter((order) => order.status !== "已發薪")
      .reduce(
        (sum, order) =>
          sum +
          Number(order.staff_salary || 0) +
          Number(order.bonus_amount || 0),
        0
      );

    const bonusTotal = bonuses.reduce(
      (sum, bonus) => sum + Number(bonus.amount || 0),
      0
    );

    return unpaidOrders + bonusTotal;
  }, [orders, bonuses]);

  useEffect(() => {
    boot();
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

      const { data: adminData, error } = await supabase
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

      if (!adminData) {
        alert("你沒有 XY 後台管理權限");
        window.location.href = "/xy/staff";
        return;
      }

      setAdmin(adminData as Admin);
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

    const [staffRes, orderRes, bonusRes] = await Promise.all([
      supabase.from("xy_players").select("id, discord_id, is_active, is_online"),
      supabase
        .from("xy_play_orders")
        .select(
          "id, order_amount, staff_salary, bonus_amount, status, is_deleted"
        )
        .or("is_deleted.eq.false,is_deleted.is.null"),
      supabase.from("xy_players_bonus").select("id, amount"),
    ]);

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
      setOrders((orderRes.data || []) as Order[]);
    }

    if (bonusRes.error) {
      console.error("load xy bonus error:", bonusRes.error);
      setBonuses([]);
    } else {
      setBonuses((bonusRes.data || []) as Bonus[]);
    }

    setLoading(false);
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
              <p className="flex items-center gap-2 text-sm font-black text-orange-600">
                <ShieldCheck size={17} />
                XY陪玩 Admin
              </p>

              <h1 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                XY陪玩薪資網｜管理後台
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                管理員工資料、薪資訂單、獎金扣除與發薪狀態。
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-400">
                目前登入：
                {admin?.display_name ||
                  admin?.discord_name ||
                  admin?.discord_id ||
                  "管理員"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-orange-50 disabled:opacity-60"
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

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="員工總數" value={`${staffList.length} 人`} />
          <StatCard title="啟用員工" value={`${activeStaffCount} 人`} />
          <StatCard title="目前上線" value={`${onlineStaffCount} 人`} />
          <StatCard title="訂單筆數" value={`${orders.length} 筆`} />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="總收入" value={money(totalIncome)} />
          <StatCard title="薪資支出" value={money(totalSalary)} />
          <StatCard title="獎金 / 扣除" value={money(totalBonus)} />
          <StatCard title="未發薪" value={money(unpaidAmount)} />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AdminCard
            icon={<Users size={24} />}
            title="員工管理"
            desc="管理員工資料、抽成檔位、上下線狀態、薪資頻道與可接服務。"
            href="/xy/admin/staff"
          />

          <AdminCard
            icon={<WalletCards size={24} />}
            title="薪資總表"
            desc="新增訂單、修改薪資、建立獎金扣除、查詢發薪狀態與批次發薪。"
            href="/xy/admin/salary"
          />

          <AdminCard
            icon={<Gamepad2 size={24} />}
            title="員工端預覽"
            desc="前往 XY 員工薪資中心，確認員工端登入與畫面顯示。"
            href="/xy/staff"
          />
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

function AdminCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm shadow-orange-100 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
        {desc}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600">
        進入功能
        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}