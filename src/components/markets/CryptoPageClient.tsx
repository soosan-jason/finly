"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { CryptoAsset } from "@/types/market";
import { formatPrice, formatMarketCap, formatPercent } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

export function CryptoPageClient() {
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("");
  const PER_PAGE = 20;

  async function fetchCryptos(p = page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/crypto?limit=${p * PER_PAGE}`);
      const data = await res.json();
      setCryptos(data);
      const apiTime = Array.isArray(data) && data[0]?.last_updated;
      setLastUpdated(apiTime ? new Date(apiTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : new Date().toLocaleTimeString("ko-KR"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCryptos(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="text-xs text-gray-500">
          {cryptos.length}개 코인
        </span>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="hidden sm:inline text-xs text-gray-600">{lastUpdated}</span>}
          <button onClick={() => fetchCryptos()} className="rounded-lg p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div>
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-8" />
            <col />
            <col className="w-28" />
            <col className="w-16" />
            <col className="w-16 hidden sm:table-column" />
            <col className="w-28 hidden md:table-column" />
            <col className="w-28 hidden lg:table-column" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2 text-right">가격</th>
              <th className="px-3 py-2 text-right">24h %</th>
              <th className="px-3 py-2 text-right hidden sm:table-cell">7d %</th>
              <th className="px-3 py-2 text-right hidden md:table-cell">시가총액</th>
              <th className="px-3 py-2 text-right hidden lg:table-cell">거래량 (24h)</th>
            </tr>
          </thead>
          <tbody>
            {loading && cryptos.length === 0
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td colSpan={7} className="px-3 py-2">
                      <div className="h-7 animate-pulse rounded bg-gray-800" />
                    </td>
                  </tr>
                ))
              : cryptos.map((coin) => {
                  const isUp24 = coin.price_change_percentage_24h >= 0;
                  return (
                    <tr key={coin.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                      <td className="px-3 py-2 text-xs text-gray-500">{coin.market_cap_rank}</td>
                      <td className="px-3 py-2">
                        <Link href={`/crypto/${coin.id}`} className="flex items-center gap-2 hover:opacity-80 min-w-0">
                          <Image src={coin.image} alt={coin.name} width={24} height={24} className="rounded-full shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{coin.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
                            {coin.last_updated && (
                              <p className="text-xs text-gray-600">
                                {new Date(coin.last_updated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-white">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={isUp24 ? "up" : "down"}>
                          {formatPercent(coin.price_change_percentage_24h)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right hidden sm:table-cell">
                        <span className="text-gray-400 text-xs">-</span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-300 hidden md:table-cell">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-300 hidden lg:table-cell">
                        {formatMarketCap(coin.total_volume)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {cryptos.length === page * PER_PAGE && (
        <div className="flex justify-center border-t border-gray-800 p-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-gray-800 px-6 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
