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

export type CurrencyView = "KRW" | "USD" | "BOTH";

interface PortfolioChartProps {
  portfolioId: string;
  view: CurrencyView;
  className?: string;
}

const fmtKrw = (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`;
const fmtUsd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

export function PortfolioChart({ portfolioId, view, className }: PortfolioChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

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
      rightPriceScale: {
        borderColor: "#374151",
        visible: true,
      },
      leftPriceScale: {
        borderColor: "#374151",
        visible: isBoth,
      },
      timeScale: { borderColor: "#374151", timeVisible: false },
      width: containerRef.current.clientWidth,
      height: 220,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current) {
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

        if (!snapshots.length) {
          setEmpty(true);
          return;
        }

        if (isBoth) {
          // KRW 시리즈 — 오른쪽 축
          const krwSeries = chart.addSeries(LineSeries, {
            color: "#10b981",
            lineWidth: 2,
            priceLineVisible: false,
            priceScaleId: "right",
            priceFormat: {
              type: "custom",
              formatter: (v: number) => `₩${Math.round(v).toLocaleString("ko-KR")}`,
              minMove: 1,
            },
          });
          krwSeries.setData(
            snapshots.map((s) => ({
              time: s.snapshotted_on as Parameters<typeof krwSeries.setData>[0][number]["time"],
              value: s.total_value_krw,
            }))
          );

          // USD 시리즈 — 왼쪽 축
          const usdSeries = chart.addSeries(LineSeries, {
            color: "#60a5fa",
            lineWidth: 2,
            priceLineVisible: false,
            priceScaleId: "left",
            priceFormat: {
              type: "custom",
              formatter: (v: number) => `$${Math.round(v).toLocaleString("en-US")}`,
              minMove: 1,
            },
          });
          usdSeries.setData(
            snapshots.map((s) => ({
              time: s.snapshotted_on as Parameters<typeof usdSeries.setData>[0][number]["time"],
              value: s.total_value_usd,
            }))
          );
        } else {
          const isKrw = view === "KRW";
          const series = chart.addSeries(LineSeries, {
            color: isKrw ? "#10b981" : "#60a5fa",
            lineWidth: 2,
            priceLineVisible: false,
            priceScaleId: "right",
            priceFormat: {
              type: "custom",
              formatter: isKrw ? fmtKrw : fmtUsd,
              minMove: 1,
            },
          });
          series.setData(
            snapshots.map((s) => ({
              time: s.snapshotted_on as Parameters<typeof series.setData>[0][number]["time"],
              value: isKrw ? s.total_value_krw : s.total_value_usd,
            }))
          );
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
            onClick={() => setDays(p.days)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
              days === p.days
                ? "bg-emerald-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
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
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-400" />
            KRW (우측)
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-4 rounded-full bg-blue-400" />
            USD (좌측)
          </span>
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-900/80">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
        {empty && !loading && (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-gray-800 bg-gray-900">
            <p className="text-sm text-gray-500">데이터가 쌓이는 중입니다 — 매일 방문하면 추이가 기록됩니다.</p>
          </div>
        )}
        <div ref={containerRef} className={cn("rounded-xl overflow-hidden", empty && "hidden")} />
      </div>
    </div>
  );
}
