"use client";

import { useEffect, useState } from "react";
import { TopStock } from "@/types/market";
import { Card } from "@/components/ui/card";
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
              {group.map((stock) => {
                const up = stock.change >= 0;
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
                        {fmtTime(stock.lastUpdated) && (
                          <p className="mt-1 text-xs text-gray-600">{fmtTime(stock.lastUpdated)}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
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
                        {stock.marketCap != null && (
                          <span className="text-xs text-gray-500 tabular-nums">
                            {formatMarketCap(stock.marketCap, stock.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
