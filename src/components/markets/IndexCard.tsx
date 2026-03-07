import { StockIndex } from "@/types/market";
import { formatPercent } from "@/lib/utils/format";

const REGION_FLAG: Record<StockIndex["region"], string> = {
  US: "🇺🇸",
  KR: "🇰🇷",
  JP: "🇯🇵",
  CN: "🇨🇳",
  EU: "🇪🇺",
};

const REGION_LABEL: Record<StockIndex["region"], string> = {
  US: "미국",
  KR: "한국",
  JP: "일본",
  CN: "중국",
  EU: "유럽",
};

interface IndexCardProps {
  index: StockIndex;
}

export function IndexCard({ index }: IndexCardProps) {
  const isUp = index.changePercent >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gray-900 p-4 transition-all hover:bg-gray-800/80 ${
        isUp ? "border-emerald-500/20" : "border-red-500/20"
      }`}
    >
      {/* 상단 accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-0.5 ${
          isUp ? "bg-emerald-500" : "bg-red-500"
        }`}
      />

      {/* 헤더: 지역 + 등락률 뱃지 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {REGION_FLAG[index.region]}&nbsp;{REGION_LABEL[index.region]}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
            isUp
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {formatPercent(index.changePercent)}
        </span>
      </div>

      {/* 지수명 */}
      <p className="mt-2 text-sm font-semibold text-gray-200">{index.name}</p>

      {/* 가격 */}
      <p className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums">
        {index.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>

      {/* 등락 절대값 + 업데이트 시각 */}
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className={`text-xs font-medium tabular-nums ${
            isUp ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isUp ? "▲" : "▼"}&nbsp;
          {Math.abs(index.change).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
        {index.lastUpdated && (
          <>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-600">
              {new Date(index.lastUpdated).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </>
        )}
      </div>

      {/* 배경 glow */}
      <div
        className={`pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-2xl ${
          isUp ? "bg-emerald-500/5" : "bg-red-500/5"
        }`}
      />
    </div>
  );
}
