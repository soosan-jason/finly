export type AssetType = "crypto" | "stock" | "etf" | "commodity" | "futures";

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name: string;
  image_url: string | null;
  quantity: number;
  avg_buy_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  // 실시간 계산 필드 (DB에 없음)
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_pct?: number;
}

export interface Transaction {
  id: string;
  holding_id: string;
  user_id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  fee: number;
  note: string | null;
  traded_at: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  asset_type: AssetType;
  symbol: string;
  name: string;
  image_url: string | null;
  added_at: string;
  // 실시간 주입 필드
  current_price?: number;
  change?: number;      // 전일대비 등락값 (절대)
  change_pct?: number;  // 등락율 (%)
  currency?: string;    // USD | KRW | JPY
}

export interface PortfolioSnapshot {
  snapshotted_on: string;
  total_value_krw: number;
  total_cost_krw: number;
  profit_loss_krw: number;
  total_value_usd: number;
  total_cost_usd: number;
  profit_loss_usd: number;
}

export interface HoldingFormData {
  asset_type: AssetType;
  symbol: string;
  name: string;
  image_url?: string;
  quantity: number;
  avg_buy_price: number;
  currency?: string;
}
