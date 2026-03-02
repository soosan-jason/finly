import { StockIndex } from "@/types/market";

// Yahoo Finance 비공식 API (via proxy route to avoid CORS)
const INDICES: { symbol: string; name: string; region: StockIndex["region"] }[] = [
  { symbol: "^KS11",   name: "KOSPI",       region: "KR" },
  { symbol: "^KQ11",   name: "KOSDAQ",      region: "KR" },
  { symbol: "^GSPC",   name: "S&P 500",     region: "US" },
  { symbol: "^IXIC",   name: "NASDAQ",      region: "US" },
  { symbol: "^DJI",    name: "DOW JONES",   region: "US" },
  { symbol: "^N225",   name: "NIKKEI 225",  region: "JP" },
];

export async function getMarketIndices(): Promise<StockIndex[]> {
  const symbols = INDICES.map((i) => i.symbol).join(",");
  const res = await fetch(`/api/markets/indices?symbols=${encodeURIComponent(symbols)}`);
  if (!res.ok) throw new Error("Failed to fetch indices");
  return res.json();
}

export { INDICES };
