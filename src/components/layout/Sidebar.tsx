"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/plan", label: "MM 계획 입력" },
  { href: "/comparison", label: "전월 비교" },
  { href: "/settings", label: "설정" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">MM Plan</h1>
        <p className="text-xs text-gray-400 mt-1">2026.04 - 2027.03</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
