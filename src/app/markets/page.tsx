import { MarketsPageClient } from "@/components/markets/MarketsPageClient";

export const metadata = {
  title: "글로벌 마켓 - Finly",
  description: "지수, 선물, 원자재, 채권, 주요국 주식 실시간 현황",
};

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">글로벌 마켓</h1>
        <p className="mt-1 text-sm text-gray-400">지수 · 선물 · 원자재 · 채권 · 주식 실시간 현황</p>
      </div>
      <MarketsPageClient />
    </div>
  );
}
