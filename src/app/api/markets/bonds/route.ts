import { NextResponse } from "next/server";
import { BondYield } from "@/types/market";

const BOND_CONFIG: Omit<BondYield, "yield" | "change" | "lastUpdated">[] = [
  { symbol: "^IRX",      label: "3개월",  maturityMonths: 3,   country: "US" },
  { symbol: "^US1YT=RR", label: "1년",    maturityMonths: 12,  country: "US" },
  { symbol: "^US2YT=RR", label: "2년",    maturityMonths: 24,  country: "US" },
  { symbol: "^FVX",      label: "5년",    maturityMonths: 60,  country: "US" },
  { symbol: "^TNX",      label: "10년",   maturityMonths: 120, country: "US" },
  { symbol: "^US20YT=RR",label: "20년",   maturityMonths: 240, country: "US" },
  { symbol: "^TYX",      label: "30년",   maturityMonths: 360, country: "US" },
  { symbol: "KR10YT=RR", label: "10년",   maturityMonths: 120, country: "KR" },
];

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; lastUpdated: string } | null> {
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
    const lastUpdated = meta.regularMarketTime
      ? new Date((meta.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

    return { price, change, lastUpdated };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      BOND_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          ...cfg,
          yield: quote.price,
          change: quote.change,
          lastUpdated: quote.lastUpdated,
        } satisfies BondYield;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<BondYield>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [...items, ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol))];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Bonds fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: BondYield[] = [
  { symbol: "^IRX",       label: "3개월", maturityMonths: 3,   yield: 5.35, change: 0.01,  country: "US" },
  { symbol: "^US1YT=RR",  label: "1년",   maturityMonths: 12,  yield: 5.15, change: -0.02, country: "US" },
  { symbol: "^US2YT=RR",  label: "2년",   maturityMonths: 24,  yield: 4.85, change: -0.03, country: "US" },
  { symbol: "^FVX",       label: "5년",   maturityMonths: 60,  yield: 4.55, change: -0.02, country: "US" },
  { symbol: "^TNX",       label: "10년",  maturityMonths: 120, yield: 4.45, change: -0.01, country: "US" },
  { symbol: "^US20YT=RR", label: "20년",  maturityMonths: 240, yield: 4.65, change: 0.01,  country: "US" },
  { symbol: "^TYX",       label: "30년",  maturityMonths: 360, yield: 4.60, change: 0.00,  country: "US" },
  { symbol: "KR10YT=RR",  label: "10년",  maturityMonths: 120, yield: 3.45, change: -0.02, country: "KR" },
];
