"use client";

import { useEffect, useState } from "react";
import { TopStock } from "@/types/market";
import { formatPercent } from "@/lib/utils/format";

const COUNTRY_LABELS: Record<TopStock["country"], string> = {
  US: "미국",
  KR: "한국",
  JP: "일본",
};

const COUNTRY_ORDER: TopStock["country"][] = ["US", "KR", "JP"];

function fmtTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatStockPrice(price: number, currency: string): string {
  if (currency === "KRW") {
    return price.toLocaleString("ko-KR") + "원";
  }
  if (currency === "JPY") {
    return "¥" + price.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  }
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatChange(change: number, currency: string): string {
  const abs = Math.abs(change);
  if (currency === "KRW") return abs.toLocaleString("ko-KR");
  if (currency === "JPY") return abs.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  return abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export function TopStocksSection() {
  const [stocks, setStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/markets/stocks");
        setStocks(await res.json());
      } catch {
        // fallback은 API에서 처리
      } finally {
        setLoading(false);
      }
    }
    fetch_();
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {COUNTRY_ORDER.map((c) => (
          <div key={c}>
            <div className="mb-3 h-4 w-12 animate-pulse rounded bg-gray-700" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {COUNTRY_ORDER.map((country) => {
        const group = stocks.filter((s) => s.country === country);
        if (group.length === 0) return null;
        return (
          <section key={country}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {COUNTRY_LABELS[country]}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[...group].sort((a, b) => (b.marketCap ?? -Infinity) - (a.marketCap ?? -Infinity)).map((stock, idx) => {
                const up = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className={`relative overflow-hidden rounded-xl border bg-gray-900 p-4 transition-all hover:bg-gray-800/80 ${
                      up ? "border-emerald-500/20" : "border-red-500/20"
                    }`}
                  >
                    {/* 상단 accent bar */}
                    <div className={`absolute inset-x-0 top-0 h-0.5 ${up ? "bg-emerald-500" : "bg-red-500"}`} />

                    {/* 헤더: 순위+심볼(좌) + 시총(우) */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold text-gray-600 tabular-nums w-4 shrink-0">{idx + 1}</span>
                        <span className="text-xs text-gray-500 truncate">
                          {stock.symbol.replace(".KS", "").replace(".T", "")}
                        </span>
                      </div>
                      {stock.marketCap != null && (
                        <span className="shrink-0 text-xs text-gray-500 tabular-nums">
                          {formatMarketCap(stock.marketCap, stock.currency)}
                        </span>
                      )}
                    </div>

                    {/* 회사명 */}
                    <p className="mt-2 text-sm font-semibold text-gray-200 truncate">{stock.name}</p>

                    {/* 현재가 */}
                    <p className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
                      {formatStockPrice(stock.price, stock.currency)}
                    </p>

                    {/* 하단: 등락 절대값 + 등락률(좌) / 연동시간(우) */}
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
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
                      {fmtTime(stock.lastUpdated) && (
                        <span className="shrink-0 text-xs text-gray-600">{fmtTime(stock.lastUpdated)}</span>
                      )}
                    </div>

                    {/* 배경 glow */}
                    <div className={`pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl ${up ? "bg-emerald-500/5" : "bg-red-500/5"}`} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
