"use client";

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

  function fmt(value: number, currency: string) {
    return currency === "KRW" ? formatKRW(value) : formatPrice(value);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
      {holdings.map((h) => {
        const isProfit = (h.profit_loss ?? 0) >= 0;
        const isCrypto = h.asset_type === "crypto";
        const href = isCrypto ? `/crypto/${h.symbol}` : `/stock/${h.symbol}`;
        const pnlColor = isProfit ? "text-emerald-400" : "text-red-400";

        return (
          <div key={h.id} className="flex items-center gap-3 px-4 py-3">
            {/* 아이콘 */}
            <Link href={href} className="shrink-0">
              {h.image_url ? (
                <Image src={h.image_url} alt={h.name} width={36} height={36} className="rounded-full" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  {h.symbol.charAt(0)}
                </div>
              )}
            </Link>

            {/* 중앙: 종목명 + 보유 정보 */}
            <Link href={href} className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{h.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {Number(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                <span className="mx-1">·</span>
                {t("holdings.avgPrice")} {fmt(h.avg_buy_price, h.currency)}
              </p>
            </Link>

            {/* 우측: 수익률 + 손익 */}
            <div className="text-right shrink-0">
              <p className={`font-semibold text-sm ${pnlColor}`}>
                {h.profit_loss_pct != null ? formatPercent(h.profit_loss_pct) : "-"}
              </p>
              <p className={`text-xs mt-0.5 ${pnlColor}`}>
                {h.profit_loss != null
                  ? `${isProfit ? "+" : ""}${fmt(h.profit_loss, h.currency)}`
                  : "-"}
              </p>
            </div>

            {/* 삭제 버튼 */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
              style={{ touchAction: "manipulation" }}
              className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
