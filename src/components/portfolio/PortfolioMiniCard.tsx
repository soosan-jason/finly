"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Holding } from "@/types/portfolio";
import { formatPrice, formatPercent } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export function PortfolioMiniCard() {
  const { user } = useUser();
  const [summary, setSummary] = useState<{ value: number; pnl: number; pnlPct: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    async function load() {
      try {
        // 포트폴리오 목록 가져오기
        const pRes = await fetch("/api/portfolio");
        const portfolios = await pRes.json();
        if (!Array.isArray(portfolios) || portfolios.length === 0) return;

        const hRes = await fetch(`/api/portfolio/holdings?portfolio_id=${portfolios[0].id}`);
        const holdings: Holding[] = await hRes.json();
        if (!Array.isArray(holdings) || holdings.length === 0) return;

        // 현재가 조회
        const priceRes = await fetch("/api/crypto?limit=100");
        const priceData = await priceRes.json();
        const priceMap: Record<string, number> = {};
        if (Array.isArray(priceData)) {
          priceData.forEach((c: { id: string; current_price: number }) => {
            priceMap[c.id] = c.current_price;
          });
        }

        let value = 0, cost = 0;
        holdings.forEach((h) => {
          const cp = priceMap[h.symbol] ?? h.avg_buy_price;
          value += cp * h.quantity;
          cost += h.avg_buy_price * h.quantity;
        });
        const pnl = value - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        setSummary({ value, pnl, pnlPct });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-gray-800" />;
  if (!summary) return null;

  const isProfit = summary.pnl >= 0;

  return (
    <Link
      href="/portfolio"
      className="group flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        {isProfit
          ? <TrendingUp className="h-5 w-5 text-emerald-400" />
          : <TrendingDown className="h-5 w-5 text-red-400" />}
        <div>
          <p className="text-xs text-gray-500">내 포트폴리오</p>
          <p className="text-lg font-bold text-white">{formatPrice(summary.value)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`text-sm font-medium ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
            {isProfit ? "+" : ""}{formatPrice(summary.pnl)}
          </p>
          <p className={`text-xs ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
            {formatPercent(summary.pnlPct)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </Link>
  );
}
