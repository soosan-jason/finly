import { NextResponse } from "next/server";
import { TopStock } from "@/types/market";

const STOCK_CONFIG: Omit<TopStock, "price" | "change" | "changePct" | "lastUpdated">[] = [
  // 미국
  { symbol: "AAPL",     name: "Apple",      country: "US", currency: "USD" },
  { symbol: "MSFT",     name: "Microsoft",  country: "US", currency: "USD" },
  { symbol: "NVDA",     name: "NVIDIA",     country: "US", currency: "USD" },
  { symbol: "AMZN",     name: "Amazon",     country: "US", currency: "USD" },
  { symbol: "META",     name: "Meta",       country: "US", currency: "USD" },
  // 한국
  { symbol: "005930.KS", name: "삼성전자",   country: "KR", currency: "KRW" },
  { symbol: "000660.KS", name: "SK하이닉스", country: "KR", currency: "KRW" },
  { symbol: "035420.KS", name: "NAVER",      country: "KR", currency: "KRW" },
  { symbol: "005380.KS", name: "현대차",     country: "KR", currency: "KRW" },
  { symbol: "051910.KS", name: "LG화학",     country: "KR", currency: "KRW" },
  // 일본
  { symbol: "7203.T",  name: "도요타",         country: "JP", currency: "JPY" },
  { symbol: "9984.T",  name: "소프트뱅크그룹", country: "JP", currency: "JPY" },
  { symbol: "6861.T",  name: "키엔스",         country: "JP", currency: "JPY" },
  { symbol: "7974.T",  name: "닌텐도",         country: "JP", currency: "JPY" },
  { symbol: "8306.T",  name: "미쓰비시UFJ",    country: "JP", currency: "JPY" },
];

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePct: number; lastUpdated: string } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price = meta.regularMarketPrice as number;
    const prevClose = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
    const change = price - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    const lastUpdated = meta.regularMarketTime
      ? new Date((meta.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

    return { price, change, changePct, lastUpdated };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      STOCK_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          ...cfg,
          price: quote.price,
          change: quote.change,
          changePct: quote.changePct,
          lastUpdated: quote.lastUpdated,
        } satisfies TopStock;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<TopStock>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [...items, ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol))];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Top stocks fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: TopStock[] = [
  { symbol: "AAPL",      name: "Apple",         country: "US", price: 189.50,   change: 1.20,   changePct: 0.64,  currency: "USD" },
  { symbol: "MSFT",      name: "Microsoft",     country: "US", price: 415.80,   change: -2.30,  changePct: -0.55, currency: "USD" },
  { symbol: "NVDA",      name: "NVIDIA",        country: "US", price: 875.40,   change: 18.60,  changePct: 2.17,  currency: "USD" },
  { symbol: "AMZN",      name: "Amazon",        country: "US", price: 182.75,   change: 0.85,   changePct: 0.47,  currency: "USD" },
  { symbol: "META",      name: "Meta",          country: "US", price: 505.20,   change: 5.40,   changePct: 1.08,  currency: "USD" },
  { symbol: "005930.KS", name: "삼성전자",      country: "KR", price: 79400,    change: 600,    changePct: 0.76,  currency: "KRW" },
  { symbol: "000660.KS", name: "SK하이닉스",    country: "KR", price: 191500,   change: -2500,  changePct: -1.29, currency: "KRW" },
  { symbol: "035420.KS", name: "NAVER",         country: "KR", price: 182500,   change: 1500,   changePct: 0.83,  currency: "KRW" },
  { symbol: "005380.KS", name: "현대차",        country: "KR", price: 246500,   change: 2000,   changePct: 0.82,  currency: "KRW" },
  { symbol: "051910.KS", name: "LG화학",        country: "KR", price: 352000,   change: -3000,  changePct: -0.85, currency: "KRW" },
  { symbol: "7203.T",    name: "도요타",        country: "JP", price: 3450,     change: 35,     changePct: 1.02,  currency: "JPY" },
  { symbol: "9984.T",    name: "소프트뱅크그룹", country: "JP", price: 8950,     change: -120,   changePct: -1.32, currency: "JPY" },
  { symbol: "6861.T",    name: "키엔스",        country: "JP", price: 58200,    change: 450,    changePct: 0.78,  currency: "JPY" },
  { symbol: "7974.T",    name: "닌텐도",        country: "JP", price: 8150,     change: 80,     changePct: 0.99,  currency: "JPY" },
  { symbol: "8306.T",    name: "미쓰비시UFJ",   country: "JP", price: 1580,     change: -15,    changePct: -0.94, currency: "JPY" },
];
