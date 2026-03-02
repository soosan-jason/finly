import { MarketsPageClient } from "@/components/markets/MarketsPageClient";

export const metadata = {
  title: "시장 지수 - Finly",
  description: "KOSPI, KOSDAQ, 나스닥, S&P 500 등 주요 시장 지수",
};

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">글로벌 시장 지수</h1>
        <p className="mt-1 text-sm text-gray-400">주요 국가별 주식 시장 지수 실시간 현황</p>
      </div>
      <MarketsPageClient />
    </div>
  );
}
