"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Holding } from "@/types/portfolio";
import { formatPrice, formatKRW, formatPercent } from "@/lib/utils/format";
import { useT } from "@/lib/i18n/useT";

interface Props {
  holdings: Holding[];
  onDelete: (id: string) => void;
}

export function HoldingsTable({ holdings, onDelete }: Props) {
  const t = useT();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const [thumbStyle, setThumbStyle] = useState({ left: 0, width: 100 });
  const [canScroll, setCanScroll] = useState(false);

  function updateThumb() {
    const el = scrollRef.current;
    if (!el) return;
    const scrollable = el.scrollWidth - el.clientWidth;
    if (scrollable <= 0) { setCanScroll(false); return; }
    setCanScroll(true);
    const ratio     = el.clientWidth / el.scrollWidth;
    const thumbW    = Math.max(ratio * 100, 20); // 최소 20%
    const thumbLeft = (el.scrollLeft / scrollable) * (100 - thumbW);
    setThumbStyle({ left: thumbLeft, width: thumbW });
  }

  useEffect(() => {
    updateThumb();
    window.addEventListener("resize", updateThumb);
    return () => window.removeEventListener("resize", updateThumb);
  }, [holdings]);

  // thumb 드래그 → 스크롤
  const onThumbPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current    = true;
    dragStartX.current    = e.clientX;
    dragStartScroll.current = scrollRef.current?.scrollLeft ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onThumbPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const el    = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const trackW    = track.clientWidth;
    const scrollMax = el.scrollWidth - el.clientWidth;
    const dx        = e.clientX - dragStartX.current;
    const scrollDx  = (dx / trackW) * el.scrollWidth;
    el.scrollLeft   = Math.max(0, Math.min(scrollMax, dragStartScroll.current + scrollDx));
  }, []);

  const onThumbPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // track 클릭 → 해당 위치로 점프
  const onTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el    = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const rect      = track.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    el.scrollLeft   = clickRatio * (el.scrollWidth - el.clientWidth);
  }, []);

  function fmt(value: number, currency: string) {
    return currency === "KRW" ? formatKRW(value) : formatPrice(value);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900">
      {/* 테이블 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ overscrollBehaviorX: "contain", touchAction: "pan-x" }}
        onScroll={updateThumb}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
              <th className="px-4 py-3 whitespace-nowrap">{t("holdings.asset")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">{t("holdings.quantity")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">{t("holdings.avgPrice")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap hidden sm:table-cell">{t("holdings.currPrice")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap hidden md:table-cell">{t("holdings.value")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">{t("holdings.pnl")}</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">{t("holdings.return")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const isProfit = (h.profit_loss ?? 0) >= 0;
              const isCrypto = h.asset_type === "crypto";
              const nameContent = (
                <div className="flex items-center gap-2">
                  {h.image_url ? (
                    <Image src={h.image_url} alt={h.name} width={28} height={28} className="rounded-full" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      {h.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">{h.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{h.symbol}</p>
                  </div>
                </div>
              );

              const href = isCrypto ? `/crypto/${h.symbol}` : `/stock/${h.symbol}`;

              return (
                <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={href} className="hover:opacity-80">{nameContent}</Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">
                    {Number(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">
                    {fmt(h.avg_buy_price, h.currency)}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell whitespace-nowrap">
                    {h.current_price ? fmt(h.current_price, h.currency) : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-white hidden md:table-cell whitespace-nowrap">
                    {h.current_value ? fmt(h.current_value, h.currency) : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                    {h.profit_loss != null ? `${isProfit ? "+" : ""}${fmt(h.profit_loss, h.currency)}` : "-"}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                    {h.profit_loss_pct != null ? formatPercent(h.profit_loss_pct) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                      style={{ touchAction: "manipulation" }}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 커스텀 수평 스크롤바 (모바일 포함 모든 브라우저) */}
      {canScroll && (
        <div
          ref={trackRef}
          onClick={onTrackClick}
          className="mx-3 my-2 h-7 cursor-pointer rounded-full bg-gray-800 relative select-none"
        >
          <div
            className="absolute top-1 bottom-1 rounded-full bg-gray-500 active:bg-gray-400 cursor-grab active:cursor-grabbing"
            style={{ left: `${thumbStyle.left}%`, width: `${thumbStyle.width}%` }}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
            onPointerCancel={onThumbPointerUp}
          />
        </div>
      )}
    </div>
  );
}
