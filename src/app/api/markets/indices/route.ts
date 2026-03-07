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
  { symbol: "^RUT",      name: "RUSSELL 2000", region: "US", currency: "USD" },
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
  { symbol: "^KS11",     name: "KOSPI",      price: 5450,     change: -113.10, changePercent: -2.03, currency: "KRW", region: "KR" },
  { symbol: "^KQ11",     name: "KOSDAQ",     price: 1094,     change: -22.10,  changePercent: -1.98, currency: "KRW", region: "KR" },
  { symbol: "^GSPC",     name: "S&P 500",    price: 6840.32,  change: -29.18,  changePercent: -0.43, currency: "USD", region: "US" },
  { symbol: "^IXIC",     name: "NASDAQ",     price: 22515.20, change: -292.28, changePercent: -1.28, currency: "USD", region: "US" },
  { symbol: "^DJI",      name: "DOW JONES",  price: 48563.23, change: -176.18, changePercent: -0.36, currency: "USD", region: "US" },
  { symbol: "^RUT",      name: "RUSSELL 2000", price: 2544.35, change: -4.03,  changePercent: -0.16, currency: "USD", region: "US" },
  { symbol: "^N225",     name: "NIKKEI 225", price: 55620.84, change: 342.78,  changePercent: 0.62,  currency: "JPY", region: "JP" },
  { symbol: "^HSI",      name: "항셍",       price: 26796.76, change: 449.52,  changePercent: 1.71,  currency: "HKD", region: "CN" },
  { symbol: "000001.SS", name: "상해종합",   price: 4124.27,  change: 16.40,   changePercent: 0.40,  currency: "CNY", region: "CN" },
  { symbol: "399001.SZ", name: "심천성분",   price: 14173.44, change: 83.10,   changePercent: 0.59,  currency: "CNY", region: "CN" },
];
