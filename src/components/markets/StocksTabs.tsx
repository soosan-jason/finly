"use client";

import { useEffect, useState } from "react";
import { TopStock } from "@/types/market";
import { formatPercent } from "@/lib/utils/format";
import Link from "next/link";
import { useSwipeTab } from "@/hooks/useSwipeTab";

type Country = TopStock["country"];

const TABS: { key: Country; label: string; flag: string }[] = [
  { key: "US", label: "미국", flag: "🇺🇸" },
  { key: "KR", label: "한국", flag: "🇰🇷" },
  { key: "JP", label: "일본", flag: "🇯🇵" },
];

function formatStockPrice(price: number, currency: string): string {
  if (currency === "KRW") return price.toLocaleString("ko-KR") + "원";
  if (currency === "JPY") return "¥" + price.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(change: number, currency: string): string {
  const abs = Math.abs(change);
  if (currency === "KRW") return abs.toLocaleString("ko-KR");
  if (currency === "JPY") return abs.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  return abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatMarketCap(cap: number, currency: string): string {
  if (currency === "KRW") {
    const jo = cap / 1e12;
    return jo >= 1 ? `${jo.toFixed(0)}조` : `${(cap / 1e8).toFixed(0)}억`;
  }
  if (currency === "JPY") return `${(cap / 1e12).toFixed(1)}兆`;
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  return `$${(cap / 1e9).toFixed(0)}B`;
}

const STORAGE_KEY = "stocks-tab";

export function StocksTabs() {
  const [stocks, setStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Country>(() => {
    if (typeof window === "undefined") return "US";
    const saved = localStorage.getItem(STORAGE_KEY) as Country | null;
    return TABS.some((t) => t.key === saved) ? saved! : "US";
  });

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/markets/stocks");
        if (res.ok) setStocks(await res.json());
      } finally {
        setLoading(false);
      }
    }
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, []);

  const group = stocks.filter((s) => s.country === activeTab);

  function changeTab(country: Country) {
    setActiveTab(country);
    localStorage.setItem(STORAGE_KEY, country);
  }

  const tabIndex = TABS.findIndex((t) => t.key === activeTab);
  const { containerRef, onTouchStart, onTouchEnd } = useSwipeTab({
    count: TABS.length,
    current: tabIndex,
    onChange: (i) => changeTab(TABS[i].key),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">주요국 주식</h2>
        <Link href="/markets?tab=stocks" className="text-sm text-emerald-400 hover:underline">
          전체보기 →
        </Link>
      </div>

      {/* 탭 버튼 */}
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-900 border border-gray-800 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.flag} {tab.label}
          </button>
        ))}
      </div>

      {/* 카드 그리드 — 좌우 스와이프로 국가 탭 전환 */}
      <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {group.map((stock, idx) => {
            const up = stock.changePct >= 0;
            return (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className={`relative overflow-hidden rounded-xl border bg-gray-900 p-4 transition-all hover:bg-gray-800/80 block ${
                  up ? "border-emerald-500/20" : "border-red-500/20"
                }`}
              >
                {/* 상단 accent bar */}
                <div className={`absolute inset-x-0 top-0 h-0.5 ${up ? "bg-emerald-500" : "bg-red-500"}`} />

                {/* 헤더: 순위+심볼(좌) + 시총/연동시간(우) */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-xs font-bold text-gray-600 tabular-nums w-4 shrink-0">{idx + 1}</span>
                    <span className="text-xs text-gray-500 truncate">
                      {stock.symbol.replace(".KS", "").replace(".T", "")}
                      {stock.isFallback && <sup className="ml-0.5 text-red-400">*</sup>}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    {stock.marketCap != null && (
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatMarketCap(stock.marketCap, stock.currency)}
                      </span>
                    )}
                    {fmtTime(stock.lastUpdated) && (
                      <span className="text-xs text-gray-600">{fmtTime(stock.lastUpdated)}</span>
                    )}
                  </div>
                </div>

                {/* 회사명 */}
                <p className="mt-2 text-sm font-semibold text-gray-200 truncate whitespace-nowrap">{stock.name}</p>

                {/* 현재가 */}
                <p className="mt-1 text-2xl font-bold tracking-tight text-white tabular-nums whitespace-nowrap truncate">
                  {formatStockPrice(stock.price, stock.currency)}
                </p>

                {/* 하단: 등락 절대값 + 등락률 */}
                <div className="mt-1 flex items-center gap-1 min-w-0">
                  <span className={`text-xs font-medium tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "▲" : "▼"}&nbsp;{formatChange(stock.change, stock.currency)}
                  </span>
                  <span
                    className={`rounded-md px-1 py-0.5 text-xs font-semibold tabular-nums ${
                      up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {formatPercent(stock.changePct)}
                  </span>
                </div>

                {/* 배경 glow */}
                <div className={`pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl ${up ? "bg-emerald-500/5" : "bg-red-500/5"}`} />
              </Link>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}
