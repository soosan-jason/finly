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
      <div className="flex gap-3 overflow-x-auto pb-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-32 shrink-0 animate-pulse rounded-xl bg-gray-800" />
            ))
          : rates.map((r) => (
              <div
                key={r.pair}
                className="flex shrink-0 items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3"
              >
                <span className="text-xl">{FLAG[r.to] ?? "🌍"}</span>
                <div>
                  <p className="text-xs text-gray-500">USD/{r.to}</p>
                  <p className="font-semibold text-white">
                    {r.rate.toLocaleString(undefined, {
                      minimumFractionDigits: r.to === "KRW" || r.to === "JPY" ? 0 : 4,
                      maximumFractionDigits: r.to === "KRW" || r.to === "JPY" ? 2 : 4,
                    })}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
