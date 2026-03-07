import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import { TopStock } from "@/types/market";

const STOCK_CONFIG: Omit<TopStock, "price" | "change" | "changePct" | "marketCap" | "lastUpdated">[] = [
  // 미국
  { symbol: "AAPL",  name: "Apple",     country: "US", currency: "USD" },
  { symbol: "MSFT",  name: "Microsoft", country: "US", currency: "USD" },
  { symbol: "NVDA",  name: "NVIDIA",    country: "US", currency: "USD" },
  { symbol: "AMZN",  name: "Amazon",    country: "US", currency: "USD" },
  { symbol: "META",  name: "Meta",      country: "US", currency: "USD" },
  { symbol: "GOOGL", name: "Alphabet",  country: "US", currency: "USD" },
  // 한국
  { symbol: "005930.KS", name: "삼성전자",   country: "KR", currency: "KRW" },
  { symbol: "000660.KS", name: "SK하이닉스", country: "KR", currency: "KRW" },
  { symbol: "035420.KS", name: "NAVER",      country: "KR", currency: "KRW" },
  { symbol: "005380.KS", name: "현대차",     country: "KR", currency: "KRW" },
  { symbol: "051910.KS", name: "LG화학",     country: "KR", currency: "KRW" },
  { symbol: "035720.KS", name: "카카오",     country: "KR", currency: "KRW" },
  // 일본
  { symbol: "7203.T", name: "도요타",         country: "JP", currency: "JPY" },
  { symbol: "9984.T", name: "소프트뱅크그룹", country: "JP", currency: "JPY" },
  { symbol: "6861.T", name: "키엔스",         country: "JP", currency: "JPY" },
  { symbol: "7974.T", name: "닌텐도",         country: "JP", currency: "JPY" },
  { symbol: "8306.T", name: "미쓰비시UFJ",    country: "JP", currency: "JPY" },
  { symbol: "6758.T", name: "소니그룹",       country: "JP", currency: "JPY" },
];

export async function GET() {
  try {
    const symbols = STOCK_CONFIG.map((c) => c.symbol);

    const results = await yahooFinance.quote(symbols, {}, { validateResult: false });
    const quotesArray = Array.isArray(results) ? results : [results];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteMap = new Map<string, any>(
      quotesArray
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q && q.regularMarketPrice != null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((q: any) => [q.symbol as string, q])
    );

    const items: TopStock[] = [];
    for (const cfg of STOCK_CONFIG) {
      const q = quoteMap.get(cfg.symbol);
      if (!q || q.regularMarketPrice == null) continue;
      items.push({
        ...cfg,
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
        marketCap: q.marketCap ?? undefined,
        lastUpdated: q.regularMarketTime
          ? new Date(q.regularMarketTime).toISOString()
          : new Date().toISOString(),
      });
    }

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [
      ...items,
      ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol)),
    ];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Top stocks fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: TopStock[] = [
  { symbol: "AAPL",      name: "Apple",          country: "US", price: 256.82,   change: -3.18,  changePct: -1.22, currency: "USD", marketCap: 3930000000000 },
  { symbol: "MSFT",      name: "Microsoft",      country: "US", price: 409.00,   change: -1.72,  changePct: -0.42, currency: "USD", marketCap: 3040000000000 },
  { symbol: "NVDA",      name: "NVIDIA",         country: "US", price: 177.82,   change: -5.52,  changePct: -3.01, currency: "USD", marketCap: 4330000000000 },
  { symbol: "AMZN",      name: "Amazon",         country: "US", price: 213.21,   change: -5.73,  changePct: -2.62, currency: "USD", marketCap: 2250000000000 },
  { symbol: "META",      name: "Meta",           country: "US", price: 644.86,   change: -15.71, changePct: -2.38, currency: "USD", marketCap: 1640000000000 },
  { symbol: "GOOGL",     name: "Alphabet",       country: "US", price: 298.52,   change: -2.36,  changePct: -0.78, currency: "USD", marketCap: 1810000000000 },
  { symbol: "005930.KS", name: "삼성전자",       country: "KR", price: 188200,   change: -3400,  changePct: -1.77, currency: "KRW", marketCap: 1124000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",     country: "KR", price: 924000,   change: -17000, changePct: -1.81, currency: "KRW", marketCap: 672000000000000 },
  { symbol: "035420.KS", name: "NAVER",          country: "KR", price: 221000,   change: -3200,  changePct: -1.43, currency: "KRW", marketCap: 36000000000000 },
  { symbol: "005380.KS", name: "현대차",         country: "KR", price: 553000,   change: 5000,   changePct: 0.91,  currency: "KRW", marketCap: 53000000000000 },
  { symbol: "051910.KS", name: "LG화학",         country: "KR", price: 275000,   change: -5500,  changePct: -1.96, currency: "KRW", marketCap: 19000000000000 },
  { symbol: "035720.KS", name: "카카오",         country: "KR", price: 38450,    change: -800,   changePct: -2.04, currency: "KRW", marketCap: 16000000000000 },
  { symbol: "7203.T",    name: "도요타",         country: "JP", price: 3515,     change: 34,     changePct: 0.98,  currency: "JPY", marketCap: 46000000000000 },
  { symbol: "9984.T",    name: "소프트뱅크그룹", country: "JP", price: 3926,     change: 62,     changePct: 1.60,  currency: "JPY", marketCap: 22000000000000 },
  { symbol: "6861.T",    name: "키엔스",         country: "JP", price: 60960,    change: 370,    changePct: 0.61,  currency: "JPY", marketCap: 17000000000000 },
  { symbol: "7974.T",    name: "닌텐도",         country: "JP", price: 8551,     change: 52,     changePct: 0.61,  currency: "JPY", marketCap: 11000000000000 },
  { symbol: "8306.T",    name: "미쓰비시UFJ",    country: "JP", price: 2759,     change: 24,     changePct: 0.88,  currency: "JPY", marketCap: 25000000000000 },
  { symbol: "6758.T",    name: "소니그룹",       country: "JP", price: 3473,     change: 93,     changePct: 2.75,  currency: "JPY", marketCap: 22000000000000 },
];
