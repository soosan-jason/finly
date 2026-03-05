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

// Yahoo Finance chart API: 현재가(regularMarketPrice) + 전일 종가(chartPreviousClose) 동시 제공
async function fetchYahooFxRate(
  from: string,
  to: string
): Promise<{ rate: number | null; previousClose: number | null }> {
  try {
    const symbol = `${from}${to}=X`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { rate: null, previousClose: null };

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return { rate: null, previousClose: null };

    const rate = meta.regularMarketPrice as number;
    // chartPreviousClose: 직전 거래일 종가 (Yahoo Finance 제공)
    const previousClose = (meta.chartPreviousClose ?? meta.previousClose ?? null) as number | null;

    return { rate, previousClose };
  } catch {
    return { rate: null, previousClose: null };
  }
}

// open.er-api.com: Yahoo Finance 실패 시 현재 환율만 백업 조회
async function fetchFallbackRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.result !== "success") return null;
    return data.rates as Record<string, number>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair"); // e.g. "USD/KRW"

  const targets = pair
    ? [{ from: pair.split("/")[0], to: pair.split("/")[1] }]
    : FX_PAIRS;

  try {
    // 모든 쌍을 Yahoo Finance에서 병렬 조회
    const yahooResults = await Promise.all(
      targets.map(({ from, to }) => fetchYahooFxRate(from, to))
    );

    // Yahoo Finance 전체 실패 시 백업 API로 현재 환율만 취득
    const allYahooFailed = yahooResults.every((r) => r.rate === null);
    const fallbackRates = allYahooFailed ? await fetchFallbackRates() : null;

    const result: FxRate[] = targets.map(({ from, to }, i) => {
      let rate = yahooResults[i].rate;
      const previousClose = yahooResults[i].previousClose;

      // Yahoo Finance 실패 → 백업 API 사용 (전일비는 null)
      if (rate === null && fallbackRates) {
        if (from === "USD") {
          rate = fallbackRates[to] ?? null;
        } else if (to === "USD") {
          rate = fallbackRates[from] ? 1 / fallbackRates[from] : null;
        } else {
          const a = fallbackRates[from], b = fallbackRates[to];
          rate = a && b ? b / a : null;
        }
      }

      const finalRate = rate ?? FALLBACK_MAP[`${from}/${to}`] ?? 0;
      const change = previousClose !== null ? finalRate - previousClose : null;
      const changePct = previousClose !== null && previousClose !== 0
        ? (change! / previousClose) * 100
        : null;

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
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("FX rate error:", err);
    return NextResponse.json(FALLBACK_RATES);
  }
}

const FALLBACK_MAP: Record<string, number> = {
  "USD/KRW": 1474.48,
  "USD/JPY": 157.24,
  "JPY/KRW": 9.3401,
  "USD/EUR": 0.8602,
  "USD/CNY": 7.2500,
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
