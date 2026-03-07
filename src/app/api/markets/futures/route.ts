import { NextResponse } from "next/server";
import { FuturesItem } from "@/types/market";

const FUTURES_CONFIG: { symbol: string; name: string }[] = [
  { symbol: "ES=F",  name: "S&P 500 선물" },
  { symbol: "NQ=F",  name: "NASDAQ 선물" },
  { symbol: "YM=F",  name: "DOW 선물" },
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
  { symbol: "ES=F",  name: "S&P 500 선물",  price: 6945.75,  change: 2.08,   changePct: 0.03 },
  { symbol: "NQ=F",  name: "NASDAQ 선물",   price: 25626.25, change: 48.69,  changePct: 0.19 },
  { symbol: "YM=F",  name: "DOW 선물",      price: 49174.00, change: -54.09, changePct: -0.11 },
  { symbol: "^VIX",  name: "VIX 공포지수",  price: 15.06,    change: 0.16,   changePct: 1.07 },
];
