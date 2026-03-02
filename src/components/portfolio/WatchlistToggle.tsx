"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

interface Props {
  symbol: string;
  name: string;
  imageUrl?: string;
}

export function WatchlistToggle({ symbol, name, imageUrl }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/portfolio/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWatched(data.some((w: { symbol: string }) => w.symbol === symbol));
        }
      });
  }, [user, symbol]);

  async function toggle() {
    if (!user) { router.push("/auth/login"); return; }
    setLoading(true);
    if (watched) {
      await fetch(`/api/portfolio/watchlist?symbol=${symbol}`, { method: "DELETE" });
      setWatched(false);
    } else {
      await fetch("/api/portfolio/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_type: "crypto", symbol, name, image_url: imageUrl }),
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
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
        watched
          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400"
      }`}
    >
      <Star className={`h-4 w-4 ${watched ? "fill-yellow-400" : ""}`} />
      {watched ? "관심 중" : "관심 추가"}
    </button>
  );
}
