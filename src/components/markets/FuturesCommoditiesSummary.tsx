"use client";

import { useEffect, useState } from "react";
import { FuturesItem, CommodityItem } from "@/types/market";
import { formatPercent } from "@/lib/utils/format";
import Link from "next/link";

type Row = { key: string; name: string; price: number; changePct: number; unit: string };

function toRow(item: FuturesItem): Row {
  return { key: item.symbol, name: item.name, price: item.price, changePct: item.changePct, unit: "" };
}

function toRowC(item: CommodityItem): Row {
  return { key: item.symbol, name: item.name, price: item.price, changePct: item.changePct, unit: item.unit };
}

function fmtPrice(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: price < 100 ? 2 : 0,
    maximumFractionDigits: price < 100 ? 2 : 0,
  });
}

export function FuturesCommoditiesSummary() {
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

  const groups: { label: string; rows: Row[] }[] = [
    { label: "선물", rows: futureRows },
    { label: "원자재", rows: commodityRows },
  ];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">선물 · 원자재</h2>
        <Link href="/markets?tab=futures" className="text-sm text-emerald-400 hover:underline">
          전체보기 →
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
          {groups.map(({ label, rows }) =>
            rows.length === 0 ? null : (
              <div key={label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
                  {rows.map((row) => {
                    const up = row.changePct >= 0;
                    return (
                      <div key={row.key} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-200">{row.name}</span>
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
