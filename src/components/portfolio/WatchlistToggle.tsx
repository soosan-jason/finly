"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { AssetType } from "@/types/portfolio";

interface Props {
  symbol: string;
  name: string;
  assetType?: AssetType;
  imageUrl?: string;
  /** 부모에서 watchlist를 미리 조회해 전달하면 개별 API 호출 생략 */
  initialWatched?: boolean;
}

export function WatchlistToggle({ symbol, name, assetType = "crypto", imageUrl, initialWatched }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [watched, setWatched] = useState(initialWatched ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // initialWatched가 명시적으로 전달된 경우 API 조회 생략
    if (initialWatched !== undefined) return;
    if (!user) return;
    fetch("/api/portfolio/watchlist")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWatched(data.some((w: { symbol: string }) => w.symbol === symbol));
        }
      });
  }, [user, symbol, initialWatched]);

  // initialWatched prop이 바뀌면 동기화
  useEffect(() => {
    if (initialWatched !== undefined) setWatched(initialWatched);
  }, [initialWatched]);

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
        body: JSON.stringify({ asset_type: assetType, symbol, name, image_url: imageUrl }),
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
