"use client";

import { useState } from "react";
import TeamManager from "@/components/settings/TeamManager";
import MemberManager from "@/components/settings/MemberManager";
import ProductManager from "@/components/settings/ProductManager";
import RecipientManager from "@/components/settings/RecipientManager";

const tabs = [
  { id: "teams", label: "팀 관리" },
  { id: "members", label: "멤버 관리" },
  { id: "products", label: "Product 관리" },
  { id: "recipients", label: "이메일 수신자" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("teams");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">설정</h2>
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === "teams" && <TeamManager />}
        {activeTab === "members" && <MemberManager />}
        {activeTab === "products" && <ProductManager />}
        {activeTab === "recipients" && <RecipientManager />}
      </div>
    </div>
  );
}
