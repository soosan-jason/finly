import { MarketOverview } from "@/components/markets/MarketOverview";
import { CryptoSection } from "@/components/markets/CryptoSection";
import { FxWidget } from "@/components/markets/FxWidget";
import { FuturesCommoditiesSummary } from "@/components/markets/FuturesCommoditiesSummary";
import { StocksTabs } from "@/components/markets/StocksTabs";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-white">시장 개요</h1>
        <p className="mt-1 text-sm text-gray-400">
          실시간 주식·ETF·암호화폐 시장 현황을 한 눈에 확인하세요.
        </p>
      </div>

      {/* 주요 지수 */}
      <MarketOverview />

      {/* 환율 */}
      <FxWidget />

      {/* 암호화폐 (BTC/ETH) */}
      <CryptoSection limit={2} />

      {/* 선물 · 원자재 */}
      <FuturesCommoditiesSummary />

      {/* 주요국 주식 */}
      <StocksTabs />
    </div>
  );
}
