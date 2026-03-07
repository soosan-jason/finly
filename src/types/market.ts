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

export interface FuturesItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  lastUpdated?: string;
}

export interface CommodityItem {
  symbol: string;
  name: string;
  category: "귀금속" | "에너지";
  price: number;
  change: number;
  changePct: number;
  unit: string;
  lastUpdated?: string;
}

export interface BondYield {
  symbol: string;
  label: string;
  maturityMonths: number;
  yield: number;
  change: number;
  country: "US" | "KR" | "JP" | "GB" | "FR" | "DE";
  lastUpdated?: string;
}

export interface TopStock {
  symbol: string;
  name: string;
  country: "US" | "KR" | "JP";
  price: number;
  change: number;
  changePct: number;
  currency: string;
  lastUpdated?: string;
}
