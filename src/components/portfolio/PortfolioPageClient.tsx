"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Portfolio, Holding, WatchlistItem } from "@/types/portfolio";
import { HoldingsTable } from "./HoldingsTable";
import { WatchlistSection } from "./WatchlistSection";
import { AddHoldingModal } from "./AddHoldingModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatPercent } from "@/lib/utils/format";
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
    // 포트폴리오 없으면 자동 생성
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
    if (Array.isArray(data)) {
      // CoinGecko에서 현재 가격 일괄 조회
      const symbols = data
        .filter((h: Holding) => h.asset_type === "crypto")
        .map((h: Holding) => h.symbol);
      if (symbols.length > 0) {
        try {
          const priceRes = await fetch(`/api/crypto?limit=100`);
          const priceData = await priceRes.json();
          const priceMap = Object.fromEntries(
            priceData.map((c: { id: string; current_price: number }) => [c.id, c.current_price])
          );
          const enriched = data.map((h: Holding) => {
            const cp = priceMap[h.symbol] ?? 0;
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
          return;
        } catch { /* fallback */ }
      }
      setHoldings(data);
    }
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

  // 총 평가액 / 손익 계산
  const totalValue = holdings.reduce((s, h) => s + (h.current_value ?? 0), 0);
  const totalCost = holdings.reduce((s, h) => s + h.avg_buy_price * h.quantity, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isProfit = totalPnl >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">포트폴리오</h1>
          {portfolio && <p className="mt-0.5 text-sm text-gray-400">{portfolio.name}</p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          종목 추가
        </button>
      </div>

      {/* 요약 카드 */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>총 평가액</CardTitle></CardHeader>
            <p className="text-xl font-bold text-white">{formatPrice(totalValue)}</p>
          </Card>
          <Card>
            <CardHeader><CardTitle>총 투자금</CardTitle></CardHeader>
            <p className="text-xl font-bold text-white">{formatPrice(totalCost)}</p>
          </Card>
          <Card>
            <CardHeader><CardTitle>총 손익</CardTitle></CardHeader>
            <p className={`text-xl font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
              {isProfit ? "+" : ""}{formatPrice(totalPnl)}
            </p>
          </Card>
          <Card>
            <CardHeader><CardTitle>수익률</CardTitle></CardHeader>
            <p className={`text-xl font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
              {formatPercent(totalPnlPct)}
            </p>
          </Card>
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
