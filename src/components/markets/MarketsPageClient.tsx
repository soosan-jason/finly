"use client";

import { useState, useEffect } from "react";
import { StockIndex } from "@/types/market";
import { IndexCard } from "./IndexCard";
import { FuturesSection } from "./FuturesSection";
import { CommoditiesSection } from "./CommoditiesSection";
import { BondsSection } from "./BondsSection";
import { TopStocksSection } from "./TopStocksSection";
import { useSwipeTab } from "@/hooks/useSwipeTab";

const TABS = [
  { id: "indices",     label: "지수" },
  { id: "futures",     label: "선물" },
  { id: "commodities", label: "원자재" },
  { id: "bonds",       label: "채권" },
  { id: "stocks",      label: "주식" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// JP/CN/EU 모두 "기타"로 묶기
const REGION_GROUP: Record<StockIndex["region"], string> = {
  KR: "한국",
  US: "미국",
  JP: "기타",
  CN: "기타",
  EU: "기타",
};

const GROUP_ORDER = ["한국", "미국", "기타"];

const FALLBACK_INDICES: StockIndex[] = [
  { symbol: "^KS11",     name: "KOSPI",      price: 2523.55,  change: 12.34,   changePercent: 0.49,  currency: "KRW", region: "KR" },
  { symbol: "^KQ11",     name: "KOSDAQ",     price: 742.18,   change: -3.21,   changePercent: -0.43, currency: "KRW", region: "KR" },
  { symbol: "^GSPC",     name: "S&P 500",    price: 5304.72,  change: 28.01,   changePercent: 0.53,  currency: "USD", region: "US" },
  { symbol: "^IXIC",     name: "NASDAQ",     price: 16742.39, change: -42.77,  changePercent: -0.25, currency: "USD", region: "US" },
  { symbol: "^DJI",      name: "DOW JONES",  price: 39107.54, change: 134.21,  changePercent: 0.34,  currency: "USD", region: "US" },
  { symbol: "^N225",     name: "NIKKEI 225", price: 38236.07, change: -201.37, changePercent: -0.52, currency: "JPY", region: "JP" },
  { symbol: "^HSI",      name: "항셍",       price: 23000.00, change: 120.50,  changePercent: 0.53,  currency: "HKD", region: "CN" },
  { symbol: "000001.SS", name: "상해종합",   price: 3300.00,  change: -8.40,   changePercent: -0.25, currency: "CNY", region: "CN" },
  { symbol: "399001.SZ", name: "심천성분",   price: 10500.00, change: 45.20,   changePercent: 0.43,  currency: "CNY", region: "CN" },
];

export function MarketsPageClient() {
  const [tab, setTab] = useState<TabId>("indices");
  const [indices, setIndices] = useState<StockIndex[]>([]);
  const [loading, setLoading] = useState(true);

  // 탭 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem("marketsTab") as TabId | null;
    if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
  }, []);

  function handleTabChange(next: TabId) {
    setTab(next);
    localStorage.setItem("marketsTab", next);
  }

  const tabIndex = TABS.findIndex((t) => t.id === tab);
  const { containerRef, onTouchStart, onTouchEnd } = useSwipeTab({
    count: TABS.length,
    current: tabIndex,
    onChange: (i) => handleTabChange(TABS[i].id),
  });

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch("/api/markets/indices");
        setIndices(await res.json());
      } catch {
        setIndices(FALLBACK_INDICES);
      } finally {
        setLoading(false);
      }
    }
    fetchIndices();
    const id = setInterval(fetchIndices, 60_000);
    return () => clearInterval(id);
  }, []);

  // 그룹화 → 정해진 순서로 정렬
  const grouped = indices.reduce<Record<string, StockIndex[]>>((acc, idx) => {
    const group = REGION_GROUP[idx.region] ?? "기타";
    if (!acc[group]) acc[group] = [];
    acc[group].push(idx);
    return acc;
  }, {});

  const orderedGroups = GROUP_ORDER.filter((g) => grouped[g]);

  return (
    <div className="space-y-5">
      {/* 탭 바 */}
      <div className="flex gap-1 rounded-xl bg-gray-800/60 p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-gray-700 text-white shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* 탭 콘텐츠 — 좌우 스와이프로 탭 전환 */}
      <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {tab === "indices" && (
        loading && indices.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {orderedGroups.map((group) => (
              <section key={group}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {grouped[group].map((index) => (
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
    </div>
  );
}
