"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Portfolio, Holding, WatchlistItem } from "@/types/portfolio";
import { HoldingsTable } from "./HoldingsTable";
import { WatchlistSection } from "./WatchlistSection";
import { AddHoldingModal } from "./AddHoldingModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatKRW, formatPercent } from "@/lib/utils/format";
import { Plus, Briefcase } from "lucide-react";

export function PortfolioPageClient() {
  const { user, loading: authLoading } = useUser();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"holdings" | "watchlist">("holdings");

  async function fetchPortfolio() {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setPortfolio(data[0]);
      return data[0];
    }
    const created = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "내 포트폴리오" }),
    }).then((r) => r.json());
    setPortfolio(created);
    return created;
  }

  async function fetchHoldings(portfolioId: string) {
    const res = await fetch(`/api/portfolio/holdings?portfolio_id=${portfolioId}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const cryptoHoldings = data.filter((h: Holding) => h.asset_type === "crypto");
    const stockHoldings = data.filter((h: Holding) => h.asset_type === "stock" || h.asset_type === "etf");

    // 암호화폐 현재가 (CoinGecko batch)
    const cryptoPriceMap: Record<string, number> = {};
    if (cryptoHoldings.length > 0) {
      try {
        const priceRes = await fetch(`/api/crypto?limit=100`);
        const priceData = await priceRes.json();
        priceData.forEach((c: { id: string; current_price: number }) => {
          cryptoPriceMap[c.id] = c.current_price;
        });
      } catch { /* ignore */ }
    }

    // 주식/ETF 현재가 (Finnhub 개별 조회) — native currency (KRW 주식은 KRW, USD 주식은 USD)
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

    // native currency 기준으로 손익 계산
    const enriched = data.map((h: Holding) => {
      const cp =
        h.asset_type === "crypto"
          ? (cryptoPriceMap[h.symbol] ?? 0)
          : (stockPriceMap[h.symbol] ?? 0);
      const cv = cp * h.quantity;
      const cost = h.avg_buy_price * h.quantity;
      return {
        ...h,
        current_price: cp,
        current_value: cv,
        profit_loss: cv - cost,
        profit_loss_pct: cost > 0 ? ((cv - cost) / cost) * 100 : 0,
      };
    });
    setHoldings(enriched);
  }

  async function fetchWatchlist() {
    const res = await fetch("/api/portfolio/watchlist");
    const data = await res.json();
    if (Array.isArray(data)) setWatchlist(data);
  }

  async function init() {
    setLoading(true);
    try {
      const p = await fetchPortfolio();
      await Promise.all([fetchHoldings(p.id), fetchWatchlist()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) init();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  // 통화별 그룹 분리
  const krwHoldings = holdings.filter((h) => h.currency === "KRW");
  const usdHoldings = holdings.filter((h) => h.currency !== "KRW");

  function groupStats(group: Holding[]) {
    const totalValue = group.reduce((s, h) => s + (h.current_value ?? 0), 0);
    const totalCost = group.reduce((s, h) => s + h.avg_buy_price * h.quantity, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPnl, totalPnlPct };
  }

  const krw = groupStats(krwHoldings);
  const usd = groupStats(usdHoldings);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">포트폴리오</h1>
          {portfolio && <p className="mt-0.5 truncate text-sm text-gray-400">{portfolio.name}</p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          종목 추가
        </button>
      </div>

      {/* 요약 카드 — 통화별 분리 */}
      {holdings.length > 0 && (
        <div className="space-y-3">
          {krwHoldings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">원화 자산 (KRW)</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card>
                  <CardHeader><CardTitle>총 평가액</CardTitle></CardHeader>
                  <p className="text-xl font-bold text-white">{formatKRW(krw.totalValue)}</p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>총 투자금</CardTitle></CardHeader>
                  <p className="text-xl font-bold text-white">{formatKRW(krw.totalCost)}</p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>총 손익</CardTitle></CardHeader>
                  <p className={`text-xl font-bold ${krw.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {krw.totalPnl >= 0 ? "+" : ""}{formatKRW(krw.totalPnl)}
                  </p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>수익률</CardTitle></CardHeader>
                  <p className={`text-xl font-bold ${krw.totalPnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(krw.totalPnlPct)}
                  </p>
                </Card>
              </div>
            </div>
          )}
          {usdHoldings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">달러 자산 (USD)</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card>
                  <CardHeader><CardTitle>총 평가액</CardTitle></CardHeader>
                  <p className="text-xl font-bold text-white">{formatPrice(usd.totalValue)}</p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>총 투자금</CardTitle></CardHeader>
                  <p className="text-xl font-bold text-white">{formatPrice(usd.totalCost)}</p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>총 손익</CardTitle></CardHeader>
                  <p className={`text-xl font-bold ${usd.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {usd.totalPnl >= 0 ? "+" : ""}{formatPrice(usd.totalPnl)}
                  </p>
                </Card>
                <Card>
                  <CardHeader><CardTitle>수익률</CardTitle></CardHeader>
                  <p className={`text-xl font-bold ${usd.totalPnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatPercent(usd.totalPnlPct)}
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(["holdings", "watchlist"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-emerald-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab === "holdings" ? `보유 종목 (${holdings.length})` : `관심 목록 (${watchlist.length})`}
          </button>
        ))}
      </div>

      {activeTab === "holdings" ? (
        holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
            <Briefcase className="h-10 w-10 text-gray-600" />
            <p className="mt-3 text-gray-400">보유 종목이 없습니다</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              첫 종목 추가하기
            </button>
          </div>
        ) : (
          <HoldingsTable
            holdings={holdings}
            onDelete={async (id) => {
              await fetch(`/api/portfolio/holdings?id=${id}`, { method: "DELETE" });
              if (portfolio) fetchHoldings(portfolio.id);
            }}
          />
        )
      ) : (
        <WatchlistSection
          items={watchlist}
          onRemove={async (symbol) => {
            await fetch(`/api/portfolio/watchlist?symbol=${symbol}`, { method: "DELETE" });
            fetchWatchlist();
          }}
        />
      )}

      {showAddModal && portfolio && (
        <AddHoldingModal
          portfolioId={portfolio.id}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { fetchHoldings(portfolio.id); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
