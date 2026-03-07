import type { Metadata } from "next";
import { DateFormatToggle } from "@/components/ui/DateFormatToggle";

export const metadata: Metadata = { title: "설정" };

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="mt-1 text-sm text-gray-400">앱 표시 방식을 조정합니다.</p>
      </div>

      {/* 표시 설정 */}
      <section className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">표시</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">연동 시각 표시</p>
              <p className="mt-0.5 text-xs text-gray-500">마켓 카드에 표시되는 업데이트 시각 형식</p>
            </div>
            <DateFormatToggle />
          </div>
        </div>
      </section>
    </div>
  );
}
