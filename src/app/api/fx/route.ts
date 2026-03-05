import { NextRequest, NextResponse } from "next/server";

export interface FxRate {
  pair: string;        // "USD/KRW"
  from: string;
  to: string;
  rate: number;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  lastUpdated: string;
}

const FX_PAIRS = [
  { from: "USD", to: "KRW" },
  { from: "USD", to: "JPY" },
  { from: "JPY", to: "KRW" },
  { from: "USD", to: "EUR" },
  { from: "USD", to: "CNY" },
];

interface YahooFxResult {
  rate: number | null;
  previousClose: number | null;
}

// Yahoo Finance 환율 심볼: USDKRW=X, USDJPY=X 등
async function fetchYahooFxRate(from: string, to: string): Promise<YahooFxResult> {
  try {
    const symbol = `${from}${to}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { rate: null, previousClose: null };
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const rate = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
    const previousClose = typeof meta?.previousClose === "number" ? meta.previousClose : null;
    return { rate, previousClose };
  } catch {
    return { rate: null, previousClose: null };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair"); // e.g. "USD/KRW"

  const targets = pair
    ? [{ from: pair.split("/")[0], to: pair.split("/")[1] }]
    : FX_PAIRS;

  try {
    const results = await Promise.allSettled(
      targets.map(async ({ from, to }) => {
        const { rate, previousClose } = await fetchYahooFxRate(from, to);
        const finalRate = rate ?? FALLBACK_MAP[`${from}/${to}`] ?? 0;
        const change = rate !== null && previousClose !== null ? rate - previousClose : null;
        const changePct = change !== null && previousClose ? (change / previousClose) * 100 : null;
        return {
          pair: `${from}/${to}`,
          from,
          to,
          rate: finalRate,
          previousClose,
          change,
          changePct,
          lastUpdated: new Date().toISOString(),
        };
      })
    );

    const rates = results
      .filter((r): r is PromiseFulfilledResult<FxRate> => r.status === "fulfilled")
      .map((r) => r.value);

    return NextResponse.json(rates, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("FX rate error:", err);
    return NextResponse.json(FALLBACK_RATES);
  }
}

const FALLBACK_MAP: Record<string, number> = {
  "USD/KRW": 1325.50,
  "USD/JPY": 149.82,
  "JPY/KRW": 8.85,
  "USD/EUR": 0.9214,
  "USD/CNY": 7.2341,
};

const FALLBACK_RATES: FxRate[] = FX_PAIRS.map(({ from, to }) => ({
  pair: `${from}/${to}`,
  from,
  to,
  rate: FALLBACK_MAP[`${from}/${to}`] ?? 0,
  previousClose: null,
  change: null,
  changePct: null,
  lastUpdated: new Date().toISOString(),
}));
