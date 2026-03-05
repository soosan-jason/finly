"use client";

import { useEffect, useState } from "react";
import { FxRate } from "@/app/api/fx/route";

const FLAG: Record<string, string> = {
  KRW: "🇰🇷", JPY: "🇯🇵", EUR: "🇪🇺", CNY: "🇨🇳",
};

export function FxWidget() {
  const [rates, setRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fx")
      .then((r) => r.json())
      .then((d) => { setRates(Array.isArray(d) ? d : []); })
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetch("/api/fx").then((r) => r.json()).then((d) => {
        if (Array.isArray(d)) setRates(d);
      });
    }, 300_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">환율</h2>
      <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-800" />
              </div>
            ))
          : rates.map((r) => (
              <div key={r.pair} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{FLAG[r.to] ?? "🌍"}</span>
                  <span className="text-sm text-gray-400">USD/{r.to}</span>
                </div>
                <span className="font-semibold text-white tabular-nums">
                  {r.rate.toLocaleString(undefined, {
                    minimumFractionDigits: r.to === "KRW" || r.to === "JPY" ? 0 : 4,
                    maximumFractionDigits: r.to === "KRW" || r.to === "JPY" ? 2 : 4,
                  })}
                </span>
              </div>
            ))}
      </div>
    </section>
  );
}
