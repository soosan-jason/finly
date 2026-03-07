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

function formatStockPrice(price: number, currency: string): string {
  if (currency === "KRW") {
    return price.toLocaleString("ko-KR") + "원";
  }
  if (currency === "JPY") {
    return "¥" + price.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  }
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                    <div>
                      <p className="text-xs text-gray-500">{stock.symbol.replace(".KS", "").replace(".T", "")}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-200 leading-tight">{stock.name}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-base font-bold text-white">
                        {formatStockPrice(stock.price, stock.currency)}
                      </p>
                      <p className={`mt-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPercent(stock.changePct)}
                      </p>
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
