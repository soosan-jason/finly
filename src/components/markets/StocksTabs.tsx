"use client";

import { useEffect, useState } from "react";
import { TopStock } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils/format";
import Link from "next/link";

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

function formatMarketCap(cap: number, currency: string): string {
  if (currency === "KRW") {
    const jo = cap / 1e12;
    return jo >= 1 ? `${jo.toFixed(0)}조` : `${(cap / 1e8).toFixed(0)}억`;
  }
  if (currency === "JPY") return `${(cap / 1e12).toFixed(1)}兆`;
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  return `$${(cap / 1e9).toFixed(0)}B`;
}

export function StocksTabs() {
  const [stocks, setStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Country>("US");

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
            onClick={() => setActiveTab(tab.key)}
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

      {/* 카드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {group.map((stock) => {
            const up = stock.changePct >= 0;
            return (
              <Card key={stock.symbol} className="flex flex-col justify-between">
                {/* 심볼(좌) + 등락률·현재가·시총(우) */}
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">
                      {stock.symbol.replace(".KS", "").replace(".T", "")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-200 leading-tight truncate">
                      {stock.name}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {stock.marketCap != null && (
                      <span className="text-xs text-gray-500 tabular-nums">
                        {formatMarketCap(stock.marketCap, stock.currency)}
                      </span>
                    )}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                        up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {formatPercent(stock.changePct)}
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {formatStockPrice(stock.price, stock.currency)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
