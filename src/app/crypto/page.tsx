import { CryptoPageClient } from "@/components/markets/CryptoPageClient";

export const metadata = {
  title: "암호화폐 시세 - Finly",
  description: "실시간 암호화폐 시세, 시가총액, 거래량 순위",
};

export default function CryptoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">암호화폐 시세</h1>
        <p className="mt-1 text-sm text-gray-400">시가총액 기준 상위 코인 실시간 시세</p>
      </div>
      <CryptoPageClient />
    </div>
  );
}
