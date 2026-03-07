import { NextResponse } from "next/server";
import { StockIndex } from "@/types/market";

const INDEX_CONFIG: {
  symbol: string;
  name: string;
  region: StockIndex["region"];
  currency: string;
}[] = [
  { symbol: "^KS11",     name: "KOSPI",      region: "KR", currency: "KRW" },
  { symbol: "^KQ11",     name: "KOSDAQ",     region: "KR", currency: "KRW" },
  { symbol: "^GSPC",     name: "S&P 500",    region: "US", currency: "USD" },
  { symbol: "^IXIC",     name: "NASDAQ",     region: "US", currency: "USD" },
  { symbol: "^DJI",      name: "DOW JONES",  region: "US", currency: "USD" },
  { symbol: "^N225",     name: "NIKKEI 225", region: "JP", currency: "JPY" },
  { symbol: "^HSI",      name: "항셍",       region: "CN", currency: "HKD" },
  { symbol: "000001.SS", name: "상해종합",   region: "CN", currency: "CNY" },
  { symbol: "399001.SZ", name: "심천성분",   region: "CN", currency: "CNY" },
];

// Yahoo Finance 비공식 API — ^GSPC, ^KS11 등 ^ 심볼을 그대로 지원
async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePercent: number; lastUpdated: string } | null> {
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
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    const lastUpdated = meta.regularMarketTime
      ? new Date((meta.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

    return { price, change, changePercent, lastUpdated };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      INDEX_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          symbol: cfg.symbol,
          name: cfg.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          currency: cfg.currency,
          region: cfg.region,
          lastUpdated: quote.lastUpdated,
        } satisfies StockIndex;
      })
    );

    const indices = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<StockIndex>).value);

    if (indices.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(indices.map((i) => i.symbol));
    const merged = [
      ...indices,
      ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol)),
    ];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Indices fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: StockIndex[] = [
  { symbol: "^KS11",     name: "KOSPI",      price: 2523.55,  change: 12.34,   changePercent: 0.49,  currency: "KRW", region: "KR" },
  { symbol: "^KQ11",     name: "KOSDAQ",     price: 742.18,   change: -3.21,   changePercent: -0.43, currency: "KRW", region: "KR" },
  { symbol: "^GSPC",     name: "S&P 500",    price: 5304.72,  change: 28.01,   changePercent: 0.53,  currency: "USD", region: "US" },
  { symbol: "^IXIC",     name: "NASDAQ",     price: 16742.39, change: -42.77,  changePercent: -0.25, currency: "USD", region: "US" },
  { symbol: "^DJI",      name: "DOW JONES",  price: 39107.54, change: 134.21,  changePercent: 0.34,  currency: "USD", region: "US" },
  { symbol: "^N225",     name: "NIKKEI 225", price: 38236.07, change: -201.37, changePercent: -0.52, currency: "JPY", region: "JP" },
  { symbol: "^HSI",      name: "항셍",       price: 23000.00, change: 120.50,  changePercent: 0.53,  currency: "HKD", region: "CN" },
  { symbol: "000001.SS", name: "상해종합",   price: 3300.00,  change: -8.40,   changePercent: -0.25, currency: "CNY", region: "CN" },
  { symbol: "399001.SZ", name: "심천성분",   price: 10500.00, change: 45.20,   changePercent: 0.43,  currency: "CNY", region: "CN" },
];
