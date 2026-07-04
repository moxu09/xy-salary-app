"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Edit3,
  Gift,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  WalletCards,
} from "lucide-react";

type Staff = {
  id: string;
  discord_id: string;
  discord_name?: string | null;
  display_name?: string | null;
  real_name?: string | null;
  birthday?: string | null;
  birthday_month?: number | null;
  is_active?: boolean | null;
};

type SalaryOrder = {
  id: string;
  order_id?: string | null;
  order_no?: string | null;
  discord_id?: string | null;
  staff_name?: string | null;
  assigned_player?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  service_name?: string | null;
  service?: string | null;
  order_amount?: number | null;
  price?: number | null;
  staff_salary?: number | null;
  bonus_amount?: number | null;
  salary_rate?: number | null;
  salary_level?: string | null;
  platform_income?: number | null;
  platform_expense?: number | null;
  status?: string | null;
  order_finished_at?: string | null;
  completed_at?: string | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Bonus = {
  id: string;
  discord_id: string;
  staff_name?: string | null;
  bonus_type?: string | null;
  description?: string | null;
  amount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrderForm = {
  id: string;
  discord_id: string;
  staff_name: string;
  customer_name: string;
  service_name: string;
  order_amount: string;
  salary_rate: string;
  staff_salary: string;
  bonus_amount: string;
  status: string;
  order_finished_at: string;
};

type BonusForm = {
  discord_id: string;
  staff_name: string;
  bonus_type: string;
  description: string;
  amount: string;
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
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getTodayDatetimeInput() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);

  return local.toISOString().slice(0, 16);
}

function toDatetimeInput(value?: string | null) {
  if (!value) return getTodayDatetimeInput();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return getTodayDatetimeInput();

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);

  return local.toISOString().slice(0, 16);
}

function datetimeInputToIso(value: string) {
  if (!value) return new Date().toISOString();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return new Date().toISOString();

  return date.toISOString();
}

function money(value: number | string | null | undefined) {
  return `$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function numberValue(value: string | number | null | undefined) {
  const n = Number(value || 0);

  return Number.isFinite(n) ? n : 0;
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
  if (!staff) return "未選擇員工";

  return (
    staff.display_name ||
    staff.real_name ||
    staff.discord_name ||
    staff.discord_id ||
    "未知員工"
  );
}

function getOrderStaffName(order: SalaryOrder) {
  return order.staff_name || order.assigned_player || order.discord_id || "-";
}

function getOrderCustomer(order: SalaryOrder) {
  return order.customer_name || order.customer_id || "-";
}

function getOrderService(order: SalaryOrder) {
  return order.service_name || order.service || "-";
}

function getOrderAmount(order: SalaryOrder) {
  return Number(order.order_amount ?? order.price ?? 0);
}

function getOrderSourceDate(order: SalaryOrder) {
  return order.order_finished_at || order.completed_at || order.created_at || null;
}

function getBirthdayMonth(staff: Staff) {
  if (staff.birthday_month && staff.birthday_month >= 1 && staff.birthday_month <= 12) {
    return staff.birthday_month;
  }

  if (!staff.birthday) return null;

  const date = new Date(staff.birthday);

  if (Number.isNaN(date.getTime())) return null;

  return date.getMonth() + 1;
}

function makeEmptyOrderForm(): OrderForm {
  return {
    id: "",
    discord_id: "",
    staff_name: "",
    customer_name: "",
    service_name: "陪玩薪資",
    order_amount: "",
    salary_rate: "75",
    staff_salary: "",
    bonus_amount: "0",
    status: "未發薪",
    order_finished_at: getTodayDatetimeInput(),
  };
}

function makeEmptyBonusForm(): BonusForm {
  return {
    discord_id: "",
    staff_name: "",
    bonus_type: "獎金",
    description: "",
    amount: "",
  };
}

function makeOrderNo() {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const random = Math.floor(Math.random() * 900 + 100);

  return `XY-${timestamp}-${random}`;
}

function getSelectedMonthNumber(monthText: string) {
  const month = Number(monthText.split("-")[1] || 0);

  return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
}

export default function XYAdminSalaryPage() {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<SalaryOrder[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthInput());
  const [keyword, setKeyword] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderForm, setOrderForm] = useState<OrderForm>(makeEmptyOrderForm());
  const [bonusForm, setBonusForm] = useState<BonusForm>(makeEmptyBonusForm());
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingBonus, setSavingBonus] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [generatingBenefits, setGeneratingBenefits] = useState(false);

  const filteredOrders = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      if (staffFilter !== "all" && order.discord_id !== staffFilter) {
        return false;
      }

      if (statusFilter !== "all" && (order.status || "未發薪") !== statusFilter) {
        return false;
      }

      if (!key) return true;

      const text = [
        order.order_no,
        order.order_id,
        order.discord_id,
        order.staff_name,
        order.assigned_player,
        order.customer_name,
        order.customer_id,
        order.service_name,
        order.service,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(key);
    });
  }, [orders, keyword, staffFilter, statusFilter]);

  const filteredBonuses = useMemo(() => {
    if (staffFilter === "all") return bonuses;

    return bonuses.filter((bonus) => bonus.discord_id === staffFilter);
  }, [bonuses, staffFilter]);

  const totalIncome = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + Number(order.order_amount || order.price || 0),
      0
    );
  }, [filteredOrders]);

  const totalSalary = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + Number(order.staff_salary || 0),
      0
    );
  }, [filteredOrders]);

  const totalOrderBonus = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + Number(order.bonus_amount || 0),
      0
    );
  }, [filteredOrders]);

  const totalBonus = useMemo(() => {
    return filteredBonuses.reduce(
      (sum, bonus) => sum + Number(bonus.amount || 0),
      0
    );
  }, [filteredBonuses]);

  const unpaidAmount = useMemo(() => {
    const unpaidOrders = filteredOrders
      .filter((order) => order.status !== "已發薪")
      .reduce(
        (sum, order) =>
          sum +
          Number(order.staff_salary || 0) +
          Number(order.bonus_amount || 0),
        0
      );

    return unpaidOrders + totalBonus;
  }, [filteredOrders, totalBonus]);

  const platformIncome = totalIncome - totalSalary - totalOrderBonus - totalBonus;

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

      await loadAll();
    } catch (error) {
      console.error("xy salary boot error:", error);
      alert("檢查 XY 後台權限失敗");
      window.location.href = "/xy/staff";
    } finally {
      setChecking(false);
    }
  }

  async function loadAll() {
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

    if (staffRes.error) {
      console.error("load xy staff error:", staffRes.error);
      setStaffList([]);
    } else {
      const list = (staffRes.data || []) as Staff[];
      setStaffList(list);

      if (!orderForm.discord_id && list.length > 0) {
        const firstStaff = list[0];

        setOrderForm((prev) => ({
          ...prev,
          discord_id: firstStaff.discord_id,
          staff_name: getDisplayName(firstStaff),
        }));

        setBonusForm((prev) => ({
          ...prev,
          discord_id: firstStaff.discord_id,
          staff_name: getDisplayName(firstStaff),
        }));
      }
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

    setLoading(false);
  }

  function getStaffMonthOrderAmount(discordId: string, excludeOrderId?: string) {
    return orders
      .filter((order) => {
        if (order.discord_id !== discordId) return false;
        if (excludeOrderId && order.id === excludeOrderId) return false;

        return true;
      })
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
  }

  function calculateRuleRate(
    discordId: string,
    orderAmount: number,
    excludeOrderId?: string
  ) {
    const previousMonthAmount = getStaffMonthOrderAmount(discordId, excludeOrderId);
    const monthAmountWithCurrentOrder = previousMonthAmount + orderAmount;

    let rate = monthAmountWithCurrentOrder >= 7000 ? 80 : 75;

    if (orderAmount > 4999) {
      rate = rate >= 80 ? 82 : 80;
    }

    return rate;
  }

  function calculateRuleSalary(
    discordId: string,
    orderAmountText: string,
    excludeOrderId?: string
  ) {
    const orderAmount = numberValue(orderAmountText);
    const rate = calculateRuleRate(discordId, orderAmount, excludeOrderId);
    const salary = Math.round(orderAmount * (rate / 100));

    return {
      rate,
      salary,
    };
  }

  function updateOrderForm<K extends keyof OrderForm>(
    key: K,
    value: OrderForm[K]
  ) {
    setOrderForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateBonusForm<K extends keyof BonusForm>(
    key: K,
    value: BonusForm[K]
  ) {
    setBonusForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleOrderStaffChange(discordId: string) {
    const staff = staffList.find((item) => item.discord_id === discordId);
    const result = calculateRuleSalary(discordId, orderForm.order_amount, orderForm.id);

    setOrderForm((prev) => ({
      ...prev,
      discord_id: discordId,
      staff_name: getDisplayName(staff),
      salary_rate: String(result.rate),
      staff_salary: prev.order_amount ? String(result.salary) : "",
    }));
  }

  function handleOrderAmountChange(value: string) {
    const result = calculateRuleSalary(orderForm.discord_id, value, orderForm.id);

    setOrderForm((prev) => ({
      ...prev,
      order_amount: value,
      salary_rate: String(result.rate),
      staff_salary: value ? String(result.salary) : "",
    }));
  }

  function handleBonusStaffChange(discordId: string) {
    const staff = staffList.find((item) => item.discord_id === discordId);

    setBonusForm((prev) => ({
      ...prev,
      discord_id: discordId,
      staff_name: getDisplayName(staff),
    }));
  }

  function autoCalculateSalary() {
    if (!orderForm.discord_id) {
      alert("請先選擇員工");
      return;
    }

    if (!orderForm.order_amount) {
      alert("請先輸入訂單金額");
      return;
    }

    const result = calculateRuleSalary(
      orderForm.discord_id,
      orderForm.order_amount,
      orderForm.id
    );

    setOrderForm((prev) => ({
      ...prev,
      salary_rate: String(result.rate),
      staff_salary: String(result.salary),
    }));
  }

  function editOrder(order: SalaryOrder) {
    setOrderForm({
      id: order.id,
      discord_id: order.discord_id || "",
      staff_name: order.staff_name || order.assigned_player || "",
      customer_name: order.customer_name || "",
      service_name: order.service_name || order.service || "",
      order_amount: String(order.order_amount ?? order.price ?? ""),
      salary_rate: String(order.salary_rate ?? ""),
      staff_salary: String(order.staff_salary ?? ""),
      bonus_amount: String(order.bonus_amount ?? 0),
      status: order.status || "未發薪",
      order_finished_at: toDatetimeInput(getOrderSourceDate(order)),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetOrderForm() {
    const firstStaff = staffList[0];

    setOrderForm({
      ...makeEmptyOrderForm(),
      discord_id: firstStaff?.discord_id || "",
      staff_name: firstStaff ? getDisplayName(firstStaff) : "",
    });
  }

  function resetBonusForm() {
    const firstStaff = staffList[0];

    setBonusForm({
      ...makeEmptyBonusForm(),
      discord_id: firstStaff?.discord_id || "",
      staff_name: firstStaff ? getDisplayName(firstStaff) : "",
    });
  }
  async function saveOrder() {
    if (!orderForm.discord_id) {
      alert("請選擇員工");
      return;
    }

    if (!orderForm.customer_name.trim()) {
      alert("請輸入客人名稱");
      return;
    }

    if (!orderForm.service_name.trim()) {
      alert("請輸入項目名稱");
      return;
    }

    const orderAmount = numberValue(orderForm.order_amount);

    if (orderAmount <= 0) {
      alert("請輸入有效的訂單金額");
      return;
    }

    const ruleResult = calculateRuleSalary(
      orderForm.discord_id,
      orderForm.order_amount,
      orderForm.id
    );

    const salaryRate = ruleResult.rate;
    const staffSalary = ruleResult.salary;
    const bonusAmount = numberValue(orderForm.bonus_amount);
    const calculatedPlatformIncome = orderAmount - staffSalary - bonusAmount;

    setSavingOrder(true);

    const payload = {
      discord_id: orderForm.discord_id,
      staff_name: orderForm.staff_name,
      assigned_player: orderForm.staff_name,
      customer_name: orderForm.customer_name.trim(),
      service_name: orderForm.service_name.trim(),
      service: orderForm.service_name.trim(),
      order_amount: orderAmount,
      price: orderAmount,
      salary_rate: salaryRate,
      staff_salary: staffSalary,
      bonus_amount: bonusAmount,
      salary_level: `${salaryRate}%`,
      platform_income: calculatedPlatformIncome,
      platform_expense: staffSalary + bonusAmount,
      status: orderForm.status || "未發薪",
      order_finished_at: datetimeInputToIso(orderForm.order_finished_at),
      completed_at: datetimeInputToIso(orderForm.order_finished_at),
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };

    if (orderForm.id) {
      const { error } = await supabase
        .from("xy_play_orders")
        .update(payload)
        .eq("id", orderForm.id);

      setSavingOrder(false);

      if (error) {
        console.error("update xy order error:", error);
        alert(`更新 XY 訂單失敗：${error.message}`);
        return;
      }

      alert("XY 訂單已更新");
      resetOrderForm();
      await loadAll();
      return;
    }

    const orderNo = makeOrderNo();

    const { error } = await supabase.from("xy_play_orders").insert({
      ...payload,
      order_id: orderNo,
      order_no: orderNo,
      created_at: new Date().toISOString(),
    });

    setSavingOrder(false);

    if (error) {
      console.error("insert xy order error:", error);
      alert(`新增 XY 訂單失敗：${error.message}`);
      return;
    }

    alert("XY 訂單已新增");
    resetOrderForm();
    await loadAll();
  }

  async function deleteOrder(order: SalaryOrder) {
    const ok = window.confirm(
      `確定要刪除這筆訂單嗎？\n${getOrderStaffName(order)}｜${money(
        getOrderAmount(order)
      )}`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("xy_play_orders")
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (error) {
      console.error("delete xy order error:", error);
      alert(`刪除 XY 訂單失敗：${error.message}`);
      return;
    }

    alert("XY 訂單已刪除");
    await loadAll();
  }

  async function saveBonus() {
    if (!bonusForm.discord_id) {
      alert("請選擇員工");
      return;
    }

    if (!bonusForm.description.trim()) {
      alert("請輸入獎金 / 扣除說明");
      return;
    }

    const amount = numberValue(bonusForm.amount);

    if (!amount) {
      alert("請輸入獎金 / 扣除金額");
      return;
    }

    setSavingBonus(true);

    const { error } = await supabase.from("xy_players_bonus").insert({
      discord_id: bonusForm.discord_id,
      staff_name: bonusForm.staff_name,
      bonus_type: bonusForm.bonus_type || "獎金",
      description: bonusForm.description.trim(),
      amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setSavingBonus(false);

    if (error) {
      console.error("insert xy bonus error:", error);
      alert(`新增 XY 獎金 / 扣除失敗：${error.message}`);
      return;
    }

    alert("XY 獎金 / 扣除已新增");
    resetBonusForm();
    await loadAll();
  }

  async function deleteBonus(bonus: Bonus) {
    const ok = window.confirm(
      `確定要刪除這筆獎金 / 扣除嗎？\n${
        bonus.staff_name || bonus.discord_id
      }｜${money(bonus.amount)}`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("xy_players_bonus")
      .delete()
      .eq("id", bonus.id);

    if (error) {
      console.error("delete xy bonus error:", error);
      alert(`刪除 XY 獎金 / 扣除失敗：${error.message}`);
      return;
    }

    alert("XY 獎金 / 扣除已刪除");
    await loadAll();
  }

  async function markFilteredOrdersPaid() {
    const unpaidOrders = filteredOrders.filter(
      (order) => order.status !== "已發薪"
    );

    if (unpaidOrders.length === 0) {
      alert("目前篩選結果沒有未發薪訂單");
      return;
    }

    const ok = window.confirm(
      `確定要把目前篩選出的 ${unpaidOrders.length} 筆訂單標記為已發薪嗎？`
    );

    if (!ok) return;

    setMarkingPaid(true);

    const ids = unpaidOrders.map((order) => order.id);

    const { error } = await supabase
      .from("xy_play_orders")
      .update({
        status: "已發薪",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    setMarkingPaid(false);

    if (error) {
      console.error("mark xy paid error:", error);
      alert(`標記已發薪失敗：${error.message}`);
      return;
    }

    alert("已標記為已發薪");
    await loadAll();
  }

  function hasMonthlyBenefitBonus(discordId: string, description: string) {
    return bonuses.some(
      (bonus) =>
        bonus.discord_id === discordId &&
        String(bonus.description || "").includes(description)
    );
  }

  async function generateMonthlyBenefits() {
    const ok = window.confirm(
      `確定要產生 ${selectedMonth} 的福利獎金嗎？\n\n規則：\n1. 當月累積薪水 > 5000，發 250 元，每月一次。\n2. 生日月份符合本月，發 200 元，每月一次。`
    );

    if (!ok) return;

    setGeneratingBenefits(true);

    const selectedMonthNumber = getSelectedMonthNumber(selectedMonth);
    const rows: any[] = [];

    for (const staff of staffList) {
      if (!staff.discord_id) continue;
      if (staff.is_active === false) continue;

      const staffName = getDisplayName(staff);

      const staffOrders = orders.filter(
        (order) => order.discord_id === staff.discord_id
      );

      const monthSalary = staffOrders.reduce(
        (sum, order) =>
          sum +
          Number(order.staff_salary || 0) +
          Number(order.bonus_amount || 0),
        0
      );

      const salaryBenefitDescription = `每月薪資達標獎金｜${selectedMonth}`;
      const birthdayBenefitDescription = `生日禮金｜${selectedMonth}`;

      if (
        monthSalary > 5000 &&
        !hasMonthlyBenefitBonus(staff.discord_id, salaryBenefitDescription)
      ) {
        rows.push({
          discord_id: staff.discord_id,
          staff_name: staffName,
          bonus_type: "福利獎金",
          description: salaryBenefitDescription,
          amount: 250,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const birthdayMonth = getBirthdayMonth(staff);

      if (
        birthdayMonth === selectedMonthNumber &&
        !hasMonthlyBenefitBonus(staff.discord_id, birthdayBenefitDescription)
      ) {
        rows.push({
          discord_id: staff.discord_id,
          staff_name: staffName,
          bonus_type: "生日禮金",
          description: birthdayBenefitDescription,
          amount: 200,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length === 0) {
      setGeneratingBenefits(false);
      alert("目前沒有需要新增的福利獎金，或本月已經新增過。");
      return;
    }

    const { error } = await supabase.from("xy_players_bonus").insert(rows);

    setGeneratingBenefits(false);

    if (error) {
      console.error("generate xy benefits error:", error);
      alert(`產生福利獎金失敗：${error.message}`);
      return;
    }

    alert(`已新增 ${rows.length} 筆福利獎金`);
    await loadAll();
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
                <ArrowLeft size={16} />
                回 XY 管理後台
              </Link>

              <p className="mt-4 text-sm font-bold text-orange-600">
                XY Admin
              </p>

              <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">
                XY 薪資總表
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                固定 75%，當月接單滿 7000 變 80%，單筆大單會自動提高該筆抽成。
              </p>
            </div>

            <button
              onClick={loadAll}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              重新整理
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard title="訂單總收入" value={money(totalIncome)} />
          <StatCard title="薪資支出" value={money(totalSalary)} />
          <StatCard title="訂單獎金" value={money(totalOrderBonus)} />
          <StatCard title="額外獎金 / 扣除" value={money(totalBonus)} />
          <StatCard title="預估平台收入" value={money(platformIncome)} />
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Sparkles size={20} className="text-orange-500" />
                本月福利獎金
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                當月累積薪水大於 5000 自動補 250；生日月份自動補 200，同月份同員工只會新增一次。
              </p>
            </div>

            <button
              onClick={generateMonthlyBenefits}
              disabled={generatingBenefits || loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-amber-200 hover:bg-amber-600 disabled:opacity-60"
            >
              <Sparkles size={16} />
              {generatingBenefits ? "產生中..." : `產生 ${selectedMonth} 福利獎金`}
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <WalletCards size={20} className="text-orange-500" />
                  {orderForm.id ? "編輯訂單" : "新增訂單"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  抽成會依 XY 規則自動計算，不需要手動選遊戲。
                </p>
              </div>

              {orderForm.id ? (
                <button
                  onClick={resetOrderForm}
                  className="rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50"
                >
                  取消編輯
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="員工">
                <select
                  value={orderForm.discord_id}
                  onChange={(event) => handleOrderStaffChange(event.target.value)}
                >
                  <option value="">請選擇員工</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.discord_id}>
                      {getDisplayName(staff)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="客人名稱">
                <input
                  value={orderForm.customer_name}
                  onChange={(event) =>
                    updateOrderForm("customer_name", event.target.value)
                  }
                  placeholder="例如：小明 / 客人暱稱"
                />
              </Field>

              <Field label="項目名稱">
                <input
                  value={orderForm.service_name}
                  onChange={(event) =>
                    updateOrderForm("service_name", event.target.value)
                  }
                  placeholder="例如：陪玩薪資、陪聊薪資、活動薪資"
                />
              </Field>

              <Field label="完成時間">
                <input
                  type="datetime-local"
                  value={orderForm.order_finished_at}
                  onChange={(event) =>
                    updateOrderForm("order_finished_at", event.target.value)
                  }
                />
              </Field>

              <Field label="訂單金額">
                <input
                  type="number"
                  min="0"
                  value={orderForm.order_amount}
                  onChange={(event) => handleOrderAmountChange(event.target.value)}
                  placeholder="例如：1000"
                />
              </Field>

              <Field label="自動抽成％">
                <input
                  type="number"
                  value={orderForm.salary_rate}
                  readOnly
                  className="cursor-not-allowed bg-slate-50"
                />
              </Field>
              <Field label="員工薪資">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    type="number"
                    min="0"
                    value={orderForm.staff_salary}
                    readOnly
                    className="cursor-not-allowed bg-slate-50"
                    placeholder="系統自動計算"
                  />

                  <button
                    type="button"
                    onClick={autoCalculateSalary}
                    className="rounded-2xl border border-orange-100 px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50"
                  >
                    重新計算
                  </button>
                </div>
              </Field>

              <Field label="訂單獎金 / 扣除">
                <input
                  type="number"
                  value={orderForm.bonus_amount}
                  onChange={(event) =>
                    updateOrderForm("bonus_amount", event.target.value)
                  }
                  placeholder="沒有就填 0；扣款可填負數"
                />
              </Field>

              <Field label="發薪狀態">
                <select
                  value={orderForm.status}
                  onChange={(event) =>
                    updateOrderForm("status", event.target.value)
                  }
                >
                  <option value="未發薪">未發薪</option>
                  <option value="已發薪">已發薪</option>
                </select>
              </Field>

              <div className="md:col-span-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm font-black text-orange-700">
                  XY 抽成規則
                </p>

                <div className="mt-2 space-y-1 text-sm font-semibold text-slate-600">
                  <p>基礎抽成：75%</p>
                  <p>當月接單金額累積滿 7000：抽成 80%</p>
                  <p>如果原本 75%，單筆金額大於 4999：該筆 80%</p>
                  <p>如果原本 80%，單筆金額大於 4999：該筆 82%</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
                >
                  <Save size={17} />
                  {savingOrder
                    ? "儲存中..."
                    : orderForm.id
                      ? "更新訂單"
                      : "新增訂單"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Gift size={20} className="text-orange-500" />
              新增獎金 / 扣除
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              獎金填正數，扣除填負數，例如：-100。
            </p>

            <div className="mt-5 space-y-3">
              <Field label="員工">
                <select
                  value={bonusForm.discord_id}
                  onChange={(event) => handleBonusStaffChange(event.target.value)}
                >
                  <option value="">請選擇員工</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.discord_id}>
                      {getDisplayName(staff)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="類型">
                <select
                  value={bonusForm.bonus_type}
                  onChange={(event) =>
                    updateBonusForm("bonus_type", event.target.value)
                  }
                >
                  <option value="獎金">獎金</option>
                  <option value="扣除">扣除</option>
                  <option value="補薪">補薪</option>
                  <option value="活動獎勵">活動獎勵</option>
                  <option value="福利獎金">福利獎金</option>
                  <option value="生日禮金">生日禮金</option>
                  <option value="其他">其他</option>
                </select>
              </Field>

              <Field label="說明">
                <input
                  value={bonusForm.description}
                  onChange={(event) =>
                    updateBonusForm("description", event.target.value)
                  }
                  placeholder="例如：生日禮金 / 遲到扣款"
                />
              </Field>

              <Field label="金額">
                <input
                  type="number"
                  value={bonusForm.amount}
                  onChange={(event) =>
                    updateBonusForm("amount", event.target.value)
                  }
                  placeholder="例如：300；扣除請填 -100"
                />
              </Field>

              <button
                onClick={saveBonus}
                disabled={savingBonus}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
              >
                <Plus size={17} />
                {savingBonus ? "新增中..." : "新增獎金 / 扣除"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm font-black text-orange-700">
                目前篩選未發薪
              </p>

              <p className="mt-2 text-2xl font-black text-slate-900">
                {money(unpaidAmount)}
              </p>

              <button
                onClick={markFilteredOrdersPaid}
                disabled={markingPaid}
                className="mt-4 w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
              >
                {markingPaid ? "標記中..." : "將目前篩選訂單標記已發薪"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm shadow-orange-100">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_160px]">
            <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2">
              <Search size={17} className="text-orange-500" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜尋訂單、員工、客人、項目"
                className="min-h-0 flex-1 border-none bg-transparent p-0 text-sm outline-none focus:shadow-none"
              />
            </div>

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

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="all">全部狀態</option>
              <option value="未發薪">未發薪</option>
              <option value="已發薪">已發薪</option>
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={loadAll}
            disabled={loading}
            className="mt-3 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-orange-200 hover:bg-orange-600 disabled:opacity-60"
          >
            查詢月份
          </button>
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
          <div className="border-b border-orange-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">訂單列表</h2>

            <p className="mt-1 text-sm text-slate-500">
              目前顯示 {filteredOrders.length} 筆訂單。
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              讀取中...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              沒有符合的訂單
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>完成時間</th>
                    <th>訂單編號</th>
                    <th>員工</th>
                    <th>客人</th>
                    <th>項目</th>
                    <th>訂單金額</th>
                    <th>抽成</th>
                    <th>薪資</th>
                    <th>獎金</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{formatDateTime(getOrderSourceDate(order))}</td>

                      <td>{order.order_no || order.order_id || "-"}</td>

                      <td>{getOrderStaffName(order)}</td>

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

                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editOrder(order)}
                            className="rounded-full border border-orange-100 p-2 text-orange-600 hover:bg-orange-50"
                            title="編輯"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => deleteOrder(order)}
                            className="rounded-full border border-red-100 p-2 text-red-500 hover:bg-red-50"
                            title="刪除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-orange-100 bg-white shadow-sm shadow-orange-100">
          <div className="border-b border-orange-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">
              獎金 / 扣除列表
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              目前顯示 {filteredBonuses.length} 筆獎金 / 扣除。
            </p>
          </div>

          {filteredBonuses.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-400">
              沒有獎金 / 扣除紀錄
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>時間</th>
                    <th>員工</th>
                    <th>類型</th>
                    <th>說明</th>
                    <th>金額</th>
                    <th>操作</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBonuses.map((bonus) => (
                    <tr key={bonus.id}>
                      <td>{formatDateTime(bonus.created_at)}</td>

                      <td>{bonus.staff_name || bonus.discord_id}</td>

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

                      <td>
                        <button
                          onClick={() => deleteBonus(bonus)}
                          className="rounded-full border border-red-100 p-2 text-red-500 hover:bg-red-50"
                          title="刪除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}