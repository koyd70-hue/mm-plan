export interface TeamWithMembers {
  id: number;
  name: string;
  sortOrder: number;
  members: MemberInfo[];
}

export interface MemberInfo {
  id: number;
  name: string;
  email: string | null;
  teamId: number;
  sortOrder: number;
}

export interface ProductInfo {
  id: number;
  name: string;
  sortOrder: number;
}

export interface PlanEntry {
  memberId: number;
  productId: number;
  yearMonth: string;
  mmValue: number;
}

export interface PlanCellData {
  memberId: number;
  productId: number;
  mmValue: number;
}

export interface ComparisonEntry {
  memberId: number;
  memberName: string;
  teamId: number;
  teamName: string;
  productId: number;
  productName: string;
  currentValue: number;
  previousValue: number;
  delta: number;
}

export interface EmailRecipientInfo {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

// Fiscal year months: April 2026 - March 2027
export const FISCAL_MONTHS = [
  "2026-04", "2026-05", "2026-06",
  "2026-07", "2026-08", "2026-09",
  "2026-10", "2026-11", "2026-12",
  "2027-01", "2027-02", "2027-03",
] as const;

export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month)}월`;
}

export function getPreviousMonth(ym: string): string | null {
  const idx = FISCAL_MONTHS.indexOf(ym as typeof FISCAL_MONTHS[number]);
  if (idx <= 0) return null;
  return FISCAL_MONTHS[idx - 1];
}
