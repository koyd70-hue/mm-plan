import type { ComparisonEntry, TeamWithMembers, ProductInfo } from "./types";
import { formatYearMonth } from "./types";

interface TemplateParams {
  currentMonth: string;
  teams: TeamWithMembers[];
  products: ProductInfo[];
  comparisonData: ComparisonEntry[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deltaStyle(delta: number): string {
  if (delta > 0) return 'style="color: #16a34a; font-size: 11px;"';
  if (delta < 0) return 'style="color: #dc2626; font-size: 11px;"';
  return 'style="font-size: 11px; color: #9ca3af;"';
}

function formatDelta(delta: number): string {
  if (delta === 0) return "";
  return `(${delta > 0 ? "+" : ""}${delta})`;
}

export function buildEmailHTML(params: TemplateParams): string {
  const { currentMonth, teams, products, comparisonData } = params;
  const monthLabel = formatYearMonth(currentMonth);

  // Build lookup
  const dataMap = new Map<string, ComparisonEntry>();
  comparisonData.forEach((e) => {
    dataMap.set(`${e.memberId}-${e.productId}`, e);
  });

  const getEntry = (memberId: number, productId: number) =>
    dataMap.get(`${memberId}-${productId}`);

  // Calculate grand totals
  let grandCurrent = 0;
  let grandPrevious = 0;
  comparisonData.forEach((e) => {
    grandCurrent += e.currentValue;
    grandPrevious += e.previousValue;
  });

  const productHeaders = products
    .map(
      (p) =>
        `<th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: center; background: #f3f4f6; font-size: 12px;">${p.name}</th>`
    )
    .join("");

  let tableRows = "";

  for (const team of teams) {
    for (let mi = 0; mi < team.members.length; mi++) {
      const member = team.members[mi];
      let memberCur = 0;
      let memberPrev = 0;

      const cells = products
        .map((p) => {
          const entry = getEntry(member.id, p.id);
          const cur = entry?.currentValue || 0;
          const prev = entry?.previousValue || 0;
          const delta = round2(cur - prev);
          memberCur += cur;
          memberPrev += prev;

          const bgColor = delta > 0 ? "#f0fdf4" : delta < 0 ? "#fef2f2" : "#ffffff";
          return `<td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; background: ${bgColor};">
            <div style="font-size: 13px;">${round2(cur) || "-"}</div>
            ${delta !== 0 ? `<div ${deltaStyle(delta)}>${formatDelta(delta)}</div>` : ""}
          </td>`;
        })
        .join("");

      const memberDelta = round2(memberCur - memberPrev);
      const teamCell =
        mi === 0
          ? `<td rowspan="${team.members.length}" style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600; background: #f9fafb; vertical-align: top; font-size: 13px;">${team.name}</td>`
          : "";

      tableRows += `<tr>
        ${teamCell}
        <td style="border: 1px solid #d1d5db; padding: 6px 8px; font-size: 13px;">${member.name}</td>
        ${cells}
        <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; background: #f9fafb;">
          <div style="font-size: 13px; font-weight: 600;">${round2(memberCur) || "-"}</div>
          ${memberDelta !== 0 ? `<div ${deltaStyle(memberDelta)}>${formatDelta(memberDelta)}</div>` : ""}
        </td>
      </tr>`;
    }

    // Team subtotal row
    const teamCells = products
      .map((p) => {
        const cur = team.members.reduce(
          (s, m) => s + (getEntry(m.id, p.id)?.currentValue || 0),
          0
        );
        const prev = team.members.reduce(
          (s, m) => s + (getEntry(m.id, p.id)?.previousValue || 0),
          0
        );
        const delta = round2(cur - prev);
        return `<td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; background: #eff6ff; font-weight: 600; font-size: 13px;">
          ${round2(cur) || "-"}
          ${delta !== 0 ? `<span ${deltaStyle(delta)}> ${formatDelta(delta)}</span>` : ""}
        </td>`;
      })
      .join("");

    const teamCur = team.members.reduce(
      (s, m) => s + products.reduce((ps, p) => ps + (getEntry(m.id, p.id)?.currentValue || 0), 0),
      0
    );
    const teamPrev = team.members.reduce(
      (s, m) => s + products.reduce((ps, p) => ps + (getEntry(m.id, p.id)?.previousValue || 0), 0),
      0
    );
    const teamDelta = round2(teamCur - teamPrev);

    tableRows += `<tr>
      <td colspan="2" style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; background: #eff6ff; font-weight: 700; font-size: 12px; color: #1d4ed8;">${team.name} 소계</td>
      ${teamCells}
      <td style="border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; background: #dbeafe; font-weight: 700; font-size: 13px;">
        ${round2(teamCur) || "-"}
        ${teamDelta !== 0 ? `<span ${deltaStyle(teamDelta)}> ${formatDelta(teamDelta)}</span>` : ""}
      </td>
    </tr>`;
  }

  const grandDelta = round2(grandCurrent - grandPrevious);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb;">
  <div style="max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1e40af; padding: 20px 24px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 18px;">MM 계획 - ${monthLabel}</h1>
    </div>
    <div style="padding: 24px;">
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
        <span style="font-size: 14px; color: #0369a1;">
          전체 MM: <strong>${round2(grandCurrent)}</strong>
          ${grandDelta !== 0 ? `<span ${deltaStyle(grandDelta)}> 전월 대비 ${formatDelta(grandDelta)}</span>` : " (전월 동일)"}
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; background: #f3f4f6; font-size: 12px;">팀</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; background: #f3f4f6; font-size: 12px;">멤버</th>
            ${productHeaders}
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; background: #e5e7eb; font-size: 12px; font-weight: 700;">합계</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center;">
        자동 생성: ${new Date().toLocaleDateString("ko-KR")} | MM Plan System
      </p>
    </div>
  </div>
</body>
</html>`;
}
