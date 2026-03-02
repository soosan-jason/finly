import { NextRequest, NextResponse } from "next/server";

export interface FxRate {
  pair: string;        // "USD/KRW"
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

const FX_PAIRS = [
  { from: "USD", to: "KRW" },
  { from: "USD", to: "JPY" },
  { from: "USD", to: "EUR" },
  { from: "USD", to: "CNY" },
];

async function fetchAVRate(from: string, to: string, apiKey: string): Promise<number | null> {
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const data = await res.json();
  const rate = data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
  return rate ? parseFloat(rate) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair"); // e.g. "USD/KRW"
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey || apiKey === "your_alpha_vantage_api_key") {
    return NextResponse.json(FALLBACK_RATES);
  }

  const targets = pair
    ? [{ from: pair.split("/")[0], to: pair.split("/")[1] }]
    : FX_PAIRS;

  try {
    const results = await Promise.allSettled(
      targets.map(async ({ from, to }) => {
        const rate = await fetchAVRate(from, to, apiKey);
        return { pair: `${from}/${to}`, from, to, rate: rate ?? FALLBACK_MAP[`${from}/${to}`] ?? 0, lastUpdated: new Date().toISOString() };
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
  "USD/EUR": 0.9214,
  "USD/CNY": 7.2341,
};

const FALLBACK_RATES: FxRate[] = FX_PAIRS.map(({ from, to }) => ({
  pair: `${from}/${to}`,
  from,
  to,
  rate: FALLBACK_MAP[`${from}/${to}`] ?? 0,
  lastUpdated: new Date().toISOString(),
}));
