"use client";

import { useEffect, useState } from "react";
import { FxRate } from "@/app/api/fx/route";
import { formatTimeWithSec, formatMonthDay } from "@/lib/utils/format";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";

const FLAG: Record<string, string> = {
  USD: "🇺🇸", KRW: "🇰🇷", JPY: "🇯🇵", EUR: "🇪🇺", CNY: "🇨🇳",
};

function formatRate(rate: number, to: string) {
  const isWhole = to === "KRW" || to === "JPY";
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: isWhole ? 0 : 4,
    maximumFractionDigits: isWhole ? 2 : 4,
  });
}


export function FxWidget() {
  const { showDate, locale, timezone } = useDateFormat();
  const t = useT();
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
      <h2 className="mb-3 text-lg font-semibold text-white">{t("fx.title")}</h2>
      <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-gray-800" />
                  <div className="h-3 w-14 animate-pulse rounded bg-gray-800" />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-gray-800" />
                  <div className="h-3 w-16 animate-pulse rounded bg-gray-800" />
                </div>
              </div>
            ))
          : rates.map((r) => {
              const up = r.change !== null && r.change > 0;
              const down = r.change !== null && r.change < 0;
              const changeColor = up ? "text-red-400" : down ? "text-blue-400" : "text-gray-400";
              const sign = up ? "+" : "";

              return (
                <div key={r.pair} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{FLAG[r.from] ?? "🌍"}</span>
                      <span className="text-sm font-medium text-white">{r.pair}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{showDate ? formatMonthDay(r.lastUpdated, locale, timezone) : formatTimeWithSec(r.lastUpdated, locale, timezone)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white tabular-nums">
                      {formatRate(r.rate, r.to)}
                    </p>
                    {r.change !== null && r.changePct !== null ? (
                      <p className={`text-xs tabular-nums ${changeColor}`}>
                        {sign}{formatRate(r.change, r.to)} ({sign}{r.changePct.toFixed(2)}%)
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">{t("fx.noChange")}</p>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
