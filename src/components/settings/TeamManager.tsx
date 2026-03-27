"use client";

import { useState, useEffect, useCallback } from "react";

interface Team {
  id: number;
  name: string;
  sortOrder: number;
}

export default function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch("/api/teams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, sortOrder }),
      });
    } else {
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sortOrder }),
      });
    }
    setName("");
    setSortOrder(0);
    setEditingId(null);
    fetchTeams();
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setName(team.name);
    setSortOrder(team.sortOrder);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 팀을 삭제하시겠습니까? 소속 멤버도 함께 삭제됩니다.")) return;
    await fetch(`/api/teams?id=${id}`, { method: "DELETE" });
    fetchTeams();
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setSortOrder(0);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">팀 이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="팀 이름 입력"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">정렬</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          {editingId ? "수정" : "추가"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
          >
            취소
          </button>
        )}
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">팀 이름</th>
            <th className="text-left py-2 font-medium text-gray-600 w-20">정렬</th>
            <th className="text-right py-2 font-medium text-gray-600 w-32">작업</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id} className="border-b border-gray-100">
              <td className="py-2">{team.name}</td>
              <td className="py-2">{team.sortOrder}</td>
              <td className="py-2 text-right">
                <button
                  onClick={() => handleEdit(team)}
                  className="text-blue-600 hover:underline mr-3"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-600 hover:underline"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
