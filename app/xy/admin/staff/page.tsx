"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CalendarHeart,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  UserRound,
  Users,
} from "lucide-react";

type Staff = {
  id: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  real_name?: string | null;
  gender?: string | null;
  birthday?: string | null;
  birthday_month?: number | null;
  bank_name?: string | null;
  bank_account?: string | null;
  salary_channel_id?: string | null;
  avatar_url?: string | null;
  is_active?: boolean | null;
  is_online?: boolean | null;
  can_take_order?: boolean | null;
  commission_tier?: string | null;
  commission_note?: string | null;
  commission_accumulated_salary?: number | null;
  commission_80_unlocked?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type StaffForm = {
  display_name: string;
  real_name: string;
  gender: string;
  birthday: string;
  birthday_month: string;
  bank_name: string;
  bank_account: string;
  salary_channel_id: string;
  commission_tier: string;
  commission_note: string;
  commission_accumulated_salary: string;
  is_active: boolean;
  is_online: boolean;
  can_take_order: boolean;
};

function getDisplayName(staff: Staff | null) {
  if (!staff) return "未選擇員工";

  return (
    staff.display_name ||
    staff.real_name ||
    staff.discord_name ||
    staff.discord_id ||
    "未知員工"
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

function getBirthdayMonthLabel(staff: Staff | null) {
  const month = getBirthdayMonth(staff);

  return month ? `${month} 月` : "未填寫";
}

function getCommissionTierLabel(value?: string | null) {
  if (value === "rate_75") return "75%｜手動設定";
  if (value === "rate_80") return "80%｜手動設定";
  return "自動判定";
}

function getCommissionTierRank(value?: string | null) {
  if (value === "rate_80") return 80;
  if (value === "rate_75") return 75;
  return 0;
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

function makeForm(staff: Staff | null): StaffForm {
  return {
    display_name: staff?.display_name || "",
    real_name: staff?.real_name || "",
    gender: staff?.gender || "",
    birthday: staff?.birthday || "",
    birthday_month: staff?.birthday_month ? String(staff.birthday_month) : "",
    bank_name: staff?.bank_name || "",
    bank_account: staff?.bank_account || "",
    salary_channel_id: staff?.salary_channel_id || "",
    commission_tier: staff?.commission_tier || "auto",
    commission_note: staff?.commission_note || "",
    commission_accumulated_salary: String(
      Number(staff?.commission_accumulated_salary || 0)
    ),
    is_active: staff?.is_active !== false,
    is_online: Boolean(staff?.is_online),
    can_take_order: staff?.can_take_order !== false,
  };
}

export default function XYAdminStaffPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>(makeForm(null));
  const [keyword, setKeyword] = useState("");
  const [sortMode, setSortMode] = useState("created_desc");
  const [saving, setSaving] = useState(false);

  const filteredStaff = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    let list = [...staffList];

    if (key) {
      list = list.filter((staff) => {
        const text = [
          staff.discord_id,
          staff.discord_name,
          staff.display_name,
          staff.real_name,
          staff.salary_channel_id,
          getBirthdayMonthLabel(staff),
          getCommissionTierLabel(staff.commission_tier),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(key);
      });
    }

    if (sortMode === "name_asc") {
      list.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
    }

    if (sortMode === "name_desc") {
      list.sort((a, b) => getDisplayName(b).localeCompare(getDisplayName(a)));
    }

    if (sortMode === "birthday_asc") {
      list.sort(
        (a, b) => (getBirthdayMonth(a) || 99) - (getBirthdayMonth(b) || 99)
      );
    }

    if (sortMode === "birthday_desc") {
      list.sort(
        (a, b) => (getBirthdayMonth(b) || 0) - (getBirthdayMonth(a) || 0)
      );
    }

    if (sortMode === "online_first") {
      list.sort(
        (a, b) => Number(Boolean(b.is_online)) - Number(Boolean(a.is_online))
      );
    }

    if (sortMode === "active_first") {
      list.sort(
        (a, b) => Number(a.is_active !== false) - Number(b.is_active !== false)
      );
    }

    if (sortMode === "commission_desc") {
      list.sort(
        (a, b) =>
          getCommissionTierRank(b.commission_tier) -
          getCommissionTierRank(a.commission_tier)
      );
    }

    if (sortMode === "commission_asc") {
      list.sort(
        (a, b) =>
          getCommissionTierRank(a.commission_tier) -
          getCommissionTierRank(b.commission_tier)
      );
    }

    return list;
  }, [staffList, keyword, sortMode]);

  const activeCount = staffList.filter(
    (staff) => staff.is_active !== false
  ).length;
  const onlineCount = staffList.filter((staff) => staff.is_online).length;
  const birthdayFilledCount = staffList.filter(
    (staff) => getBirthdayMonth(staff) !== null
  ).length;

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

      await loadStaff();
    } catch (error) {
      console.error("xy admin staff boot error:", error);
      alert("檢查 XY 後台權限失敗");
      window.location.href = "/xy/staff";
    } finally {
      setChecking(false);
    }
  }

  async function loadStaff() {
    setLoading(true);

    const { data, error } = await supabase
      .from("xy_players")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error("load xy staff error:", error);
      alert("讀取 XY 員工資料失敗");
      return;
    }

    const list = (data || []) as Staff[];
    setStaffList(list);

    if (!selectedStaff && list.length > 0) {
      selectStaff(list[0]);
    } else if (selectedStaff) {
      const updated = list.find((item) => item.id === selectedStaff.id);
      if (updated) selectStaff(updated);
    }
  }

  function selectStaff(staff: Staff) {
    setSelectedStaff(staff);
    setForm(makeForm(staff));
  }

  function updateForm<K extends keyof StaffForm>(key: K, value: StaffForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function saveStaff() {
    if (!selectedStaff) return;

    const birthdayMonthNumber = form.birthday_month
      ? Number(form.birthday_month)
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

    setSaving(true);

    const accumulatedSalary = Number(form.commission_accumulated_salary || 0);
    if (!Number.isFinite(accumulatedSalary) || accumulatedSalary < 0) {
      alert("目前累積薪資必須是 0 以上的數字");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("xy_players")
      .update({
        display_name: form.display_name || null,
        real_name: form.real_name || null,
        gender: form.gender || null,
        birthday: form.birthday || null,
        birthday_month: birthdayMonthNumber,
        bank_name: form.bank_name || null,
        bank_account: form.bank_account || null,
        salary_channel_id: form.salary_channel_id || null,
        commission_tier: form.commission_tier || "auto",
        commission_note: form.commission_note || null,
        commission_accumulated_salary: accumulatedSalary,
        commission_80_unlocked:
          Boolean(selectedStaff.commission_80_unlocked) ||
          accumulatedSalary >= 7000,
        is_active: form.is_active,
        is_online: form.is_online,
        can_take_order: form.can_take_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedStaff.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      console.error("save xy staff error:", error);
      alert("儲存 XY 員工資料失敗");
      return;
    }

    const updated = data as Staff;

    setSelectedStaff(updated);
    setStaffList((prev) =>
      prev.map((staff) => (staff.id === updated.id ? updated : staff))
    );

    alert("XY 員工資料已儲存");
  }

  async function refresh() {
    await loadStaff();
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
              <Link
                href="/xy/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                <ArrowLeft size={16} />回 XY 管理後台
              </Link>

              <p className="mt-4 text-sm font-bold text-orange-600">XY Admin</p>

              <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
                XY 員工管理
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                管理員工資料、生日月份、上下線狀態、抽成檔位與薪資頻道。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/xy/admin/payroll"
                className="inline-flex items-center justify-center rounded-full border border-orange-100 bg-white px-5 py-2.5 text-sm font-bold text-orange-600 hover:bg-orange-50"
              >
                發薪模式
              </Link>

              <button
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                重新整理
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard title="員工總數" value={`${staffList.length} 人`} />
          <StatCard title="啟用中" value={`${activeCount} 人`} />
          <StatCard title="目前上線" value={`${onlineCount} 人`} />
          <StatCard title="已填生日月份" value={`${birthdayFilledCount} 人`} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
          <div className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
            <div className="border-b border-orange-100 p-5">
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Users size={20} className="text-orange-500" />
                員工列表
              </h2>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2">
                <Search size={17} className="text-orange-500" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜尋名稱、Discord ID、頻道 ID、生日月份"
                  className="min-h-0 flex-1 border-none bg-transparent p-0 text-sm outline-none focus:shadow-none"
                />
              </div>

              <div className="mt-3">
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="w-full rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="created_desc">排序：最新建立</option>
                  <option value="name_asc">名稱排序：A 到 Z</option>
                  <option value="name_desc">名稱排序：Z 到 A</option>
                  <option value="birthday_asc">生日月份：1 月到 12 月</option>
                  <option value="birthday_desc">生日月份：12 月到 1 月</option>
                  <option value="online_first">上線優先</option>
                  <option value="active_first">啟用優先</option>
                  <option value="commission_desc">抽成高到低</option>
                  <option value="commission_asc">抽成低到高</option>
                </select>
              </div>
            </div>

            <div className="max-h-[720px] overflow-y-auto p-3">
              {loading ? (
                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                  讀取中...
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                  沒有符合的員工
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStaff.map((staff) => {
                    const active = selectedStaff?.id === staff.id;

                    return (
                      <button
                        key={staff.id}
                        onClick={() => selectStaff(staff)}
                        className={`w-full rounded-[20px] border px-4 py-3 text-left transition ${
                          active
                            ? "border-orange-300 bg-orange-50 shadow-sm"
                            : "border-orange-100 bg-white hover:bg-orange-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-orange-100 text-orange-600">
                            {staff.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={staff.avatar_url}
                                alt="avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={22} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900">
                              {getDisplayName(staff)}
                            </p>

                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                              {staff.discord_id}
                            </p>

                            <p className="mt-1 flex items-center gap-1 truncate text-xs font-bold text-orange-600">
                              <CalendarHeart size={13} />
                              生日月份：{getBirthdayMonthLabel(staff)}
                            </p>

                            <p className="mt-1 truncate text-xs font-bold text-amber-600">
                              抽成：
                              {getCommissionTierLabel(staff.commission_tier)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                staff.is_active !== false
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {staff.is_active !== false ? "啟用" : "停用"}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                staff.is_online
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {staff.is_online ? "上線" : "下線"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <Settings2 size={20} className="text-orange-500" />
                  員工資料
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  目前選擇：{getDisplayName(selectedStaff)}
                </p>
              </div>

              <button
                onClick={saveStaff}
                disabled={!selectedStaff || saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "儲存中..." : "儲存員工資料"}
              </button>
            </div>

            {!selectedStaff ? (
              <div className="mt-8 rounded-2xl bg-orange-50 px-5 py-8 text-center text-sm font-semibold text-slate-400">
                請先選擇一位員工
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="顯示名稱">
                  <input
                    value={form.display_name}
                    onChange={(event) =>
                      updateForm("display_name", event.target.value)
                    }
                    placeholder="顯示於薪資網"
                  />
                </Field>

                <Field label="真實姓名">
                  <input
                    value={form.real_name}
                    onChange={(event) =>
                      updateForm("real_name", event.target.value)
                    }
                    placeholder="用於發薪紀錄"
                  />
                </Field>

                <Field label="性別">
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      updateForm("gender", event.target.value)
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
                    value={form.birthday}
                    onChange={(event) =>
                      updateForm("birthday", event.target.value)
                    }
                  />
                </Field>

                <Field label="生日月份">
                  <select
                    value={form.birthday_month}
                    onChange={(event) =>
                      updateForm("birthday_month", event.target.value)
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
                    value={form.bank_name}
                    onChange={(event) =>
                      updateForm("bank_name", event.target.value)
                    }
                    placeholder="例如：玉山銀行"
                  />
                </Field>

                <Field label="銀行帳號">
                  <input
                    value={form.bank_account}
                    onChange={(event) =>
                      updateForm("bank_account", event.target.value)
                    }
                    placeholder="薪轉帳號"
                  />
                </Field>

                <Field label="個人薪資頻道 ID">
                  <input
                    value={form.salary_channel_id}
                    onChange={(event) =>
                      updateForm("salary_channel_id", event.target.value)
                    }
                    placeholder="Discord 頻道 ID"
                  />
                </Field>

                <Field label="抽成檔位">
                  <select
                    value={form.commission_tier}
                    onChange={(event) =>
                      updateForm("commission_tier", event.target.value)
                    }
                  >
                    <option value="auto">自動判定</option>
                    <option value="rate_75">75%｜手動設定</option>
                    <option value="rate_80">80%｜手動設定</option>
                  </select>
                </Field>

                <Field label="抽成備註">
                  <input
                    value={form.commission_note}
                    onChange={(event) =>
                      updateForm("commission_note", event.target.value)
                    }
                    placeholder="例如：新人手動 75%、活動期間 80%"
                  />
                </Field>

                <Field label="目前累積薪資">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.commission_accumulated_salary}
                    onChange={(event) =>
                      updateForm(
                        "commission_accumulated_salary",
                        event.target.value
                      )
                    }
                    placeholder="例如：6500"
                  />
                </Field>

                <Field label="80% 永久解鎖">
                  <input
                    value={
                      selectedStaff.commission_80_unlocked ||
                      Number(form.commission_accumulated_salary || 0) >= 7000
                        ? "已永久解鎖"
                        : "尚未達標"
                    }
                    readOnly
                  />
                </Field>

                <div className="md:col-span-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-sm font-black text-orange-700">
                    XY 抽成規則
                  </p>

                  <div className="mt-2 space-y-1 text-sm font-semibold text-slate-600">
                    <p>自動判定：基礎抽成 75%。</p>
                    <p>累積薪資滿 7000 後，基礎抽成永久變為 80%。</p>
                    <p>手動設定 75% 或 80% 時，會優先套用該員工檔位。</p>
                    <p>
                      若單筆金額大於 4999，75% 的該筆變 80%，80% 的該筆變 82%。
                    </p>
                    <p>當月累積薪水大於 5000，另得 250 元，每月一次。</p>
                    <p>生日月份當月另得 200 元生日禮金，每月一次。</p>
                  </div>
                </div>

                <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
                  <SwitchBox
                    title="帳號啟用"
                    desc="關閉後不列入可管理員工"
                    checked={form.is_active}
                    onChange={() => updateForm("is_active", !form.is_active)}
                  />

                  <SwitchBox
                    title="目前上線"
                    desc="控制員工目前接單狀態"
                    checked={form.is_online}
                    onChange={() => updateForm("is_online", !form.is_online)}
                  />

                  <SwitchBox
                    title="允許接單"
                    desc="關閉後不列入接單名單"
                    checked={form.can_take_order}
                    onChange={() =>
                      updateForm("can_take_order", !form.can_take_order)
                    }
                  />
                </div>
              </div>
            )}
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

function SwitchBox({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-[20px] border px-4 py-3 text-left transition ${
        checked
          ? "border-orange-200 bg-orange-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p>
        </div>

        <span
          className={`h-5 w-5 rounded-full border ${
            checked
              ? "border-orange-500 bg-orange-500"
              : "border-slate-300 bg-white"
          }`}
        />
      </div>
    </button>
  );
}
