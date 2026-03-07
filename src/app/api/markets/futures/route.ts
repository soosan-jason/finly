import { NextResponse } from "next/server";
import { FuturesItem } from "@/types/market";

const FUTURES_CONFIG: { symbol: string; name: string }[] = [
  { symbol: "ES=F",  name: "S&P 500 선물" },
  { symbol: "NQ=F",  name: "NASDAQ 선물" },
  { symbol: "YM=F",  name: "DOW 선물" },
  { symbol: "RTY=F", name: "Russell 2000 선물" },
  { symbol: "^VIX",  name: "VIX 공포지수" },
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
      FUTURES_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          symbol: cfg.symbol,
          name: cfg.name,
          price: quote.price,
          change: quote.change,
          changePct: quote.changePct,
          lastUpdated: quote.lastUpdated,
        } satisfies FuturesItem;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<FuturesItem>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [...items, ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol))];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Futures fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: FuturesItem[] = [
  { symbol: "ES=F",  name: "S&P 500 선물",       price: 5320.25, change: 15.50, changePct: 0.29 },
  { symbol: "NQ=F",  name: "NASDAQ 선물",         price: 18750.00, change: -25.00, changePct: -0.13 },
  { symbol: "YM=F",  name: "DOW 선물",            price: 39250.00, change: 80.00, changePct: 0.20 },
  { symbol: "RTY=F", name: "Russell 2000 선물",   price: 2080.50, change: 5.50, changePct: 0.26 },
  { symbol: "^VIX",  name: "VIX 공포지수",        price: 14.25, change: -0.35, changePct: -2.40 },
];
