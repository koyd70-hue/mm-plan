"use client";

import { useState, useEffect, useCallback } from "react";

interface Team {
  id: number;
  name: string;
}

interface Member {
  id: number;
  name: string;
  email: string | null;
  teamId: number;
  sortOrder: number;
  team: Team;
}

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [membersRes, teamsRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/teams"),
    ]);
    setMembers(await membersRes.json());
    const teamsData = await teamsRes.json();
    setTeams(teamsData);
    if (teamsData.length > 0 && teamId === 0) {
      setTeamId(teamsData[0].id);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, email: email || null, teamId, sortOrder };
    if (editingId) {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    fetchData();
  };

  const handleEdit = (member: Member) => {
    setEditingId(member.id);
    setName(member.name);
    setEmail(member.email || "");
    setTeamId(member.teamId);
    setSortOrder(member.sortOrder);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 멤버를 삭제하시겠습니까?")) return;
    await fetch(`/api/members?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setSortOrder(0);
    if (teams.length > 0) setTeamId(teams[0].id);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6 items-end flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">팀</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-20">
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
            onClick={resetForm}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
          >
            취소
          </button>
        )}
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-600">이름</th>
            <th className="text-left py-2 font-medium text-gray-600">이메일</th>
            <th className="text-left py-2 font-medium text-gray-600">팀</th>
            <th className="text-left py-2 font-medium text-gray-600 w-16">정렬</th>
            <th className="text-right py-2 font-medium text-gray-600 w-32">작업</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-gray-100">
              <td className="py-2">{m.name}</td>
              <td className="py-2 text-gray-500">{m.email || "-"}</td>
              <td className="py-2">{m.team.name}</td>
              <td className="py-2">{m.sortOrder}</td>
              <td className="py-2 text-right">
                <button
                  onClick={() => handleEdit(m)}
                  className="text-blue-600 hover:underline mr-3"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
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
