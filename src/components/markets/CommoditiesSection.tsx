"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { CommodityItem } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatPercent, formatTime, formatMonthDay } from "@/lib/utils/format";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useT } from "@/lib/i18n/useT";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

const COMMODITY_NAME_KEYS: Record<string, string> = {
  "GC=F": "commodity.gold",     "SI=F": "commodity.silver",
  "HG=F": "commodity.copper",   "PL=F": "commodity.platinum",
  "CL=F": "commodity.wticrude", "BZ=F": "commodity.brentcrude",
  "NG=F": "commodity.natgas",   "HO=F": "commodity.heatingoil",
};
const CATEGORY_NAME_KEYS: Record<string, string> = {
  "귀금속": "commodity.cat.precious",
  "에너지":  "commodity.cat.energy",
};


function StarButton({ symbol, name }: { symbol: string; name: string }) {
  const t = useT();
  const { user } = useUser();
  const router = useRouter();
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/portfolio/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWatched(data.some((w: { symbol: string }) => w.symbol === symbol));
      });
  }, [user, symbol]);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);
    if (watched) {
      await fetch(`/api/portfolio/watchlist?symbol=${symbol}`, { method: "DELETE" });
      setWatched(false);
    } else {
      await fetch("/api/portfolio/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_type: "commodity", symbol, name }),
      });
      setWatched(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={watched ? t("star.remove") : t("star.add")}
      className={`absolute top-2 right-2 rounded-md p-1 transition-colors disabled:opacity-50 ${
        watched ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"
      }`}
    >
      <Star className={`h-3.5 w-3.5 ${watched ? "fill-yellow-400" : ""}`} />
    </button>
  );
}

export function CommoditiesSection() {
  const t = useT();
  const { showDate, locale, timezone } = useDateFormat();
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

  const categories = ["귀금속", "에너지"] as const; // API 필터용 (변경 금지)

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
              {CATEGORY_NAME_KEYS[cat] ? t(CATEGORY_NAME_KEYS[cat] as Parameters<typeof t>[0]) : cat}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.map((item) => {
                const up = item.change >= 0;
                return (
                  <Card key={item.symbol} className="relative flex flex-col justify-between">
                    <StarButton symbol={item.symbol} name={item.name} />
                    <div>
                      <p className="text-xs text-gray-500">{item.unit}</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-200">
                        {COMMODITY_NAME_KEYS[item.symbol] ? t(COMMODITY_NAME_KEYS[item.symbol] as Parameters<typeof t>[0]) : item.name}
                      </p>
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
                      {(item.lastUpdated) && (
                        <p className="mt-1 text-xs text-gray-600">{showDate ? formatMonthDay(item.lastUpdated, locale, timezone) : formatTime(item.lastUpdated, locale, timezone)}</p>
                      )}
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
