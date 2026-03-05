import { CryptoPageClient } from "@/components/markets/CryptoPageClient";

export const metadata = {
  title: "암호화폐 시세 - Finly",
  description: "실시간 암호화폐 시세, 시가총액, 거래량 순위",
};

export default function CryptoPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-white">암호화폐 시세</h1>
      <CryptoPageClient />
    </div>
  );
}
