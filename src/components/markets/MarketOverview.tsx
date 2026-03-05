"use client";

import { useEffect, useState } from "react";
import { StockIndex } from "@/types/market";
import { IndexCard } from "./IndexCard";
import { RefreshCw } from "lucide-react";

export function MarketOverview() {
  const [indices, setIndices] = useState<StockIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function fetchIndices() {
    try {
      setLoading(true);
      const res = await fetch("/api/markets/indices");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIndices(data);
      setLastUpdated(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    } catch {
      // fallback 샘플 데이터
      setIndices([
        { symbol: "^KS11", name: "KOSPI", price: 2523.55, change: 12.34, changePercent: 0.49, currency: "KRW", region: "KR" },
        { symbol: "^KQ11", name: "KOSDAQ", price: 742.18, change: -3.21, changePercent: -0.43, currency: "KRW", region: "KR" },
        { symbol: "^GSPC", name: "S&P 500", price: 5304.72, change: 28.01, changePercent: 0.53, currency: "USD", region: "US" },
        { symbol: "^IXIC", name: "NASDAQ", price: 16742.39, change: -42.77, changePercent: -0.25, currency: "USD", region: "US" },
        { symbol: "^DJI", name: "DOW JONES", price: 39107.54, change: 134.21, changePercent: 0.34, currency: "USD", region: "US" },
        { symbol: "^N225", name: "NIKKEI 225", price: 38236.07, change: -201.37, changePercent: -0.52, currency: "JPY", region: "JP" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">주요 지수</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {lastUpdated && <span>업데이트: {lastUpdated}</span>}
          <button
            onClick={fetchIndices}
            className="rounded-lg p-1.5 hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {loading && indices.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
            ))
          : indices.map((index) => <IndexCard key={index.symbol} index={index} />)}
      </div>
    </section>
  );
}
