import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">대시보드</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/plan"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-blue-600">MM 계획 입력</h3>
          <p className="text-sm text-gray-500 mt-2">
            팀/멤버/Product별 월간 MM 계획을 입력합니다.
          </p>
        </Link>
        <Link
          href="/comparison"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-green-600">전월 비교</h3>
          <p className="text-sm text-gray-500 mt-2">
            전월 대비 MM 계획 변경사항을 확인합니다.
          </p>
        </Link>
        <Link
          href="/settings"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-600">설정</h3>
          <p className="text-sm text-gray-500 mt-2">
            팀, 멤버, Product, 이메일 수신자를 관리합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}
