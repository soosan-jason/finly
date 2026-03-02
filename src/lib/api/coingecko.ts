const BASE_URL = "https://api.coingecko.com/api/v3";

export function cgHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  return {
    Accept: "application/json",
    ...(key && key !== "your_coingecko_demo_api_key"
      ? { "x-cg-demo-api-key": key }
      : {}),
  };
}

export async function cgFetch(path: string, revalidate = 60) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: cgHeaders(),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}: ${path}`);
  return res.json();
}

export async function getTopCryptos(limit = 10) {
  return cgFetch(
    `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
  );
}

export async function getCryptoDetail(id: string) {
  return cgFetch(
    `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
  );
}

export async function getCryptoChart(id: string, days: number) {
  return cgFetch(`/coins/${id}/market_chart?vs_currency=usd&days=${days}`, 300);
}

export async function searchCoins(query: string) {
  return cgFetch(`/search?query=${encodeURIComponent(query)}`, 30);
}
