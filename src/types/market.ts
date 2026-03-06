export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  market_cap_rank: number;
  sparkline_in_7d?: { price: number[] };
  last_updated?: string;
}

export interface StockIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  region: "US" | "KR" | "JP" | "CN" | "EU";
  lastUpdated?: string;
}

export interface MarketSummary {
  indices: StockIndex[];
  cryptos: CryptoAsset[];
  lastUpdated: string;
}

export type TrendDirection = "up" | "down" | "neutral";
