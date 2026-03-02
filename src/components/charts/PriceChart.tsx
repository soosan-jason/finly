"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  type IChartApi,
} from "lightweight-charts";
import { cn } from "@/lib/utils/cn";

const PERIODS = [
  { label: "1일", days: 1 },
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "1년", days: 365 },
];

interface PriceChartProps {
  coinId: string;
  className?: string;
}

export function PriceChart({ coinId, className }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

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
      rightPriceScale: { borderColor: "#374151" },
      timeScale: { borderColor: "#374151", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 300,
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
      try {
        const res = await fetch(`/api/crypto/${coinId}/chart?days=${days}`);
        const data: { time: number; value: number }[] = await res.json();

        const series = chart.addSeries(LineSeries, {
          color: "#10b981",
          lineWidth: 2,
          priceLineVisible: false,
        });
        series.setData(data as Parameters<typeof series.setData>[0]);
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
  }, [coinId, days]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Period selector */}
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

      {/* Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-900/80">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
        <div ref={containerRef} className="rounded-xl overflow-hidden" />
      </div>
    </div>
  );
}
