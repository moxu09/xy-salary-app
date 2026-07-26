export type CommissionTier =
  | "auto"
  | "rate_75"
  | "rate_80";

export function money(value: number) {
  return `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;
}

export function getCommissionLabel(tier: CommissionTier | string, rate: number) {
  if (tier === "rate_75") return "75% 手動設定";
  if (tier === "rate_80") return "80% 手動設定";
  return `${rate}% 自動判定`;
}

export function getManualRate(tier?: string | null) {
  if (tier === "rate_75") return 75;
  if (tier === "rate_80") return 80;
  return null;
}

export function isBeforeOpeningEnd(dateText: string) {
  return new Date(dateText) < new Date("2026-09-01T00:00:00+08:00");
}

export function getNextMonthText(dateText: string) {
  const date = new Date(dateText);
  const year = date.getFullYear();
  const month = date.getMonth();

  const next = new Date(year, month + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export function getYearText(dateText: string) {
  return String(new Date(dateText).getFullYear());
}
