"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
} from "lightweight-charts";
import { cn } from "@/lib/utils/cn";
import { formatMonthDay } from "@/lib/utils/format";
import { PortfolioSnapshot } from "@/types/portfolio";
import { usePreventSwipeNav } from "@/hooks/usePreventSwipeNav";
import { useT } from "@/lib/i18n/useT";
import { type TranslationKey } from "@/lib/i18n";

const PERIODS: { labelKey: TranslationKey; days: number }[] = [
  { labelKey: "chart.period.7d",  days: 7 },
  { labelKey: "chart.period.30d", days: 30 },
  { labelKey: "chart.period.90d", days: 90 },
  { labelKey: "chart.period.all", days: 0 },
];

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 600;
const MIN_WIDTH  = 280;
const MAX_WIDTH  = 1400;

export type CurrencyView = "KRW" | "USD" | "BOTH";
type DisplayMode = "chart" | "table";

interface PortfolioChartProps {
  portfolioId: string;
  view: CurrencyView;
  refreshKey?: number;
  className?: string;
}

const fmtKrw  = (v: number) => Math.round(v).toLocaleString("ko-KR");
const fmtUsd  = (v: number) => Math.round(v).toLocaleString("en-US");

const fmtPct  = (cost: number, pl: number) =>
  cost === 0 ? "—" : `${pl >= 0 ? "+" : ""}${((pl / cost) * 100).toFixed(2)}%`;

export function PortfolioChart({ portfolioId, view, refreshKey, className }: PortfolioChartProps) {
  const t = useT();
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);

  const [days, setDays] = useState(() => {
    if (typeof window === "undefined") return 30;
    return Number(localStorage.getItem("portfolio_chart_days") ?? 30);
  });
  const [chartHeight, setChartHeight] = useState(() => {
    if (typeof window === "undefined") return 220;
    return Number(localStorage.getItem("portfolio_chart_height") ?? 220);
  });
  const [chartWidth, setChartWidth] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("portfolio_chart_width");
    return v ? Number(v) : null;
  });
  const [loading, setLoading]     = useState(true);
  const [empty,   setEmpty]       = useState(false);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const tableScrollRef = usePreventSwipeNav<HTMLDivElement>();
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (typeof window === "undefined") return "chart";
    return (localStorage.getItem("portfolio_display_mode") as DisplayMode) ?? "chart";
  });

  const drag = useRef({ active: false, startX: 0, startY: 0, startW: 0, startH: 0 });

  function clampW(w: number) { return Math.min(MAX_WIDTH,  Math.max(MIN_WIDTH,  w)); }
  function clampH(h: number) { return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h)); }

  function startResize(clientX: number, clientY: number) {
    const currentW = wrapperRef.current?.offsetWidth ?? (chartWidth ?? 300);
    drag.current = { active: true, startX: clientX, startY: clientY, startW: currentW, startH: chartHeight };
  }
  function applyResize(clientX: number, clientY: number) {
    if (!drag.current.active) return;
    const newW = clampW(drag.current.startW + (clientX - drag.current.startX));
    const newH = clampH(drag.current.startH + (clientY - drag.current.startY));
    setChartWidth(newW);
    setChartHeight(newH);
    chartRef.current?.applyOptions({ width: newW, height: newH });
  }
  function endResize(clientX: number, clientY: number) {
    if (!drag.current.active) return;
    drag.current.active = false;
    const newW = clampW(drag.current.startW + (clientX - drag.current.startX));
    const newH = clampH(drag.current.startH + (clientY - drag.current.startY));
    localStorage.setItem("portfolio_chart_width",  String(Math.round(newW)));
    localStorage.setItem("portfolio_chart_height", String(Math.round(newH)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startResize(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => applyResize(ev.clientX, ev.clientY);
    const onUp   = (ev: MouseEvent) => {
      endResize(ev.clientX, ev.clientY);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }
  function handleTouchStart(e: React.TouchEvent) {
    startResize(e.touches[0].clientX, e.touches[0].clientY);
    const onMove = (ev: TouchEvent) => applyResize(ev.touches[0].clientX, ev.touches[0].clientY);
    const onEnd  = (ev: TouchEvent) => {
      endResize(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onEnd);
  }

  // ── 1. 데이터 페칭 (displayMode 무관) ───────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setEmpty(false);
      setSnapshots([]);
      try {
        const param = days > 0 ? `&days=${days}` : "&days=3650";
        const res  = await fetch(`/api/portfolio/snapshot?portfolio_id=${portfolioId}${param}`);
        const data: PortfolioSnapshot[] = await res.json();
        if (!data.length) { setEmpty(true); return; }
        setSnapshots(data); // API는 오래된 순 → 차트용. 테이블은 렌더 시 역순
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [portfolioId, days, refreshKey]);

  // ── 2. 차트 생성 (chart 모드 + 데이터 있을 때만) ──────────────────────
  useEffect(() => {
    if (displayMode !== "chart") return;
    if (!containerRef.current || snapshots.length === 0) return;

    const isBoth = view === "BOTH";

    const chart = createChart(containerRef.current, {
      localization: { locale: "en-US" },
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "#374151", visible: true },
      leftPriceScale:  { borderColor: "#374151", visible: isBoth },
      timeScale: { borderColor: "#374151", timeVisible: false },
      width:  chartWidth ?? containerRef.current.clientWidth,
      height: chartHeight,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (!containerRef.current) return;
      if (chartWidth === null) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    if (isBoth) {
      const krwSeries = chart.addSeries(LineSeries, {
        color: "#10b981", lineWidth: 2, priceLineVisible: false, priceScaleId: "right",
        priceFormat: { type: "custom", formatter: (v: number) => fmtKrw(v), minMove: 1 },
      });
      krwSeries.setData(snapshots.map((s) => ({
        time: s.snapshotted_on as Parameters<typeof krwSeries.setData>[0][number]["time"],
        value: s.total_value_krw,
      })));

      const usdSeries = chart.addSeries(LineSeries, {
        color: "#60a5fa", lineWidth: 2, priceLineVisible: false, priceScaleId: "left",
        priceFormat: { type: "custom", formatter: (v: number) => fmtUsd(v), minMove: 1 },
      });
      usdSeries.setData(snapshots.map((s) => ({
        time: s.snapshotted_on as Parameters<typeof usdSeries.setData>[0][number]["time"],
        value: s.total_value_usd,
      })));
    } else {
      const isKrw = view === "KRW";
      const series = chart.addSeries(LineSeries, {
        color: isKrw ? "#10b981" : "#60a5fa", lineWidth: 2, priceLineVisible: false, priceScaleId: "right",
        priceFormat: { type: "custom", formatter: isKrw ? fmtKrw : fmtUsd, minMove: 1 },
      });
      series.setData(snapshots.map((s) => ({
        time: s.snapshotted_on as Parameters<typeof series.setData>[0][number]["time"],
        value: isKrw ? s.total_value_krw : s.total_value_usd,
      })));
    }

    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [snapshots, view, displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 토글 핸들러 ───────────────────────────────────────────────────────
  function toggleMode(mode: DisplayMode) {
    setDisplayMode(mode);
    localStorage.setItem("portfolio_display_mode", mode);
  }

  // ── 렌더 ──────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>

      {/* 기간 선택 + 차트/테이블 토글 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => { setDays(p.days); localStorage.setItem("portfolio_chart_days", String(p.days)); }}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                days === p.days ? "bg-emerald-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              )}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>

        {/* 차트 / 테이블 전환 버튼 */}
        <div className="flex gap-0.5 rounded-lg bg-gray-800/60 p-0.5">
          <button
            onClick={() => toggleMode("chart")}
            title="차트 보기"
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              displayMode === "chart" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {/* 라인 차트 아이콘 */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1,10 4,6 7,8 10,3 13,5" />
            </svg>
          </button>
          <button
            onClick={() => toggleMode("table")}
            title="테이블 보기"
            className={cn(
              "flex items-center justify-center rounded-md p-1.5 transition-colors",
              displayMode === "table" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {/* 테이블 아이콘 */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="12" height="12" rx="1.5" />
              <line x1="1" y1="5" x2="13" y2="5" />
              <line x1="5" y1="5" x2="5" y2="13" />
            </svg>
          </button>
        </div>
      </div>

      {/* KRW+USD 범례 (차트 모드만) */}
      {view === "BOTH" && displayMode === "chart" && (
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-400" /> {t("chart.krwRight")}
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-4 rounded-full bg-blue-400" /> {t("chart.usdLeft")}
          </span>
        </div>
      )}

      {/* ── 차트 모드 ─────────────────────────────────────────────────── */}
      {displayMode === "chart" && (
        <div
          ref={wrapperRef}
          className="relative"
          style={{ width: chartWidth ?? "100%", height: chartHeight }}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-900/80">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          {empty && !loading && (
            <div className="flex h-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
              <p className="text-sm text-gray-500">{t("chart.accumulating")}</p>
            </div>
          )}
          <div ref={containerRef} className={cn("rounded-xl overflow-hidden h-full", empty && "hidden")} />

          {/* 우측 하단 리사이즈 핸들 */}
          <div
            className="absolute bottom-0 right-0 z-20 flex h-6 w-6 cursor-nwse-resize items-end justify-end pb-1 pr-1 select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            title="드래그하여 크기 조절"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-500">
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
              <circle cx="4" cy="8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="4" r="1.2" fill="currentColor" />
            </svg>
          </div>
        </div>
      )}

      {/* ── 테이블 모드 ───────────────────────────────────────────────── */}
      {displayMode === "table" && (
        <div
          className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
          style={{ height: chartHeight }}
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/80">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          {empty && !loading && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">{t("chart.accumulating")}</p>
            </div>
          )}

          {!empty && !loading && (
            <div ref={tableScrollRef} className="h-full overflow-auto">
              <table className="w-full text-xs [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm">
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">{t("chart.col.date")}</th>
                    {(view === "KRW" || view === "BOTH") && (
                      <>
                        <th className="px-3 py-2 text-right font-medium">{t("chart.col.krwVal")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("chart.col.krwPnl")}</th>
                      </>
                    )}
                    {(view === "USD" || view === "BOTH") && (
                      <>
                        <th className="px-3 py-2 text-right font-medium">{t("chart.col.usdVal")}</th>
                        <th className="px-3 py-2 text-right font-medium">{t("chart.col.usdPnl")}</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-right font-medium">{t("chart.col.return")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().map((s) => {
                    const plKrw = s.profit_loss_krw;
                    const plUsd = s.profit_loss_usd;
                    const pl    = view === "USD" ? plUsd : plKrw;
                    const cost  = view === "USD" ? s.total_cost_usd : s.total_cost_krw;
                    const up    = pl >= 0;
                    return (
                      <tr
                        key={s.snapshotted_on}
                        className="border-b border-gray-800/50 transition-colors hover:bg-gray-800/40"
                      >
                        <td className="px-3 py-2 font-mono text-gray-400">{formatMonthDay(s.snapshotted_on)}</td>
                        {(view === "KRW" || view === "BOTH") && (
                          <>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-200">
                              {fmtKrw(s.total_value_krw)}
                            </td>
                            <td className={cn("px-3 py-2 text-right tabular-nums", plKrw >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {plKrw >= 0 ? "+" : ""}{fmtKrw(plKrw)}
                            </td>
                          </>
                        )}
                        {(view === "USD" || view === "BOTH") && (
                          <>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-200">
                              {fmtUsd(s.total_value_usd)}
                            </td>
                            <td className={cn("px-3 py-2 text-right tabular-nums", plUsd >= 0 ? "text-emerald-400" : "text-red-400")}>
                              {plUsd >= 0 ? "+" : ""}{fmtUsd(plUsd)}
                            </td>
                          </>
                        )}
                        <td className={cn("px-3 py-2 text-right tabular-nums font-medium", up ? "text-emerald-400" : "text-red-400")}>
                          {fmtPct(cost, pl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
