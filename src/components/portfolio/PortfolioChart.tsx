"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
} from "lightweight-charts";
import { cn } from "@/lib/utils/cn";
import { PortfolioSnapshot } from "@/types/portfolio";

const PERIODS = [
  { label: "7일",  days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "전체", days: 0 },
];

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 600;
const MIN_WIDTH  = 280;
const MAX_WIDTH  = 1400;

export type CurrencyView = "KRW" | "USD" | "BOTH";

interface PortfolioChartProps {
  portfolioId: string;
  view: CurrencyView;
  className?: string;
}

const fmtKrw = (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`;
const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function PortfolioChart({ portfolioId, view, className }: PortfolioChartProps) {
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
  // null = 컨테이너 100% (기본값), 숫자 = 고정 px
  const [chartWidth, setChartWidth] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("portfolio_chart_width");
    return v ? Number(v) : null;
  });
  const [loading, setLoading] = useState(true);
  const [empty,   setEmpty]   = useState(false);

  // 드래그 상태 refs (렌더 불필요)
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

  // 마우스 이벤트
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

  // 터치 이벤트
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

  useEffect(() => {
    if (!containerRef.current) return;
    const isBoth = view === "BOTH";

    const chart = createChart(containerRef.current, {
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
      // 고정 width가 없을 때만 컨테이너 너비에 맞춤
      if (chartWidth === null) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    async function loadData() {
      setLoading(true);
      setEmpty(false);
      try {
        const param = days > 0 ? `&days=${days}` : "&days=3650";
        const res = await fetch(`/api/portfolio/snapshot?portfolio_id=${portfolioId}${param}`);
        const snapshots: PortfolioSnapshot[] = await res.json();

        if (!snapshots.length) { setEmpty(true); return; }

        if (isBoth) {
          const krwSeries = chart.addSeries(LineSeries, {
            color: "#10b981", lineWidth: 2, priceLineVisible: false, priceScaleId: "right",
            priceFormat: { type: "custom", formatter: (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`, minMove: 1 },
          });
          krwSeries.setData(snapshots.map((s) => ({
            time: s.snapshotted_on as Parameters<typeof krwSeries.setData>[0][number]["time"],
            value: s.total_value_krw,
          })));

          const usdSeries = chart.addSeries(LineSeries, {
            color: "#60a5fa", lineWidth: 2, priceLineVisible: false, priceScaleId: "left",
            priceFormat: { type: "custom", formatter: (v: number) => `$${Math.round(v).toLocaleString("en-US")}`, minMove: 1 },
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
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [portfolioId, view, days]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("space-y-3", className)}>
      {/* 기간 선택 */}
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
            {p.label}
          </button>
        ))}
      </div>

      {/* KRW+USD 범례 */}
      {view === "BOTH" && (
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-400" /> KRW (우측)
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-4 rounded-full bg-blue-400" /> USD (좌측)
          </span>
        </div>
      )}

      {/* 차트 영역 — 우측 하단 모서리 핸들로 2D 리사이즈 */}
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
            <p className="text-sm text-gray-500">데이터가 쌓이는 중입니다 — 매일 방문하면 추이가 기록됩니다.</p>
          </div>
        )}
        <div ref={containerRef} className={cn("rounded-xl overflow-hidden h-full", empty && "hidden")} />

        {/* 우측 하단 모서리 리사이즈 핸들 */}
        <div
          className="absolute bottom-0 right-0 z-20 flex h-6 w-6 cursor-nwse-resize items-end justify-end pb-1 pr-1 select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          title="드래그하여 크기 조절"
        >
          {/* 점 3개 그리드 아이콘 */}
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-gray-500">
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="4" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="4" r="1.2" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
