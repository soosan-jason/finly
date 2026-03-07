"use client";

import { useEffect, useState } from "react";
import { FuturesItem } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils/format";

function fmtTime(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function FuturesSection() {
  const [items, setItems] = useState<FuturesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/markets/futures");
        setItems(await res.json());
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => {
        const isVix = item.symbol === "^VIX";
        const up = item.change >= 0;
        // VIX는 오를수록 공포 → 색상 반전
        const positive = isVix ? !up : up;

        return (
          <Card key={item.symbol} className="flex flex-col justify-between">
            <div>
              <p className="text-xs text-gray-500">{item.symbol}</p>
              <p className="mt-0.5 text-sm font-medium text-gray-200 leading-tight">{item.name}</p>
            </div>
            <div className="mt-3">
              <p className="text-xl font-bold text-white">
                {item.price.toLocaleString("en-US", {
                  minimumFractionDigits: item.price < 100 ? 2 : 0,
                  maximumFractionDigits: item.price < 100 ? 2 : 0,
                })}
              </p>
              <p className={`mt-0.5 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(item.changePct)}
              </p>
              {fmtTime(item.lastUpdated) && (
                <p className="mt-1 text-xs text-gray-600">{fmtTime(item.lastUpdated)}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
