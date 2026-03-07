"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Portfolio, Holding, WatchlistItem } from "@/types/portfolio";
import { HoldingsTable } from "./HoldingsTable";
import { WatchlistSection } from "./WatchlistSection";
import { AddHoldingModal } from "./AddHoldingModal";
import { PortfolioChart, type CurrencyView } from "./PortfolioChart";
import { formatPrice, formatKRW, formatPercent } from "@/lib/utils/format";
import { Plus, Briefcase } from "lucide-react";
import { usePreventSwipeNav } from "@/hooks/usePreventSwipeNav";

interface HeroCardProps {
  label: string;
  totalValue: string;
  totalCost: string;
  pnl: string;
  pnlPositive: boolean;
  pct: number;
  pctLabel: string;
}

function SummaryHeroCard({ label, totalValue, totalCost, pnl, pnlPositive, pct, pctLabel }: HeroCardProps) {
  const barWidth = Math.min(Math.abs(pct), 100);
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-2 text-xs font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold tracking-tight text-white">{totalValue}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-gray-500">투자 {totalCost}</span>
        <span className={pnlPositive ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
          {pnl}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">수익률</span>
          <span className={`font-semibold ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>
            {pctLabel}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pnlPositive ? "bg-emerald-400" : "bg-red-400"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function PortfolioPageClient() {
  const { user, loading: authLoading } = useUser();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"holdings" | "watchlist">(() => {
    if (typeof window === "undefined") return "holdings";
    const saved = localStorage.getItem("portfolio_active_tab");
    return saved === "watchlist" ? "watchlist" : "holdings";
  });
  const [chartView, setChartView] = useState<CurrencyView>(() => {
    if (typeof window === "undefined") return "KRW";
    return (localStorage.getItem("portfolio_chart_view") as CurrencyView) ?? "KRW";
  });
  const snapshotSavedRef = useRef<string | null>(null);
  const [chartRefreshKey, setChartRefreshKey] = useState(0);

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

    // 주식/ETF 현재가 (Finnhub 개별 조회)
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

    const enriched = data.map((h: Holding) => {
      // currency가 DB에 없거나 null인 경우 심볼 접미사로 감지
      const currency: string =
        h.currency ||
        (h.asset_type === "crypto"
          ? "USD"
          : h.symbol.endsWith(".KS") || h.symbol.endsWith(".KQ")
          ? "KRW"
          : h.symbol.endsWith(".T")
          ? "JPY"
          : "USD");

      const rawPrice =
        h.asset_type === "crypto"
          ? (cryptoPriceMap[h.symbol] ?? 0)
          : (stockPriceMap[h.symbol] ?? 0);
      // 가격 API 실패(0) 시 평균매수가로 fallback
      const cp = rawPrice > 0 ? rawPrice : h.avg_buy_price;
      const cv = cp * h.quantity;
      const cost = h.avg_buy_price * h.quantity;
      return {
        ...h,
        currency,
        current_price: cp,
        current_value: cv,
        profit_loss: cv - cost,
        profit_loss_pct: cost > 0 ? ((cv - cost) / cost) * 100 : 0,
      };
    });
    setHoldings(enriched);
    return enriched;
  }

  async function fetchWatchlist() {
    const res = await fetch("/api/portfolio/watchlist");
    const data = await res.json();
    if (!Array.isArray(data)) return;

    // 자산 유형별 그룹핑
    const cryptoItems  = data.filter((i: WatchlistItem) => i.asset_type === "crypto");
    const stockItems   = data.filter((i: WatchlistItem) => i.asset_type === "stock" || i.asset_type === "etf");
    const commItems    = data.filter((i: WatchlistItem) => i.asset_type === "commodity");
    const futureItems  = data.filter((i: WatchlistItem) => i.asset_type === "futures");

    // 유형별 가격 맵 구성 (병렬 조회)
    const [cryptoMap, stockMap, commMap, futuresMap] = await Promise.all([
      // ─ 암호화폐: CoinGecko 배치 조회
      cryptoItems.length > 0
        ? fetch("/api/crypto?limit=250").then((r) => r.json()).then((list: unknown[]) => {
            const map: Record<string, { price: number; change: number; changePct: number }> = {};
            if (Array.isArray(list)) {
              for (const c of list as Array<{id:string;current_price:number;price_change_24h?:number;price_change_percentage_24h:number}>) {
                map[c.id] = { price: c.current_price, change: c.price_change_24h ?? 0, changePct: c.price_change_percentage_24h };
              }
            }
            return map;
          }).catch(() => ({}))
        : Promise.resolve({}),

      // ─ 주식/ETF: 개별 quote 조회
      stockItems.length > 0
        ? Promise.allSettled(
            stockItems.map((item: WatchlistItem) =>
              fetch(`/api/stock/quote?symbol=${item.symbol}`).then((r) => r.json())
                .then((q: { current_price?: number; change?: number; change_percent?: number }) => ({ symbol: item.symbol, q }))
                .catch(() => null)
            )
          ).then((results) => {
            const map: Record<string, { price: number; change: number; changePct: number; currency: string }> = {};
            for (const r of results) {
              if (r.status === "fulfilled" && r.value) {
                const { symbol, q } = r.value as { symbol: string; q: { current_price?: number; change?: number; change_percent?: number } };
                if (q?.current_price) {
                  const isKR = symbol.endsWith(".KS") || symbol.endsWith(".KQ");
                  map[symbol] = { price: q.current_price, change: q.change ?? 0, changePct: q.change_percent ?? 0, currency: isKR ? "KRW" : "USD" };
                }
              }
            }
            return map;
          })
        : Promise.resolve({}),

      // ─ 원자재
      commItems.length > 0
        ? fetch("/api/markets/commodities").then((r) => r.json()).then((list: unknown[]) => {
            const map: Record<string, { price: number; change: number; changePct: number }> = {};
            if (Array.isArray(list)) {
              for (const c of list as Array<{symbol:string;price:number;change:number;changePct:number}>) {
                map[c.symbol] = { price: c.price, change: c.change, changePct: c.changePct };
              }
            }
            return map;
          }).catch(() => ({}))
        : Promise.resolve({}),

      // ─ 선물
      futureItems.length > 0
        ? fetch("/api/markets/futures").then((r) => r.json()).then((list: unknown[]) => {
            const map: Record<string, { price: number; change: number; changePct: number }> = {};
            if (Array.isArray(list)) {
              for (const f of list as Array<{symbol:string;price:number;change:number;changePct:number}>) {
                map[f.symbol] = { price: f.price, change: f.change, changePct: f.changePct };
              }
            }
            return map;
          }).catch(() => ({}))
        : Promise.resolve({}),
    ]);

    const enriched: WatchlistItem[] = data.map((item: WatchlistItem) => {
      let info: { price: number; change: number; changePct: number; currency?: string } | undefined;
      if (item.asset_type === "crypto")                              info = (cryptoMap as Record<string, typeof info>)[item.symbol];
      else if (item.asset_type === "stock" || item.asset_type === "etf") info = (stockMap as Record<string, typeof info>)[item.symbol];
      else if (item.asset_type === "commodity")                     info = (commMap as Record<string, typeof info>)[item.symbol];
      else if (item.asset_type === "futures")                       info = (futuresMap as Record<string, typeof info>)[item.symbol];
      if (!info) return item;
      return { ...item, current_price: info.price, change: info.change, change_pct: info.changePct, currency: info.currency ?? "USD" };
    });

    setWatchlist(enriched);
  }

  async function saveSnapshot(portfolioId: string, enriched: Holding[]) {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    if (snapshotSavedRef.current === today) return; // 오늘 이미 저장

    const krw = enriched.filter((h) => h.currency === "KRW");
    const usd = enriched.filter((h) => h.currency !== "KRW");

    function stats(group: Holding[]) {
      const value = group.reduce((s, h) => s + (h.current_value ?? 0), 0);
      const cost  = group.reduce((s, h) => s + h.avg_buy_price * h.quantity, 0);
      return { value, cost, pl: value - cost };
    }

    const krwStats = stats(krw);
    const usdStats = stats(usd);

    try {
      await fetch("/api/portfolio/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio_id:    portfolioId,
          total_value_krw: krwStats.value,
          total_cost_krw:  krwStats.cost,
          profit_loss_krw: krwStats.pl,
          total_value_usd: usdStats.value,
          total_cost_usd:  usdStats.cost,
          profit_loss_usd: usdStats.pl,
        }),
      });
      snapshotSavedRef.current = today;
      setChartRefreshKey((k) => k + 1);
    } catch { /* ignore — 스냅샷 실패는 조용히 */ }
  }

  async function init() {
    setLoading(true);
    try {
      const p = await fetchPortfolio();
      const [enriched] = await Promise.all([fetchHoldings(p.id), fetchWatchlist()]);
      if (enriched && enriched.length > 0) {
        saveSnapshot(p.id, enriched);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) init();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartScrollRef = usePreventSwipeNav<HTMLDivElement>();

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

  const hasKrw = krwHoldings.length > 0;
  const hasUsd = usdHoldings.length > 0;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">포트폴리오</h1>
          {portfolio && <p className="mt-0.5 truncate text-sm text-gray-400">{portfolio.name}</p>}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          종목 추가
        </button>
      </div>

      {/* 히어로 요약 카드 — 통화별 */}
      {holdings.length > 0 && (
        <div className="space-y-3">
          {hasKrw && (
            <SummaryHeroCard
              label="원화 자산 (KRW)"
              totalValue={formatKRW(krw.totalValue)}
              totalCost={formatKRW(krw.totalCost)}
              pnl={`${krw.totalPnl >= 0 ? "+" : ""}${formatKRW(krw.totalPnl)}`}
              pnlPositive={krw.totalPnl >= 0}
              pct={krw.totalPnlPct}
              pctLabel={formatPercent(krw.totalPnlPct)}
            />
          )}
          {hasUsd && (
            <SummaryHeroCard
              label="달러 자산 (USD)"
              totalValue={formatPrice(usd.totalValue)}
              totalCost={formatPrice(usd.totalCost)}
              pnl={`${usd.totalPnl >= 0 ? "+" : ""}${formatPrice(usd.totalPnl)}`}
              pnlPositive={usd.totalPnl >= 0}
              pct={usd.totalPnlPct}
              pctLabel={formatPercent(usd.totalPnlPct)}
            />
          )}
        </div>
      )}

      {/* 자산 추이 차트 */}
      {holdings.length > 0 && portfolio && (
        <div ref={chartScrollRef} className="rounded-2xl border border-gray-800 bg-gray-900 p-4 overflow-x-auto" style={{ touchAction: "pan-x pan-y", overscrollBehaviorX: "none" }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">자산 추이</h2>
            {hasKrw && hasUsd && (
              <div className="flex gap-1 rounded-lg bg-gray-800 p-0.5">
                {(
                  [
                    { label: "KRW",     value: "KRW"  },
                    { label: "USD",     value: "USD"  },
                    { label: "KRW+USD", value: "BOTH" },
                  ] as { label: string; value: CurrencyView }[]
                ).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setChartView(t.value); localStorage.setItem("portfolio_chart_view", t.value); }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      chartView === t.value ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <PortfolioChart
            portfolioId={portfolio.id}
            view={hasKrw && !hasUsd ? "KRW" : !hasKrw && hasUsd ? "USD" : chartView}
            refreshKey={chartRefreshKey}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(["holdings", "watchlist"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); localStorage.setItem("portfolio_active_tab", tab); }}
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
              if (portfolio) {
                snapshotSavedRef.current = null;
                const enriched = await fetchHoldings(portfolio.id);
                if (enriched) saveSnapshot(portfolio.id, enriched);
              }
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
          onAdded={async () => {
            snapshotSavedRef.current = null;
            const enriched = await fetchHoldings(portfolio.id);
            if (enriched) saveSnapshot(portfolio.id, enriched);
            setShowAddModal(false);
          }}
        />
      )}

      {/* 모바일 FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-400 transition-colors md:hidden"
        aria-label="종목 추가"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
