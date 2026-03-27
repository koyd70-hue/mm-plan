"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PlanCell from "./PlanCell";
import { FISCAL_MONTHS, formatYearMonth } from "@/lib/types";
import type { TeamWithMembers, ProductInfo, PlanEntry } from "@/lib/types";

export default function PlanGrid() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(FISCAL_MONTHS[0]);
  const [planData, setPlanData] = useState<Map<string, number>>(new Map());
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const dirtyRef = useRef<Map<string, number>>(new Map());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cellKey = (memberId: number, productId: number) => `${memberId}-${productId}`;

  const fetchMasterData = useCallback(async () => {
    const [teamsRes, productsRes] = await Promise.all([
      fetch("/api/teams"),
      fetch("/api/products"),
    ]);
    setTeams(await teamsRes.json());
    setProducts(await productsRes.json());
  }, []);

  const fetchPlanData = useCallback(async (yearMonth: string) => {
    const res = await fetch(`/api/plans?yearMonth=${yearMonth}`);
    const entries: PlanEntry[] = await res.json();
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(cellKey(e.memberId, e.productId), e.mmValue);
    });
    setPlanData(map);
    dirtyRef.current.clear();
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    fetchPlanData(selectedMonth);
  }, [selectedMonth, fetchPlanData]);

  const saveDirtyEntries = useCallback(async () => {
    if (dirtyRef.current.size === 0) return;
    setSaving(true);

    const entries = Array.from(dirtyRef.current.entries()).map(([key, value]) => {
      const [memberId, productId] = key.split("-").map(Number);
      return { memberId, productId, yearMonth: selectedMonth, mmValue: value };
    });

    dirtyRef.current.clear();

    try {
      await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [selectedMonth]);

  const handleCellChange = (memberId: number, productId: number, value: number) => {
    const key = cellKey(memberId, productId);
    setPlanData((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
    dirtyRef.current.set(key, value);

    // Debounced auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDirtyEntries, 500);
  };

  const handleSaveAll = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveDirtyEntries();
  };

  const handleSnapshot = async () => {
    if (!confirm(`${formatYearMonth(selectedMonth)} 스냅샷을 생성하시겠습니까?`)) return;
    // Save any pending changes first
    await saveDirtyEntries();
    const res = await fetch("/api/plans/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotMonth: selectedMonth }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`스냅샷 생성 완료 (${data.count}건)`);
    }
  };

  const getCellValue = (memberId: number, productId: number): number => {
    return planData.get(cellKey(memberId, productId)) || 0;
  };

  const getMemberTotal = (memberId: number): number => {
    return products.reduce((sum, p) => sum + getCellValue(memberId, p.id), 0);
  };

  const getTeamTotal = (team: TeamWithMembers): number => {
    return team.members.reduce((sum, m) => sum + getMemberTotal(m.id), 0);
  };

  const getProductTotal = (productId: number): number => {
    return teams.reduce(
      (sum, t) =>
        sum + t.members.reduce((s, m) => s + getCellValue(m.id, productId), 0),
      0
    );
  };

  const getGrandTotal = (): number => {
    return teams.reduce((sum, t) => sum + getTeamTotal(t), 0);
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">월 선택:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            {FISCAL_MONTHS.map((m) => (
              <option key={m} value={m}>
                {formatYearMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        <button
          onClick={handleSnapshot}
          className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          스냅샷 생성
        </button>
        {lastSaved && (
          <span className="text-xs text-gray-400">
            마지막 저장: {lastSaved.toLocaleTimeString("ko-KR")}
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 min-w-[60px]">
                팀
              </th>
              <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600 sticky left-[60px] bg-gray-100 z-10 min-w-[100px]">
                멤버
              </th>
              {products.map((p) => (
                <th
                  key={p.id}
                  className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600 min-w-[100px]"
                >
                  {p.name}
                </th>
              ))}
              <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 min-w-[80px] bg-gray-50">
                합계
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <>
                {team.members.map((member, memberIdx) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {memberIdx === 0 && (
                      <td
                        rowSpan={team.members.length}
                        className="border border-gray-200 px-3 py-2 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10 align-top"
                      >
                        {team.name}
                      </td>
                    )}
                    <td className="border border-gray-200 px-3 py-2 text-gray-700 sticky left-[60px] bg-white z-10">
                      {member.name}
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="border border-gray-200 p-0 w-[100px]"
                      >
                        <PlanCell
                          value={getCellValue(member.id, product.id)}
                          onChange={(v) =>
                            handleCellChange(member.id, product.id, v)
                          }
                        />
                      </td>
                    ))}
                    <td className="border border-gray-200 px-3 py-1 text-right font-medium text-gray-700 bg-gray-50">
                      {round2(getMemberTotal(member.id)) || ""}
                    </td>
                  </tr>
                ))}
                {/* Team subtotal */}
                <tr className="bg-blue-50">
                  <td
                    colSpan={2}
                    className="border border-gray-200 px-3 py-1.5 text-right font-semibold text-blue-700 sticky left-0 bg-blue-50 z-10"
                  >
                    {team.name} 소계
                  </td>
                  {products.map((p) => {
                    const teamProductTotal = team.members.reduce(
                      (s, m) => s + getCellValue(m.id, p.id),
                      0
                    );
                    return (
                      <td
                        key={p.id}
                        className="border border-gray-200 px-3 py-1.5 text-right font-medium text-blue-700"
                      >
                        {round2(teamProductTotal) || ""}
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 px-3 py-1.5 text-right font-semibold text-blue-800">
                    {round2(getTeamTotal(team)) || ""}
                  </td>
                </tr>
              </>
            ))}
            {/* Product totals */}
            <tr className="bg-gray-100 font-semibold">
              <td
                colSpan={2}
                className="border border-gray-200 px-3 py-2 text-right text-gray-700 sticky left-0 bg-gray-100 z-10"
              >
                Product 합계
              </td>
              {products.map((p) => (
                <td
                  key={p.id}
                  className="border border-gray-200 px-3 py-2 text-right text-gray-700"
                >
                  {round2(getProductTotal(p.id)) || ""}
                </td>
              ))}
              <td className="border border-gray-200 px-3 py-2 text-right font-bold text-gray-800">
                {round2(getGrandTotal()) || ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
