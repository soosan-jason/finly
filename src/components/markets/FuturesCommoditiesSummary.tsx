"use client";

import { useEffect, useState } from "react";
import { FuturesItem, CommodityItem } from "@/types/market";
import { formatPercent, formatTime, formatMonthDay } from "@/lib/utils/format";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";
import Link from "next/link";

const FUTURES_NAME_KEYS: Record<string, string> = {
  "ES=F": "instrument.sp500futures", "NQ=F": "instrument.nasdaqfutures",
  "YM=F": "instrument.dowfutures",   "^VIX": "instrument.vix",
};
const COMMODITY_NAME_KEYS: Record<string, string> = {
  "GC=F": "commodity.gold",     "SI=F": "commodity.silver",
  "HG=F": "commodity.copper",   "PL=F": "commodity.platinum",
  "CL=F": "commodity.wticrude", "BZ=F": "commodity.brentcrude",
  "NG=F": "commodity.natgas",   "HO=F": "commodity.heatingoil",
};

type Row = { key: string; name: string; price: number; changePct: number; unit: string; lastUpdated?: string };

function toRow(item: FuturesItem): Row {
  return { key: item.symbol, name: item.name, price: item.price, changePct: item.changePct, unit: "", lastUpdated: item.lastUpdated };
}

function toRowC(item: CommodityItem): Row {
  return { key: item.symbol, name: item.name, price: item.price, changePct: item.changePct, unit: item.unit, lastUpdated: item.lastUpdated };
}

const ALL_NAME_KEYS: Record<string, string> = { ...FUTURES_NAME_KEYS, ...COMMODITY_NAME_KEYS };

function latestIso(rows: Row[]): string | null {
  const dates = rows.map((r) => r.lastUpdated).filter(Boolean) as string[];
  if (!dates.length) return null;
  return dates.sort().at(-1) ?? null;
}

function fmtPrice(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: price < 100 ? 2 : 0,
    maximumFractionDigits: price < 100 ? 2 : 0,
  });
}

export function FuturesCommoditiesSummary() {
  const t = useT();
  const { showDate, locale, timezone } = useDateFormat();
  const [futures, setFutures] = useState<FuturesItem[]>([]);
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [fr, cr] = await Promise.all([
          fetch("/api/markets/futures"),
          fetch("/api/markets/commodities"),
        ]);
        if (fr.ok) setFutures(await fr.json());
        if (cr.ok) setCommodities(await cr.json());
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, []);

  const futureRows = futures.map(toRow);
  const commodityRows = commodities.map(toRowC);

  const groups: { labelKey: string; rows: Row[] }[] = [
    { labelKey: "markets.tab.futures",     rows: futureRows },
    { labelKey: "markets.tab.commodities", rows: commodityRows },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{t("markets.tab.futures")} · {t("markets.tab.commodities")}</h2>
        <Link href="/markets?tab=futures" className="text-sm text-emerald-400 hover:underline">
          {t("crypto.viewAll")}
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="h-3.5 w-28 animate-pulse rounded bg-gray-800" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-gray-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ labelKey, rows }) =>
            rows.length === 0 ? null : (
              <div key={labelKey}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t(labelKey as Parameters<typeof t>[0])}</p>
                  {latestIso(rows) && (
                    <p className="text-xs text-gray-600">
                      {showDate
                        ? formatMonthDay(latestIso(rows)!, locale, timezone)
                        : formatTime(latestIso(rows)!, locale, timezone)}{" "}{t("markets.asOf")}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
                  {rows.map((row) => {
                    const up = row.changePct >= 0;
                    const displayName = ALL_NAME_KEYS[row.key] ? t(ALL_NAME_KEYS[row.key] as Parameters<typeof t>[0]) : row.name;
                    return (
                      <div key={row.key} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-200">{displayName}</span>
                          {row.unit && (
                            <span className="text-xs text-gray-600">{row.unit}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 tabular-nums">
                          <span className="text-sm font-semibold text-white">{fmtPrice(row.price)}</span>
                          <span className={`text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {formatPercent(row.changePct)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
