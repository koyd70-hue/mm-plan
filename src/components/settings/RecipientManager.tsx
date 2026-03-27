"use client";

import { useState, useEffect, useCallback } from "react";

interface Recipient {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export default function RecipientManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchRecipients = useCallback(async () => {
    const res = await fetch("/api/email/recipients");
    setRecipients(await res.json());
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch("/api/email/recipients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, email }),
      });
    } else {
      await fetch("/api/email/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
    }
    setName("");
    setEmail("");
    setEditingId(null);
    fetchRecipients();
  };

  const toggleActive = async (recipient: Recipient) => {
    await fetch("/api/email/recipients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: recipient.id, active: !recipient.active }),
    });
    fetchRecipients();
  };

  const handleEdit = (r: Recipient) => {
    setEditingId(r.id);
    setName(r.name);
    setEmail(r.email);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 수신자를 삭제하시겠습니까?")) return;
    await fetch(`/api/email/recipients?id=${id}`, { method: "DELETE" });
    fetchRecipients();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            onClick={() => {
              setEditingId(null);
              setName("");
              setEmail("");
            }}
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
            <th className="text-center py-2 font-medium text-gray-600 w-20">활성</th>
            <th className="text-right py-2 font-medium text-gray-600 w-32">작업</th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((r) => (
            <tr key={r.id} className="border-b border-gray-100">
              <td className="py-2">{r.name}</td>
              <td className="py-2 text-gray-500">{r.email}</td>
              <td className="py-2 text-center">
                <button
                  onClick={() => toggleActive(r)}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {r.active ? "ON" : "OFF"}
                </button>
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => handleEdit(r)}
                  className="text-blue-600 hover:underline mr-3"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
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
