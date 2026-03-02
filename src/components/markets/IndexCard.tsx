import { StockIndex } from "@/types/market";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils/format";

const REGION_FLAG: Record<StockIndex["region"], string> = {
  US: "🇺🇸",
  KR: "🇰🇷",
  JP: "🇯🇵",
  CN: "🇨🇳",
  EU: "🇪🇺",
};

interface IndexCardProps {
  index: StockIndex;
}

export function IndexCard({ index }: IndexCardProps) {
  const isUp = index.changePercent >= 0;

  return (
    <Card className="hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">
            {REGION_FLAG[index.region]} {index.region}
          </p>
          <p className="mt-0.5 font-semibold text-white">{index.name}</p>
        </div>
        <Badge variant={isUp ? "up" : "down"}>
          {formatPercent(index.changePercent)}
        </Badge>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">
          {index.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className={`mt-0.5 text-sm ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "▲" : "▼"}{" "}
          {Math.abs(index.change).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
    </Card>
  );
}
