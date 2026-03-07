import { NextResponse } from "next/server";
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

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type QuoteResult = {
  price: number;
  change: number;
  changePct: number;
  marketCap?: number;
  lastUpdated: string;
};

async function fetchQuoteBatch(symbols: string[]): Promise<Map<string, QuoteResult>> {
  const result = new Map<string, QuoteResult>();
  const encoded = symbols.map(encodeURIComponent).join(",");

  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const quotes: unknown[] = data?.quoteResponse?.result ?? [];
      if (quotes.length === 0) continue;

      for (const q of quotes as Record<string, unknown>[]) {
        const price = q.regularMarketPrice as number | undefined;
        if (!price) continue;
        result.set(q.symbol as string, {
          price,
          change: (q.regularMarketChange as number) ?? 0,
          changePct: (q.regularMarketChangePercent as number) ?? 0,
          marketCap: q.marketCap as number | undefined,
          lastUpdated: q.regularMarketTime
            ? new Date((q.regularMarketTime as number) * 1000).toISOString()
            : new Date().toISOString(),
        });
      }
      break;
    } catch {
      continue;
    }
  }
  return result;
}

export async function GET() {
  try {
    const symbols = STOCK_CONFIG.map((c) => c.symbol);
    const quotes = await fetchQuoteBatch(symbols);

    const items: TopStock[] = [];
    for (const cfg of STOCK_CONFIG) {
      const q = quotes.get(cfg.symbol);
      if (!q) continue;
      items.push({ ...cfg, ...q });
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
  { symbol: "MSFT",      name: "Microsoft",      country: "US", price: 359.00,   change: -5.40,  changePct: -1.48, currency: "USD", marketCap: 2670000000000 },
  { symbol: "NVDA",      name: "NVIDIA",         country: "US", price: 181.48,   change: -1.86,  changePct: -1.01, currency: "USD", marketCap: 4430000000000 },
  { symbol: "AMZN",      name: "Amazon",         country: "US", price: 204.96,   change: -2.15,  changePct: -1.04, currency: "USD", marketCap: 2150000000000 },
  { symbol: "META",      name: "Meta",           country: "US", price: 660.57,   change: 7.07,   changePct: 1.08,  currency: "USD", marketCap: 1690000000000 },
  { symbol: "GOOGL",     name: "Alphabet",       country: "US", price: 300.88,   change: 2.22,   changePct: 0.74,  currency: "USD", marketCap: 3700000000000 },
  { symbol: "005930.KS", name: "삼성전자",       country: "KR", price: 192000,   change: -4000,  changePct: -2.04, currency: "KRW", marketCap: 1147000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",     country: "KR", price: 880000,   change: -18000, changePct: -2.00, currency: "KRW", marketCap: 639000000000000 },
  { symbol: "035420.KS", name: "NAVER",          country: "KR", price: 221000,   change: -3200,  changePct: -1.43, currency: "KRW", marketCap: 36000000000000 },
  { symbol: "005380.KS", name: "현대차",         country: "KR", price: 198000,   change: -4000,  changePct: -1.98, currency: "KRW", marketCap: 42000000000000 },
  { symbol: "051910.KS", name: "LG화학",         country: "KR", price: 385000,   change: -7500,  changePct: -1.91, currency: "KRW", marketCap: 26000000000000 },
  { symbol: "035720.KS", name: "카카오",         country: "KR", price: 38450,    change: -800,   changePct: -2.04, currency: "KRW", marketCap: 16000000000000 },
  { symbol: "7203.T",    name: "도요타",         country: "JP", price: 3515,     change: 22,     changePct: 0.63,  currency: "JPY", marketCap: 46000000000000 },
  { symbol: "9984.T",    name: "소프트뱅크그룹", country: "JP", price: 3926,     change: 57,     changePct: 1.48,  currency: "JPY", marketCap: 22000000000000 },
  { symbol: "6861.T",    name: "키엔스",         country: "JP", price: 60960,    change: 370,    changePct: 0.61,  currency: "JPY", marketCap: 17000000000000 },
  { symbol: "7974.T",    name: "닌텐도",         country: "JP", price: 8551,     change: 52,     changePct: 0.61,  currency: "JPY", marketCap: 11000000000000 },
  { symbol: "8306.T",    name: "미쓰비시UFJ",    country: "JP", price: 2800,     change: 18,     changePct: 0.65,  currency: "JPY", marketCap: 26000000000000 },
  { symbol: "6758.T",    name: "소니그룹",       country: "JP", price: 3478,     change: -9,     changePct: -0.27, currency: "JPY", marketCap: 22000000000000 },
];
