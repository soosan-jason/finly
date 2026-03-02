import { NewsPageClient } from "@/components/news/NewsPageClient";

export const metadata = {
  title: "금융 뉴스 - Finly",
  description: "실시간 글로벌 금융·암호화폐 최신 뉴스",
};

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">금융 뉴스</h1>
        <p className="mt-1 text-sm text-gray-400">Finnhub 제공 글로벌 시장 최신 뉴스</p>
      </div>
      <NewsPageClient />
    </div>
  );
}
