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
  { symbol: "AAPL",      name: "Apple",          country: "US", price: 189.50,   change: 1.20,   changePct: 0.64,  currency: "USD", marketCap: 2940000000000 },
  { symbol: "MSFT",      name: "Microsoft",      country: "US", price: 415.80,   change: -2.30,  changePct: -0.55, currency: "USD", marketCap: 3090000000000 },
  { symbol: "NVDA",      name: "NVIDIA",         country: "US", price: 875.40,   change: 18.60,  changePct: 2.17,  currency: "USD", marketCap: 2160000000000 },
  { symbol: "AMZN",      name: "Amazon",         country: "US", price: 182.75,   change: 0.85,   changePct: 0.47,  currency: "USD", marketCap: 1920000000000 },
  { symbol: "META",      name: "Meta",           country: "US", price: 505.20,   change: 5.40,   changePct: 1.08,  currency: "USD", marketCap: 1290000000000 },
  { symbol: "GOOGL",     name: "Alphabet",       country: "US", price: 172.30,   change: -1.10,  changePct: -0.63, currency: "USD", marketCap: 2140000000000 },
  { symbol: "005930.KS", name: "삼성전자",       country: "KR", price: 79400,    change: 600,    changePct: 0.76,  currency: "KRW", marketCap: 474000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",     country: "KR", price: 191500,   change: -2500,  changePct: -1.29, currency: "KRW", marketCap: 139000000000000 },
  { symbol: "035420.KS", name: "NAVER",          country: "KR", price: 182500,   change: 1500,   changePct: 0.83,  currency: "KRW", marketCap: 30000000000000 },
  { symbol: "005380.KS", name: "현대차",         country: "KR", price: 246500,   change: 2000,   changePct: 0.82,  currency: "KRW", marketCap: 52000000000000 },
  { symbol: "051910.KS", name: "LG화학",         country: "KR", price: 352000,   change: -3000,  changePct: -0.85, currency: "KRW", marketCap: 24000000000000 },
  { symbol: "035720.KS", name: "카카오",         country: "KR", price: 42500,    change: -500,   changePct: -1.16, currency: "KRW", marketCap: 18000000000000 },
  { symbol: "7203.T",    name: "도요타",         country: "JP", price: 3450,     change: 35,     changePct: 1.02,  currency: "JPY", marketCap: 55000000000000 },
  { symbol: "9984.T",    name: "소프트뱅크그룹", country: "JP", price: 8950,     change: -120,   changePct: -1.32, currency: "JPY", marketCap: 15000000000000 },
  { symbol: "6861.T",    name: "키엔스",         country: "JP", price: 58200,    change: 450,    changePct: 0.78,  currency: "JPY", marketCap: 14000000000000 },
  { symbol: "7974.T",    name: "닌텐도",         country: "JP", price: 8150,     change: 80,     changePct: 0.99,  currency: "JPY", marketCap: 10600000000000 },
  { symbol: "8306.T",    name: "미쓰비시UFJ",    country: "JP", price: 1580,     change: -15,    changePct: -0.94, currency: "JPY", marketCap: 21000000000000 },
  { symbol: "6758.T",    name: "소니그룹",       country: "JP", price: 12350,    change: 210,    changePct: 1.73,  currency: "JPY", marketCap: 15400000000000 },
];
