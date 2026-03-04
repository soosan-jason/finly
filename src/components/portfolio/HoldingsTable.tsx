import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Holding } from "@/types/portfolio";
import { formatPrice, formatKRW, formatPercent } from "@/lib/utils/format";

interface Props {
  holdings: Holding[];
  displayCurrency: "USD" | "KRW";
  usdToKrw: number;
  onDelete: (id: string) => void;
}

export function HoldingsTable({ holdings, displayCurrency, usdToKrw, onDelete }: Props) {
  function fmt(value: number) {
    return displayCurrency === "KRW" ? formatKRW(value * usdToKrw) : formatPrice(value);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left text-xs text-gray-500">
            <th className="px-4 py-3">종목</th>
            <th className="px-4 py-3 text-right">보유 수량</th>
            <th className="px-4 py-3 text-right">평균 단가</th>
            <th className="px-4 py-3 text-right hidden sm:table-cell">현재가</th>
            <th className="px-4 py-3 text-right hidden md:table-cell">평가금액</th>
            <th className="px-4 py-3 text-right">손익</th>
            <th className="px-4 py-3 text-right">수익률</th>
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

            return (
              <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  {isCrypto ? (
                    <Link href={`/crypto/${h.symbol}`} className="hover:opacity-80">
                      {nameContent}
                    </Link>
                  ) : (
                    nameContent
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {Number(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                </td>
                <td className="px-4 py-3 text-right text-gray-300">
                  {fmt(h.avg_buy_price)}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  {h.current_price ? fmt(h.current_price) : <span className="text-gray-600">-</span>}
                </td>
                <td className="px-4 py-3 text-right text-white hidden md:table-cell">
                  {h.current_value ? fmt(h.current_value) : "-"}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {h.profit_loss != null
                    ? `${isProfit ? "+" : ""}${fmt(h.profit_loss)}`
                    : "-"}
                </td>
                <td className={`px-4 py-3 text-right font-medium ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                  {h.profit_loss_pct != null ? formatPercent(h.profit_loss_pct) : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onDelete(h.id)}
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
  );
}
