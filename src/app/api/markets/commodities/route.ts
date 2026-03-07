import { NextResponse } from "next/server";
import { CommodityItem } from "@/types/market";

const COMMODITY_CONFIG: Omit<CommodityItem, "price" | "change" | "changePct" | "lastUpdated">[] = [
  { symbol: "GC=F",  name: "금",           category: "귀금속", unit: "USD/oz" },
  { symbol: "SI=F",  name: "은",           category: "귀금속", unit: "USD/oz" },
  { symbol: "HG=F",  name: "구리",         category: "귀금속", unit: "USD/lb" },
  { symbol: "PL=F",  name: "백금",         category: "귀금속", unit: "USD/oz" },
  { symbol: "CL=F",  name: "WTI 원유",     category: "에너지", unit: "USD/bbl" },
  { symbol: "BZ=F",  name: "브렌트 원유",  category: "에너지", unit: "USD/bbl" },
  { symbol: "NG=F",  name: "천연가스",     category: "에너지", unit: "USD/MMBtu" },
  { symbol: "HO=F",  name: "난방유",      category: "에너지", unit: "USD/gal" },
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
      COMMODITY_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          ...cfg,
          price: quote.price,
          change: quote.change,
          changePct: quote.changePct,
          lastUpdated: quote.lastUpdated,
        } satisfies CommodityItem;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<CommodityItem>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [...items, ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol))];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Commodities fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: CommodityItem[] = [
  { symbol: "GC=F",  name: "금",           category: "귀금속", price: 2345.60, change: 12.30,  changePct: 0.53,  unit: "USD/oz" },
  { symbol: "SI=F",  name: "은",           category: "귀금속", price: 27.85,   change: 0.22,   changePct: 0.80,  unit: "USD/oz" },
  { symbol: "HG=F",  name: "구리",         category: "귀금속", price: 4.15,    change: -0.03,  changePct: -0.72, unit: "USD/lb" },
  { symbol: "PL=F",  name: "백금",         category: "귀금속", price: 982.00,  change: 3.50,   changePct: 0.36,  unit: "USD/oz" },
  { symbol: "CL=F",  name: "WTI 원유",     category: "에너지", price: 78.45,   change: -0.95,  changePct: -1.20, unit: "USD/bbl" },
  { symbol: "BZ=F",  name: "브렌트 원유",  category: "에너지", price: 82.30,   change: -0.75,  changePct: -0.90, unit: "USD/bbl" },
  { symbol: "NG=F",  name: "천연가스",     category: "에너지", price: 1.82,    change: 0.04,   changePct: 2.25,  unit: "USD/MMBtu" },
  { symbol: "HO=F",  name: "난방유",      category: "에너지", price: 2.65,    change: -0.03,  changePct: -1.12, unit: "USD/gal" },
];
