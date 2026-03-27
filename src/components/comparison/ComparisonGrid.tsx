"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import DeltaCell from "./DeltaCell";
import { FISCAL_MONTHS, formatYearMonth, getPreviousMonth } from "@/lib/types";
import type { TeamWithMembers, ProductInfo, ComparisonEntry } from "@/lib/types";

export default function ComparisonGrid() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(FISCAL_MONTHS[1]);
  const [snapshotMonths, setSnapshotMonths] = useState<string[]>([]);
  const [previousMonth, setPreviousMonth] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonEntry[]>([]);

  const fetchMasterData = useCallback(async () => {
    const [teamsRes, productsRes, snapshotsRes] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/products"),
      fetch("/api/plans/snapshot"),
    ]);
    setTeams(await teamsRes.json());
    setProducts(await productsRes.json());
    const months: string[] = await snapshotsRes.json();
    setSnapshotMonths(months);
    if (months.length > 0 && !previousMonth) {
      setPreviousMonth(months[0]);
    }
  }, [previousMonth]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    // Auto-select previous month based on current month
    const prev = getPreviousMonth(currentMonth);
    if (prev && snapshotMonths.includes(prev)) {
      setPreviousMonth(prev);
    }
  }, [currentMonth, snapshotMonths]);

  const fetchComparison = useCallback(async () => {
    if (!currentMonth || !previousMonth) return;
    const res = await fetch(
      `/api/comparison?current=${currentMonth}&previous=${previousMonth}`
    );
    setComparisonData(await res.json());
  }, [currentMonth, previousMonth]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  // Build lookup maps
  const dataMap = new Map<string, ComparisonEntry>();
  comparisonData.forEach((e) => {
    dataMap.set(`${e.memberId}-${e.productId}`, e);
  });

  const getEntry = (memberId: number, productId: number) =>
    dataMap.get(`${memberId}-${productId}`);

  const getMemberCurrentTotal = (memberId: number) =>
    products.reduce((s, p) => s + (getEntry(memberId, p.id)?.currentValue || 0), 0);

  const getMemberPrevTotal = (memberId: number) =>
    products.reduce((s, p) => s + (getEntry(memberId, p.id)?.previousValue || 0), 0);

  const getTeamCurrentTotal = (team: TeamWithMembers) =>
    team.members.reduce((s, m) => s + getMemberCurrentTotal(m.id), 0);

  const getTeamPrevTotal = (team: TeamWithMembers) =>
    team.members.reduce((s, m) => s + getMemberPrevTotal(m.id), 0);

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">현재월:</label>
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            {FISCAL_MONTHS.map((m) => (
              <option key={m} value={m}>
                {formatYearMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">비교 스냅샷:</label>
          <select
            value={previousMonth}
            onChange={(e) => setPreviousMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            {snapshotMonths.length === 0 && (
              <option value="">스냅샷 없음</option>
            )}
            {snapshotMonths.map((m) => (
              <option key={m} value={m}>
                {formatYearMonth(m)} 스냅샷
              </option>
            ))}
          </select>
        </div>
      </div>

      {snapshotMonths.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
          비교할 스냅샷이 없습니다. MM 계획 입력 페이지에서 먼저 스냅샷을 생성해주세요.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 min-w-[60px]">
                  팀
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 min-w-[100px]">
                  멤버
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600 min-w-[120px]"
                  >
                    {p.name}
                  </th>
                ))}
                <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 min-w-[100px] bg-gray-50">
                  합계
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <Fragment key={team.id}>
                  {team.members.map((member, memberIdx) => {
                    const memberCurTotal = getMemberCurrentTotal(member.id);
                    const memberPrevTotal = getMemberPrevTotal(member.id);
                    return (
                      <tr key={member.id} className="hover:bg-gray-50">
                        {memberIdx === 0 && (
                          <td
                            rowSpan={team.members.length}
                            className="border border-gray-200 px-3 py-2 font-medium text-gray-700 bg-gray-50 align-top"
                          >
                            {team.name}
                          </td>
                        )}
                        <td className="border border-gray-200 px-3 py-2 text-gray-700">
                          {member.name}
                        </td>
                        {products.map((product) => {
                          const entry = getEntry(member.id, product.id);
                          return (
                            <td
                              key={product.id}
                              className={`border border-gray-200 p-0 ${
                                entry && entry.delta !== 0
                                  ? entry.delta > 0
                                    ? "bg-green-50"
                                    : "bg-red-50"
                                  : ""
                              }`}
                            >
                              <DeltaCell
                                currentValue={entry?.currentValue || 0}
                                previousValue={entry?.previousValue || 0}
                                delta={entry?.delta || 0}
                              />
                            </td>
                          );
                        })}
                        <td className="border border-gray-200 bg-gray-50">
                          <DeltaCell
                            currentValue={memberCurTotal}
                            previousValue={memberPrevTotal}
                            delta={round2(memberCurTotal - memberPrevTotal)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {/* Team subtotal */}
                  <tr className="bg-blue-50">
                    <td
                      colSpan={2}
                      className="border border-gray-200 px-3 py-1.5 text-right font-semibold text-blue-700"
                    >
                      {team.name} 소계
                    </td>
                    {products.map((p) => {
                      const cur = team.members.reduce(
                        (s, m) => s + (getEntry(m.id, p.id)?.currentValue || 0),
                        0
                      );
                      const prev = team.members.reduce(
                        (s, m) => s + (getEntry(m.id, p.id)?.previousValue || 0),
                        0
                      );
                      return (
                        <td key={p.id} className="border border-gray-200 p-0">
                          <DeltaCell
                            currentValue={cur}
                            previousValue={prev}
                            delta={round2(cur - prev)}
                          />
                        </td>
                      );
                    })}
                    <td className="border border-gray-200 p-0 bg-blue-100">
                      <DeltaCell
                        currentValue={getTeamCurrentTotal(team)}
                        previousValue={getTeamPrevTotal(team)}
                        delta={round2(
                          getTeamCurrentTotal(team) - getTeamPrevTotal(team)
                        )}
                      />
                    </td>
                  </tr>
                </Fragment>
              ))}
              {/* Grand total */}
              <tr className="bg-gray-100 font-semibold">
                <td
                  colSpan={2}
                  className="border border-gray-200 px-3 py-2 text-right text-gray-700"
                >
                  전체 합계
                </td>
                {products.map((p) => {
                  const cur = teams.reduce(
                    (s, t) =>
                      s +
                      t.members.reduce(
                        (ms, m) => ms + (getEntry(m.id, p.id)?.currentValue || 0),
                        0
                      ),
                    0
                  );
                  const prev = teams.reduce(
                    (s, t) =>
                      s +
                      t.members.reduce(
                        (ms, m) => ms + (getEntry(m.id, p.id)?.previousValue || 0),
                        0
                      ),
                    0
                  );
                  return (
                    <td key={p.id} className="border border-gray-200 p-0">
                      <DeltaCell
                        currentValue={cur}
                        previousValue={prev}
                        delta={round2(cur - prev)}
                      />
                    </td>
                  );
                })}
                <td className="border border-gray-200 p-0 bg-gray-200">
                  <DeltaCell
                    currentValue={teams.reduce(
                      (s, t) => s + getTeamCurrentTotal(t),
                      0
                    )}
                    previousValue={teams.reduce(
                      (s, t) => s + getTeamPrevTotal(t),
                      0
                    )}
                    delta={round2(
                      teams.reduce((s, t) => s + getTeamCurrentTotal(t), 0) -
                        teams.reduce((s, t) => s + getTeamPrevTotal(t), 0)
                    )}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
