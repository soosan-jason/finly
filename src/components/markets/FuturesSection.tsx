"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { FuturesItem } from "@/types/market";
import { Card } from "@/components/ui/card";
import { formatPercent, formatTime } from "@/lib/utils/format";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";


function StarButton({ symbol, name }: { symbol: string; name: string }) {
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
        body: JSON.stringify({ asset_type: "futures", symbol, name }),
      });
      setWatched(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={watched ? "관심 목록에서 제거" : "관심 목록에 추가"}
      className={`absolute top-2 right-2 rounded-md p-1 transition-colors disabled:opacity-50 ${
        watched ? "text-yellow-400" : "text-gray-500 hover:text-yellow-400"
      }`}
    >
      <Star className={`h-3.5 w-3.5 ${watched ? "fill-yellow-400" : ""}`} />
    </button>
  );
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
          <Card key={item.symbol} className="relative flex flex-col justify-between">
            <StarButton symbol={item.symbol} name={item.name} />
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
              {formatTime(item.lastUpdated) && (
                <p className="mt-1 text-xs text-gray-600">{formatTime(item.lastUpdated)}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
