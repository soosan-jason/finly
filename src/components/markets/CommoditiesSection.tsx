"use client";

import { useEffect, useState } from "react";
import { CommodityItem } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils/format";

export function CommoditiesSection() {
  const [items, setItems] = useState<CommodityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/markets/commodities");
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

  const categories = ["귀금속", "에너지"] as const;

  if (loading) {
    return (
      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="mb-3 h-4 w-16 animate-pulse rounded bg-gray-700" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const group = items.filter((i) => i.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {cat}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.map((item) => {
                const up = item.change >= 0;
                return (
                  <Card key={item.symbol} className="flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{item.unit}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-200">{item.name}</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-xl font-bold text-white">
                        {item.price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: item.price < 10 ? 3 : 2,
                        })}
                      </p>
                      <p className={`mt-0.5 text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {formatPercent(item.changePct)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
