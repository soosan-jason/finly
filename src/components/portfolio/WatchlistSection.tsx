"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Star } from "lucide-react";
import { WatchlistItem, AssetType } from "@/types/portfolio";
import { formatPercent } from "@/lib/utils/format";

interface Props {
  items: WatchlistItem[];
  onRemove: (symbol: string) => void;
}

const ASSET_LABELS: Record<AssetType, string> = {
  crypto:    "코인",
  stock:     "주식",
  etf:       "ETF",
  commodity: "원자재",
  futures:   "선물",
};

function itemHref(item: WatchlistItem): string | null {
  if (item.asset_type === "crypto") return `/crypto/${item.symbol}`;
  if (item.asset_type === "stock" || item.asset_type === "etf") return `/stock/${item.symbol}`;
  return null;
}

function fmtPrice(price: number, currency = "USD"): string {
  if (currency === "KRW") {
    return price.toLocaleString("ko-KR") + "원";
  }
  if (currency === "JPY") {
    return "¥" + price.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  }
  // USD
  if (price >= 1000) return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1)    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function fmtChange(change: number, currency = "USD"): string {
  const abs = Math.abs(change);
  const sign = change >= 0 ? "+" : "-";
  if (currency === "KRW") return sign + abs.toLocaleString("ko-KR") + "원";
  if (currency === "JPY") return sign + "¥" + abs.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  const dp = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  return sign + "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: dp });
}

export function WatchlistSection({ items, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 py-16">
        <Star className="h-10 w-10 text-gray-600" />
        <p className="mt-3 text-gray-400">관심 목록이 비어있습니다</p>
        <p className="mt-1 text-xs text-gray-600">각 종목 상세 페이지의 ★ 버튼으로 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* 헤더 */}
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-2.5 border-b border-gray-800 text-xs font-medium text-gray-500">
        <span>종목</span>
        <span className="text-right hidden sm:block">현재가</span>
        <span className="text-right hidden sm:block">등락값</span>
        <span className="text-right">등락율</span>
      </div>

      {/* 목록 */}
      <ul className="divide-y divide-gray-800">
        {items.map((item) => {
          const href = itemHref(item);
          const up = (item.change_pct ?? 0) >= 0;
          const hasPriceData = item.current_price != null;

          const nameBlock = (
            <div className="flex items-center gap-3 min-w-0">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} width={32} height={32} className="rounded-full shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                  {item.symbol.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-500 uppercase truncate">{item.symbol.replace(".KS","").replace(".KQ","").replace(".T","")}</span>
                  <span className="rounded px-1 py-0.5 text-[10px] font-medium bg-gray-800 text-gray-500 shrink-0">
                    {ASSET_LABELS[item.asset_type]}
                  </span>
                </div>
              </div>
            </div>
          );

          return (
            <li key={item.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 hover:bg-gray-800/40 transition-colors">
              {/* 종목명 */}
              {href ? (
                <Link href={href} className="hover:opacity-80 min-w-0">
                  {nameBlock}
                </Link>
              ) : (
                <div className="min-w-0">{nameBlock}</div>
              )}

              {/* 현재가 */}
              <div className="text-right hidden sm:block">
                {hasPriceData ? (
                  <p className="font-semibold text-white tabular-nums text-sm">
                    {fmtPrice(item.current_price!, item.currency)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">-</p>
                )}
              </div>

              {/* 등락값 */}
              <div className="text-right hidden sm:block">
                {hasPriceData && item.change != null ? (
                  <p className={`text-xs font-medium tabular-nums ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {fmtChange(item.change, item.currency)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">-</p>
                )}
              </div>

              {/* 등락율 + 삭제 버튼 */}
              <div className="flex items-center gap-2">
                {hasPriceData && item.change_pct != null ? (
                  <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                    up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {formatPercent(item.change_pct)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">-</span>
                )}
                <button
                  onClick={() => onRemove(item.symbol)}
                  className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
