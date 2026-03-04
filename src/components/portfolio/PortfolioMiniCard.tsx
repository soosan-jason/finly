"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Holding } from "@/types/portfolio";
import { formatPrice, formatKRW, formatPercent } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface CurrencySummary {
  value: number;
  pnl: number;
  pnlPct: number;
}

export function PortfolioMiniCard() {
  const { user } = useUser();
  const [krw, setKrw] = useState<CurrencySummary | null>(null);
  const [usd, setUsd] = useState<CurrencySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function load() {
      try {
        const pRes = await fetch("/api/portfolio");
        const portfolios = await pRes.json();
        if (!Array.isArray(portfolios) || portfolios.length === 0) return;

        const hRes = await fetch(`/api/portfolio/holdings?portfolio_id=${portfolios[0].id}`);
        const holdings: Holding[] = await hRes.json();
        if (!Array.isArray(holdings) || holdings.length === 0) return;

        const cryptoHoldings = holdings.filter((h) => h.asset_type === "crypto");
        const stockHoldings = holdings.filter((h) => h.asset_type === "stock" || h.asset_type === "etf");

        // 암호화폐 현재가 (CoinGecko)
        const cryptoPriceMap: Record<string, number> = {};
        if (cryptoHoldings.length > 0) {
          try {
            const priceRes = await fetch("/api/crypto?limit=100");
            const priceData = await priceRes.json();
            if (Array.isArray(priceData)) {
              priceData.forEach((c: { id: string; current_price: number }) => {
                cryptoPriceMap[c.id] = c.current_price;
              });
            }
          } catch { /* ignore */ }
        }

        // 주식/ETF 현재가 (Finnhub + Yahoo Finance)
        const stockPriceMap: Record<string, number> = {};
        if (stockHoldings.length > 0) {
          await Promise.allSettled(
            stockHoldings.map(async (h: Holding) => {
              try {
                const qRes = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(h.symbol)}`);
                const q = await qRes.json();
                stockPriceMap[h.symbol] = q.current_price ?? 0;
              } catch { /* ignore */ }
            })
          );
        }

        function getPrice(h: Holding): number {
          if (h.asset_type === "crypto") return cryptoPriceMap[h.symbol] ?? h.avg_buy_price;
          return stockPriceMap[h.symbol] ?? h.avg_buy_price;
        }

        function calcSummary(group: Holding[]): CurrencySummary {
          let value = 0, cost = 0;
          group.forEach((h) => {
            const cp = getPrice(h);
            value += cp * h.quantity;
            cost += h.avg_buy_price * h.quantity;
          });
          const pnl = value - cost;
          const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
          return { value, pnl, pnlPct };
        }

        const krwGroup = holdings.filter((h) => h.currency === "KRW");
        const usdGroup = holdings.filter((h) => h.currency !== "KRW");

        if (krwGroup.length > 0) setKrw(calcSummary(krwGroup));
        if (usdGroup.length > 0) setUsd(calcSummary(usdGroup));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-gray-800" />;
  if (!krw && !usd) return null;

  return (
    <Link
      href="/portfolio"
      className="group flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 hover:border-gray-700 transition-colors"
    >
      <p className="text-xs text-gray-500">내 포트폴리오</p>

      {krw && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {krw.pnl >= 0
              ? <TrendingUp className="h-4 w-4 text-emerald-400" />
              : <TrendingDown className="h-4 w-4 text-red-400" />}
            <div>
              <p className="text-[10px] text-gray-500">원화 (KRW)</p>
              <p className="text-base font-bold text-white">{formatKRW(krw.value)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${krw.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {krw.pnl >= 0 ? "+" : ""}{formatKRW(krw.pnl)}
            </p>
            <p className={`text-xs ${krw.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPercent(krw.pnlPct)}
            </p>
          </div>
        </div>
      )}

      {usd && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {usd.pnl >= 0
              ? <TrendingUp className="h-4 w-4 text-emerald-400" />
              : <TrendingDown className="h-4 w-4 text-red-400" />}
            <div>
              <p className="text-[10px] text-gray-500">달러 (USD)</p>
              <p className="text-base font-bold text-white">{formatPrice(usd.value)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-sm font-medium ${usd.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {usd.pnl >= 0 ? "+" : ""}{formatPrice(usd.pnl)}
              </p>
              <p className={`text-xs ${usd.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(usd.pnlPct)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>
      )}

      {krw && !usd && (
        <div className="flex justify-end">
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      )}
    </Link>
  );
}
