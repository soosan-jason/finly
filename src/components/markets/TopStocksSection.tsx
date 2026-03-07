"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { TopStock } from "@/types/market";
import { formatPercent } from "@/lib/utils/format";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

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

function StarButton({ symbol, name }: { symbol: string; name: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/portfolio/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWatched(data.some((w: { symbol: string }) => w.symbol === symbol));
      });
  }, [user, symbol]);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);
    if (watched) {
      await fetch(`/api/portfolio/watchlist?symbol=${symbol}`, { method: "DELETE" });
      setWatched(false);
    } else {
      await fetch("/api/portfolio/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_type: "stock", symbol, name }),
      });
      setWatched(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={watched ? "관심 목록에서 제거" : "관심 목록에 추가"}
      className={`absolute top-2 right-2 rounded-md p-1 transition-colors disabled:opacity-50 ${
        watched ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"
      }`}
    >
      <Star className={`h-3.5 w-3.5 ${watched ? "fill-yellow-400" : ""}`} />
    </button>
  );
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
              {group.map((stock, idx) => {
                const up = stock.change >= 0;
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

                    {/* 관심 버튼 */}
                    <StarButton symbol={stock.symbol} name={stock.name} />

                    {/* 헤더: 순위+심볼(좌) + 시총/연동시간(우) */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold text-gray-600 tabular-nums w-4 shrink-0">{idx + 1}</span>
                        <span className="text-xs text-gray-500 truncate">
                          {stock.symbol.replace(".KS", "").replace(".T", "")}
                          {stock.isFallback && <sup className="ml-0.5 text-red-400">*</sup>}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pr-5">
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
          </section>
        );
      })}
    </div>
  );
}
