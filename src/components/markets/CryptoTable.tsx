"use client";

import Image from "next/image";
import { CryptoAsset } from "@/types/market";
import { formatPrice, formatMarketCap, formatPercent } from "@/lib/utils/format";
import { usePreventSwipeNav } from "@/hooks/usePreventSwipeNav";

interface CryptoTableProps {
  cryptos: CryptoAsset[];
}

export function CryptoTable({ cryptos }: CryptoTableProps) {
  const scrollRef = usePreventSwipeNav<HTMLDivElement>();

  return (
    <div ref={scrollRef} className="overflow-x-auto" style={{ touchAction: "pan-x pan-y" }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
            <th className="pb-3 pr-4">#</th>
            <th className="pb-3 pr-4">이름</th>
            <th className="pb-3 pr-4 text-right">가격</th>
            <th className="pb-3 pr-4 text-right">24h %</th>
            <th className="pb-3 pr-4 text-right hidden md:table-cell">시가총액</th>
            <th className="pb-3 text-right hidden lg:table-cell">거래량 (24h)</th>
          </tr>
        </thead>
        <tbody>
          {cryptos.map((coin) => {
            const isUp = coin.price_change_percentage_24h >= 0;
            return (
              <tr
                key={coin.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
              >
                <td className="py-3 pr-4 text-gray-500">{coin.market_cap_rank}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-white">{coin.name}</p>
                      <p className="text-xs text-gray-500 uppercase">{coin.symbol}</p>
                      {coin.last_updated && (
                        <p className="text-xs text-gray-600">
                          {new Date(coin.last_updated).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-medium text-white">
                  {formatPrice(coin.current_price)}
                </td>
                <td className={`py-3 pr-4 text-right font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(coin.price_change_percentage_24h)}
                </td>
                <td className="py-3 pr-4 text-right text-gray-300 hidden md:table-cell">
                  {formatMarketCap(coin.market_cap)}
                </td>
                <td className="py-3 text-right text-gray-300 hidden lg:table-cell">
                  {formatMarketCap(coin.total_volume)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
