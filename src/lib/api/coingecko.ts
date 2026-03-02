import { CryptoAsset } from "@/types/market";

const BASE_URL = "https://api.coingecko.com/api/v3";

export async function getTopCryptos(limit = 10): Promise<CryptoAsset[]> {
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("CoinGecko API error");
  return res.json();
}

export async function getCryptoDetail(id: string) {
  const res = await fetch(
    `${BASE_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error("CoinGecko API error");
  return res.json();
}

export async function getCryptoChart(id: string, days: number) {
  const res = await fetch(
    `${BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("CoinGecko chart API error");
  return res.json();
}

export async function getGlobalStats() {
  const res = await fetch(`${BASE_URL}/global`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("CoinGecko global API error");
  return res.json();
}
