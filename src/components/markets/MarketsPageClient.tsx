"use client";

import { useState, useEffect } from "react";
import { StockIndex } from "@/types/market";
import { IndexCard } from "./IndexCard";
import { FuturesSection } from "./FuturesSection";
import { CommoditiesSection } from "./CommoditiesSection";
import { BondsSection } from "./BondsSection";
import { TopStocksSection } from "./TopStocksSection";
import { RefreshCw } from "lucide-react";

const TABS = [
  { id: "indices",     label: "지수" },
  { id: "futures",     label: "선물" },
  { id: "commodities", label: "원자재" },
  { id: "bonds",       label: "채권" },
  { id: "stocks",      label: "주식" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const REGION_LABELS: Record<StockIndex["region"], string> = {
  KR: "한국",
  US: "미국",
  JP: "일본",
  CN: "중국",
  EU: "유럽",
};

export function MarketsPageClient() {
  const [tab, setTab] = useState<TabId>("indices");
  const [indices, setIndices] = useState<StockIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchIndices() {
    setLoading(true);
    try {
      const res = await fetch("/api/markets/indices");
      const data = await res.json();
      setIndices(data);
      setLastUpdated(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    } catch {
      setIndices([
        { symbol: "^KS11", name: "KOSPI",      price: 2523.55, change: 12.34,   changePercent: 0.49,  currency: "KRW", region: "KR" },
        { symbol: "^KQ11", name: "KOSDAQ",     price: 742.18,  change: -3.21,   changePercent: -0.43, currency: "KRW", region: "KR" },
        { symbol: "^GSPC", name: "S&P 500",    price: 5304.72, change: 28.01,   changePercent: 0.53,  currency: "USD", region: "US" },
        { symbol: "^IXIC", name: "NASDAQ",     price: 16742.39,change: -42.77,  changePercent: -0.25, currency: "USD", region: "US" },
        { symbol: "^DJI",  name: "DOW JONES",  price: 39107.54,change: 134.21,  changePercent: 0.34,  currency: "USD", region: "US" },
        { symbol: "^N225", name: "NIKKEI 225", price: 38236.07,change: -201.37, changePercent: -0.52, currency: "JPY", region: "JP" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIndices();
    const id = setInterval(fetchIndices, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = indices.reduce<Record<string, StockIndex[]>>((acc, idx) => {
    const region = REGION_LABELS[idx.region] ?? idx.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(idx);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* 탭 바 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-gray-800/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-gray-700 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "indices" && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {lastUpdated && <span>업데이트: {lastUpdated}</span>}
            <button
              onClick={fetchIndices}
              className="rounded-lg p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "indices" && (
        loading && indices.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([region, regionIndices]) => (
              <section key={region}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {region}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {regionIndices.map((index) => (
                    <IndexCard key={index.symbol} index={index} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      )}

      {tab === "futures"     && <FuturesSection />}
      {tab === "commodities" && <CommoditiesSection />}
      {tab === "bonds"       && <BondsSection />}
      {tab === "stocks"      && <TopStocksSection />}
    </div>
  );
}
