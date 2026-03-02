const BASE = "https://finnhub.io/api/v1";

function getKey() {
  return process.env.FINNHUB_API_KEY ?? "";
}

export async function getQuote(symbol: string) {
  const res = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${getKey()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Finnhub quote error: ${res.status}`);
  return res.json();
}

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function getMarketNews(
  category: "general" | "forex" | "crypto" | "merger" = "general",
  minId = 0
): Promise<FinnhubNewsItem[]> {
  const url = `${BASE}/news?category=${category}&minId=${minId}&token=${getKey()}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Finnhub news error: ${res.status}`);
  return res.json();
}

export async function getCompanyNews(symbol: string, from: string, to: string): Promise<FinnhubNewsItem[]> {
  const url = `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${getKey()}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Finnhub company news error: ${res.status}`);
  return res.json();
}
