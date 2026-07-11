"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CalendarHeart,
  Gift,
  LogOut,
  Power,
  RefreshCw,
  Save,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";

type Staff = {
  id?: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  real_name?: string | null;
  gender?: string | null;
  birthday?: string | null;
  birthday_month?: number | null;
  bank_name?: string | null;
  bank_account?: string | null;
  avatar_url?: string | null;
  is_online?: boolean | null;
  is_active?: boolean | null;
  can_take_order?: boolean | null;
  commission_tier?: string | null;
  commission_note?: string | null;
  commission_accumulated_salary?: number | null;
  commission_80_unlocked?: boolean | null;
  created_at?: string | null;
};

type SalaryOrder = {
  id: string;
  order_no?: string | null;
  order_id?: string | null;
  discord_id: string;
  staff_name?: string | null;
  customer_name?: string | null;
  customer_id?: string | null;
  service_name?: string | null;
  service?: string | null;
  order_amount?: number | null;
  price?: number | null;
  staff_salary?: number | null;
  bonus_amount?: number | null;
  salary_rate?: number | null;
  salary_level?: string | null;
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
  created_at?: string | null;
};

type ProfileForm = {
  display_name: string;
  real_name: string;
  gender: string;
  birthday: string;
  birthday_month: string;
  bank_name: string;
  bank_account: string;
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

function formatMonthLabel(monthText: string) {
  if (!monthText) return "所選月份";

  const [yearText, monthTextValue] = monthText.split("-");
  const month = Number(monthTextValue);

  if (!yearText || !month) return "所選月份";

  return `${yearText} 年 ${month} 月`;
}

function getSelectedMonthNumber(monthText: string) {
  const month = Number(monthText.split("-")[1] || 0);

  return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
}

function money(value: number | null | undefined) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function getManualBaseRate(tier?: string | null) {
  if (tier === "rate_75") return 75;
  if (tier === "rate_80") return 80;
  return null;
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

function getOrderAmount(order: SalaryOrder) {
  return Number(order.order_amount ?? order.price ?? 0);
}

function getOrderService(order: SalaryOrder) {
  return order.service_name || order.service || "-";
}

function getOrderCustomer(order: SalaryOrder) {
  return order.customer_name || order.customer_id || "-";
}

function getOrderSourceDate(order: SalaryOrder) {
  return (
    order.order_finished_at || order.completed_at || order.created_at || null
  );
}

function getDisplayName(staff: Staff | null) {
  if (!staff) return "員工";

  return (
    staff.display_name ||
    staff.real_name ||
    staff.discord_name ||
    staff.discord_id ||
    "員工"
  );
}

function getBirthdayMonth(staff: Staff | null) {
  if (!staff) return null;

  if (
    staff.birthday_month &&
    staff.birthday_month >= 1 &&
    staff.birthday_month <= 12
  ) {
    return staff.birthday_month;
  }

  if (!staff.birthday) return null;

  const date = new Date(staff.birthday);

  if (Number.isNaN(date.getTime())) return null;

  return date.getMonth() + 1;
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

function getDiscordNameFromSession(session: any) {
  const metadata = session?.user?.user_metadata || {};

  return (
    metadata.global_name ||
    metadata.full_name ||
    metadata.name ||
    metadata.preferred_username ||
    metadata.user_name ||
    metadata.username ||
    "Discord 使用者"
  );
}

function getAvatarFromSession(session: any) {
  const metadata = session?.user?.user_metadata || {};
  return metadata.avatar_url || metadata.picture || null;
}

function getBenefitText(bonusList: Bonus[], keyText: string) {
  const found = bonusList.find((bonus) =>
    String(bonus.description || "").includes(keyText)
  );

  return found ? "已發放" : "尚未發放";
}

export default function XYStaffPage() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [salaryOrders, setSalaryOrders] = useState<SalaryOrder[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthInput());

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    display_name: "",
    real_name: "",
    gender: "",
    birthday: "",
    birthday_month: "",
    bank_name: "",
    bank_account: "",
  });

  const monthOrderCount = salaryOrders.length;

  const monthOrderAmount = useMemo(() => {
    return salaryOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
  }, [salaryOrders]);

  const monthSalary = useMemo(() => {
    return salaryOrders.reduce(
      (sum, order) =>
        sum + Number(order.staff_salary || 0) + Number(order.bonus_amount || 0),
      0
    );
  }, [salaryOrders]);

  const monthBonus = useMemo(() => {
    return bonuses.reduce((sum, bonus) => sum + Number(bonus.amount || 0), 0);
  }, [bonuses]);

  const unpaidAmount = useMemo(() => {
    const orderTotal = salaryOrders
      .filter((order) => order.status !== "已發薪")
      .reduce(
        (sum, order) =>
          sum +
          Number(order.staff_salary || 0) +
          Number(order.bonus_amount || 0),
        0
      );

    return orderTotal + monthBonus;
  }, [salaryOrders, monthBonus]);

  const manualBaseRate = getManualBaseRate(staff?.commission_tier);
  const accumulatedSalary = Number(staff?.commission_accumulated_salary || 0);
  const autoBaseRate =
    staff?.commission_80_unlocked || accumulatedSalary >= 5000 ? 80 : 75;
  const currentBaseRate = manualBaseRate || autoBaseRate;
  const progress5000 = Math.min(
    100,
    Math.round((accumulatedSalary / 5000) * 100)
  );
  const progress5000Salary = Math.min(
    100,
    Math.round((monthSalary / 5000) * 100)
  );

  const selectedMonthNumber = getSelectedMonthNumber(selectedMonth);
  const staffBirthdayMonth = getBirthdayMonth(staff);
  const isBirthdayMonth =
    staffBirthdayMonth !== null && staffBirthdayMonth === selectedMonthNumber;

  const salaryBenefitText = getBenefitText(
    bonuses,
    `每月薪資達標獎金｜${selectedMonth}`
  );

  const birthdayBenefitText = getBenefitText(
    bonuses,
    `生日禮金｜${selectedMonth}`
  );

  useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function boot() {
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        window.location.href = "/xy/login";
        return;
      }

      const discordId = getDiscordIdFromSession(session);

      if (!discordId) {
        alert("無法取得 Discord ID，請重新登入。");
        await supabase.auth.signOut();
        window.location.href = "/xy/login";
        return;
      }

      const ensureRes = await fetch("/api/xy/ensure-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          access_token: session.access_token,
          discord_id: discordId,
          discord_name: getDiscordNameFromSession(session),
          avatar_url: getAvatarFromSession(session),
        }),
      });

      const ensureData = await ensureRes.json();

      if (!ensureRes.ok || !ensureData.ok) {
        alert(ensureData.message || "XY 員工身分驗證失敗");
        await supabase.auth.signOut();
        window.location.href = "/xy/login";
        return;
      }

      const staffData = (ensureData.staff || ensureData.player) as Staff | null;

      if (!staffData?.discord_id) {
        alert("XY 員工資料建立失敗，請重新登入。");
        await supabase.auth.signOut();
        window.location.href = "/xy/login";
        return;
      }

      setStaff(staffData);
      setProfileForm({
        display_name: staffData.display_name || "",
        real_name: staffData.real_name || "",
        gender: staffData.gender || "",
        birthday: staffData.birthday || "",
        birthday_month: staffData.birthday_month
          ? String(staffData.birthday_month)
          : "",
        bank_name: staffData.bank_name || "",
        bank_account: staffData.bank_account || "",
      });

      await loadSalaryData(staffData.discord_id);
    } catch (error) {
      console.error("xy staff boot error:", error);
      alert("讀取 XY 員工資料失敗");
    } finally {
      setLoading(false);
    }
  }

  async function loadSalaryData(discordId: string) {
    const { startIso, endIso } = getMonthRange(selectedMonth);

    const { data: monthOrders, error: monthError } = await supabase
      .from("xy_play_orders")
      .select("*")
      .eq("discord_id", discordId)
      .or("is_deleted.eq.false,is_deleted.is.null")
      .gte("order_finished_at", startIso)
      .lte("order_finished_at", endIso)
      .order("order_finished_at", { ascending: false });

    if (monthError) {
      console.error("load xy salary orders error:", monthError);
      setSalaryOrders([]);
    } else {
      setSalaryOrders((monthOrders || []) as SalaryOrder[]);
    }

    const { data: bonusData, error: bonusError } = await supabase
      .from("xy_players_bonus")
      .select("*")
      .eq("discord_id", discordId)
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: false });

    if (bonusError) {
      console.error("load xy bonus error:", bonusError);
      setBonuses([]);
    } else {
      setBonuses((bonusData || []) as Bonus[]);
    }
  }

  async function refreshAll() {
    if (!staff) return;

    setRefreshing(true);

    try {
      await loadSalaryData(staff.discord_id);
    } finally {
      setRefreshing(false);
    }
  }

  async function saveProfile() {
    if (!staff) return;

    const birthdayMonthNumber = profileForm.birthday_month
      ? Number(profileForm.birthday_month)
      : null;

    if (
      birthdayMonthNumber !== null &&
      (!Number.isInteger(birthdayMonthNumber) ||
        birthdayMonthNumber < 1 ||
        birthdayMonthNumber > 12)
    ) {
      alert("生日月份請選擇 1 到 12 月");
      return;
    }

    setProfileSaving(true);

    const { data, error } = await supabase
      .from("xy_players")
      .update({
        display_name: profileForm.display_name || null,
        real_name: profileForm.real_name || null,
        gender: profileForm.gender || null,
        birthday: profileForm.birthday || null,
        birthday_month: birthdayMonthNumber,
        bank_name: profileForm.bank_name || null,
        bank_account: profileForm.bank_account || null,
        updated_at: new Date().toISOString(),
      })
      .eq("discord_id", staff.discord_id)
      .select("*")
      .single();

    setProfileSaving(false);

    if (error) {
      console.error("save xy profile error:", error);
      alert("儲存 XY 個人資料失敗");
      return;
    }

    setStaff(data as Staff);
    alert("個人資料已儲存");
  }

  async function toggleOnline() {
    if (!staff) return;

    const nextOnline = !staff.is_online;
    setOnlineSaving(true);

    const { data, error } = await supabase
      .from("xy_players")
      .update({
        is_online: nextOnline,
        updated_at: new Date().toISOString(),
      })
      .eq("discord_id", staff.discord_id)
      .select("*")
      .single();

    setOnlineSaving(false);

    if (error) {
      console.error("toggle xy online error:", error);
      alert("更新接單狀態失敗");
      return;
    }

    setStaff(data as Staff);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/xy/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] text-slate-700">
        <div className="rounded-[28px] border border-orange-100 bg-white px-8 py-7 text-center shadow-sm shadow-orange-100">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-300 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">
            正在讀取 XY 員工資料...
          </p>
        </div>
      </main>
    );
  }

  if (!staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] text-slate-700">
        <div className="rounded-[28px] border border-orange-100 bg-white px-8 py-7 text-center shadow-sm shadow-orange-100">
          <p className="text-sm font-semibold text-slate-600">
            找不到 XY 員工資料，請重新登入。
          </p>

          <button
            onClick={logout}
            className="mt-5 rounded-full bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600"
          >
            重新登入
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7ed] px-5 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[30px] border border-orange-100 bg-white px-6 py-5 shadow-sm shadow-orange-100">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-orange-100 text-orange-600">
                {staff.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staff.avatar_url}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={30} />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-orange-600">XY Staff</p>

                <h1 className="mt-1 text-2xl font-black text-slate-900">
                  XY陪玩｜員工薪資中心
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {getDisplayName(staff)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={refreshAll}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-orange-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
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
          <StatCard title="月份訂單" value={`${monthOrderCount} 筆`} />
          <StatCard title="本月接單金額" value={money(monthOrderAmount)} />
          <StatCard title="月份薪資" value={money(monthSalary)} />
          <StatCard title="未發薪" value={money(unpaidAmount)} />
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="薪資月份">
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </Field>

            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              查詢月份
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-orange-600">
                  <Trophy size={18} />
                  我的抽成規則
                </p>

                <div className="mt-4 flex items-end gap-2">
                  <p className="text-4xl font-black text-slate-900">
                    {currentBaseRate}%
                  </p>

                  <p className="pb-1 text-sm font-semibold text-slate-500">
                    {manualBaseRate ? "後台手動設定" : "永久累積基礎抽成"}
                  </p>
                </div>

                <div className="mt-3 space-y-1 text-sm leading-6 text-slate-500">
                  <p>自動判定：基礎抽成 75%</p>
                  <p>自動判定累積薪資滿 5000 後：永久解鎖基礎抽成 80%</p>
                  <p>後台手動設定 75% 或 80% 時，會優先套用該檔位。</p>
                  <p>若該筆訂單金額大於 4999：75% 會變 80%，80% 會變 82%</p>
                  {staff?.commission_note ? (
                    <p>備註：{staff.commission_note}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <ProgressBar
                  title="累積薪資 5000 永久解鎖進度"
                  current={accumulatedSalary}
                  target={5000}
                  percent={progress5000}
                />

                <ProgressBar
                  title="本月薪資 5000 福利進度"
                  current={monthSalary}
                  target={5000}
                  percent={progress5000Salary}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <CalendarHeart size={20} className="text-orange-500" />
                本月福利狀態
              </h2>

              <div className="mt-4 space-y-3">
                <BenefitRow
                  title="薪資達標獎金"
                  desc="當月累積薪資大於 5000，可得 250 元，每月一次。"
                  status={
                    monthSalary > 5000
                      ? salaryBenefitText
                      : `尚未達標，還差 ${money(
                          Math.max(5000 - monthSalary, 0)
                        )}`
                  }
                />

                <BenefitRow
                  title="生日禮金"
                  desc="生日月份符合當月，可得 200 元，每月一次。"
                  status={isBirthdayMonth ? birthdayBenefitText : "非生日月份"}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    接單狀態
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    管理員可在後台看到你的上線狀態。
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    staff.is_online
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {staff.is_online ? "上線中" : "下線中"}
                </span>
              </div>

              <button
                onClick={toggleOnline}
                disabled={onlineSaving}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white ${
                  staff.is_online
                    ? "bg-slate-500 hover:bg-slate-600"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                <Power size={16} />
                {onlineSaving
                  ? "更新中..."
                  : staff.is_online
                  ? "切換為下線"
                  : "切換為上線"}
              </button>
            </div>

            <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <UserRound size={20} className="text-orange-500" />
                個人資料
              </h2>

              <div className="mt-5 space-y-4">
                <Field label="顯示名稱">
                  <input
                    value={profileForm.display_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        display_name: event.target.value,
                      }))
                    }
                    placeholder="例如：小橘"
                  />
                </Field>

                <Field label="真實姓名">
                  <input
                    value={profileForm.real_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        real_name: event.target.value,
                      }))
                    }
                    placeholder="用於發薪紀錄"
                  />
                </Field>

                <Field label="性別">
                  <select
                    value={profileForm.gender}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        gender: event.target.value,
                      }))
                    }
                  >
                    <option value="">未填寫</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </Field>

                <Field label="生日日期">
                  <input
                    type="date"
                    value={profileForm.birthday}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        birthday: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="生日月份">
                  <select
                    value={profileForm.birthday_month}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        birthday_month: event.target.value,
                      }))
                    }
                  >
                    <option value="">未填寫</option>
                    {Array.from({ length: 12 }).map((_, index) => {
                      const month = index + 1;

                      return (
                        <option key={month} value={String(month)}>
                          {month} 月
                        </option>
                      );
                    })}
                  </select>
                </Field>

                <Field label="銀行名稱">
                  <input
                    value={profileForm.bank_name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        bank_name: event.target.value,
                      }))
                    }
                    placeholder="例如：玉山銀行"
                  />
                </Field>

                <Field label="銀行帳號">
                  <input
                    value={profileForm.bank_account}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        bank_account: event.target.value,
                      }))
                    }
                    placeholder="請輸入薪轉帳號"
                  />
                </Field>

                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
                >
                  <Save size={16} />
                  {profileSaving ? "儲存中..." : "儲存個人資料"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
              <div className="border-b border-orange-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <WalletCards size={20} className="text-orange-500" />
                  {formatMonthLabel(selectedMonth)}訂單
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  顯示所選月份的薪資訂單。
                </p>
              </div>

              {salaryOrders.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                  目前沒有這個月份的訂單
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>完成時間</th>
                        <th>客人</th>
                        <th>項目</th>
                        <th>訂單金額</th>
                        <th>抽成</th>
                        <th>薪資</th>
                        <th>獎金</th>
                        <th>狀態</th>
                      </tr>
                    </thead>

                    <tbody>
                      {salaryOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{formatDateTime(getOrderSourceDate(order))}</td>
                          <td>{getOrderCustomer(order)}</td>
                          <td>{getOrderService(order)}</td>
                          <td className="font-bold text-slate-700">
                            {money(getOrderAmount(order))}
                          </td>
                          <td>{Number(order.salary_rate || 0)}%</td>
                          <td className="font-bold text-orange-600">
                            {money(order.staff_salary)}
                          </td>
                          <td>{money(order.bonus_amount)}</td>
                          <td>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                order.status === "已發薪"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {order.status || "未發薪"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
              <div className="border-b border-orange-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <Gift size={20} className="text-orange-500" />
                  {formatMonthLabel(selectedMonth)}獎金 / 扣除
                </h2>
              </div>

              {bonuses.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm font-semibold text-slate-400">
                  目前沒有這個月份的獎金或扣除
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>時間</th>
                        <th>類型</th>
                        <th>說明</th>
                        <th>金額</th>
                      </tr>
                    </thead>

                    <tbody>
                      {bonuses.map((bonus) => (
                        <tr key={bonus.id}>
                          <td>{formatDateTime(bonus.created_at)}</td>
                          <td>{bonus.bonus_type || "-"}</td>
                          <td>{bonus.description || "-"}</td>
                          <td
                            className={`font-bold ${
                              Number(bonus.amount || 0) < 0
                                ? "text-red-500"
                                : "text-orange-600"
                            }`}
                          >
                            {money(bonus.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function ProgressBar({
  title,
  current,
  target,
  percent,
}: {
  title: string;
  current: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="rounded-[20px] border border-orange-100 bg-orange-50/40 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-slate-700">{title}</p>
        <p className="text-sm font-bold text-orange-600">{percent}%</p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          {money(current)} / {money(target)}
        </span>
        <span>還差 {money(Math.max(target - current, 0))}</span>
      </div>
    </div>
  );
}

function BenefitRow({
  title,
  desc,
  status,
}: {
  title: string;
  desc: string;
  status: string;
}) {
  return (
    <div className="rounded-[18px] border border-orange-100 bg-orange-50/40 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-600">
          {status}
        </span>
      </div>
    </div>
  );
}
