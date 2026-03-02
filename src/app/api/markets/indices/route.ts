import { NextResponse } from "next/server";
import { StockIndex } from "@/types/market";

// Finnhub 심볼 매핑 (^GSPC 형식은 Finnhub에서 지원하지 않음 → 직접 매핑)
const INDEX_CONFIG: {
  finnhubSymbol: string;
  displaySymbol: string;
  name: string;
  region: StockIndex["region"];
  currency: string;
}[] = [
  { finnhubSymbol: "^GSPC",  displaySymbol: "^GSPC",  name: "S&P 500",    region: "US", currency: "USD" },
  { finnhubSymbol: "^IXIC",  displaySymbol: "^IXIC",  name: "NASDAQ",     region: "US", currency: "USD" },
  { finnhubSymbol: "^DJI",   displaySymbol: "^DJI",   name: "DOW JONES",  region: "US", currency: "USD" },
  { finnhubSymbol: "^N225",  displaySymbol: "^N225",  name: "NIKKEI 225", region: "JP", currency: "JPY" },
  { finnhubSymbol: "^KS11",  displaySymbol: "^KS11",  name: "KOSPI",      region: "KR", currency: "KRW" },
  { finnhubSymbol: "^KQ11",  displaySymbol: "^KQ11",  name: "KOSDAQ",     region: "KR", currency: "KRW" },
];

async function fetchFinnhubQuote(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const data = await res.json();
  // Finnhub: { c: current, d: change, dp: changePercent, h, l, o, pc }
  if (!data.c) return null;
  return { price: data.c, change: data.d ?? 0, changePercent: data.dp ?? 0 };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey || apiKey === "your_finnhub_api_key") {
    // API 키 미설정 시 샘플 데이터 반환
    return NextResponse.json(FALLBACK_DATA);
  }

  try {
    const results = await Promise.allSettled(
      INDEX_CONFIG.map(async (cfg) => {
        const quote = await fetchFinnhubQuote(cfg.finnhubSymbol, apiKey);
        if (!quote) return null;
        return {
          symbol: cfg.displaySymbol,
          name: cfg.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          currency: cfg.currency,
          region: cfg.region,
        } satisfies StockIndex;
      })
    );

    const indices = results
      .filter((r): r is PromiseFulfilledResult<StockIndex> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    // 일부 실패 시 해당 항목만 fallback으로 보완
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
    console.error("Finnhub indices error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: StockIndex[] = [
  { symbol: "^KS11",  name: "KOSPI",      price: 2523.55,   change: 12.34,    changePercent: 0.49,  currency: "KRW", region: "KR" },
  { symbol: "^KQ11",  name: "KOSDAQ",     price: 742.18,    change: -3.21,    changePercent: -0.43, currency: "KRW", region: "KR" },
  { symbol: "^GSPC",  name: "S&P 500",    price: 5304.72,   change: 28.01,    changePercent: 0.53,  currency: "USD", region: "US" },
  { symbol: "^IXIC",  name: "NASDAQ",     price: 16742.39,  change: -42.77,   changePercent: -0.25, currency: "USD", region: "US" },
  { symbol: "^DJI",   name: "DOW JONES",  price: 39107.54,  change: 134.21,   changePercent: 0.34,  currency: "USD", region: "US" },
  { symbol: "^N225",  name: "NIKKEI 225", price: 38236.07,  change: -201.37,  changePercent: -0.52, currency: "JPY", region: "JP" },
];
