import { NextResponse } from "next/server";
import { TopStock } from "@/types/market";

// marketCap: API가 반환하지 않을 때 정렬 안정성 보장용 기준값
type StockConfig = Omit<TopStock, "price" | "change" | "changePct" | "lastUpdated"> & { marketCap: number };

const STOCK_CONFIG: StockConfig[] = [
  // 미국
  { symbol: "AAPL",  name: "Apple",     country: "US", currency: "USD", marketCap: 3930000000000 },
  { symbol: "MSFT",  name: "Microsoft", country: "US", currency: "USD", marketCap: 3040000000000 },
  { symbol: "NVDA",  name: "NVIDIA",    country: "US", currency: "USD", marketCap: 4330000000000 },
  { symbol: "AMZN",  name: "Amazon",    country: "US", currency: "USD", marketCap: 2250000000000 },
  { symbol: "GOOGL", name: "Alphabet",  country: "US", currency: "USD", marketCap: 1810000000000 },
  { symbol: "META",  name: "Meta",      country: "US", currency: "USD", marketCap: 1640000000000 },
  { symbol: "TSLA",  name: "Tesla",     country: "US", currency: "USD", marketCap: 1070000000000 },
  { symbol: "AVGO",  name: "Broadcom",  country: "US", currency: "USD", marketCap:  870000000000 },
  // 한국
  { symbol: "005930.KS", name: "삼성전자",           country: "KR", currency: "KRW", marketCap: 1124000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",         country: "KR", currency: "KRW", marketCap:  672000000000000 },
  { symbol: "005380.KS", name: "현대차",             country: "KR", currency: "KRW", marketCap:  118000000000000 },
  { symbol: "005935.KS", name: "삼성전자우",          country: "KR", currency: "KRW", marketCap:  105000000000000 },
  { symbol: "373220.KS", name: "LG에너지솔루션",     country: "KR", currency: "KRW", marketCap:   88000000000000 },
  { symbol: "012450.KS", name: "한화에어로스페이스",  country: "KR", currency: "KRW", marketCap:   78000000000000 },
  { symbol: "207940.KS", name: "삼성바이오로직스",   country: "KR", currency: "KRW", marketCap:   59000000000000 },
  { symbol: "068270.KS", name: "셀트리온",           country: "KR", currency: "KRW", marketCap:   48000000000000 },
  // 일본
  { symbol: "7203.T",  name: "도요타",           country: "JP", currency: "JPY", marketCap: 46000000000000 },
  { symbol: "8306.T",  name: "미쓰비시UFJ",      country: "JP", currency: "JPY", marketCap: 25000000000000 },
  { symbol: "9984.T",  name: "소프트뱅크그룹",   country: "JP", currency: "JPY", marketCap: 24000000000000 },
  { symbol: "6501.T",  name: "히타치",            country: "JP", currency: "JPY", marketCap: 21000000000000 },
  { symbol: "6758.T",  name: "소니그룹",          country: "JP", currency: "JPY", marketCap: 18000000000000 },
  { symbol: "9983.T",  name: "패스트리테일링",    country: "JP", currency: "JPY", marketCap: 17000000000000 },
  { symbol: "8316.T",  name: "스미토모미쓰이FG",  country: "JP", currency: "JPY", marketCap: 14000000000000 },
  { symbol: "6367.T",  name: "다이킨공업",        country: "JP", currency: "JPY", marketCap: 12000000000000 },
];

// Yahoo Finance v8 chart API (indices/commodities와 동일 방식, 크럼 불필요)
async function fetchQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePct: number;
  marketCap?: number;
  lastUpdated: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
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
    const marketCap = (meta.marketCap as number | undefined) ?? undefined;

    return { price, change, changePct, marketCap, lastUpdated };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      STOCK_CONFIG.map(async (cfg) => {
        const quote = await fetchQuote(cfg.symbol);
        if (!quote) return null;
        return {
          symbol:      cfg.symbol,
          name:        cfg.name,
          country:     cfg.country,
          currency:    cfg.currency,
          price:       quote.price,
          change:      quote.change,
          changePct:   quote.changePct,
          // 실시간 marketCap 우선, 없으면 기준값으로 정렬 안정성 보장
          marketCap:   quote.marketCap ?? cfg.marketCap,
          lastUpdated: quote.lastUpdated,
        } satisfies TopStock;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<TopStock>).value);

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
  // 미국
  { symbol: "AAPL",  name: "Apple",     country: "US", price: 256.82,   change:  -3.18,  changePct: -1.22, currency: "USD", marketCap: 3930000000000 },
  { symbol: "MSFT",  name: "Microsoft", country: "US", price: 409.00,   change:  -1.72,  changePct: -0.42, currency: "USD", marketCap: 3040000000000 },
  { symbol: "NVDA",  name: "NVIDIA",    country: "US", price: 177.82,   change:  -5.52,  changePct: -3.01, currency: "USD", marketCap: 4330000000000 },
  { symbol: "AMZN",  name: "Amazon",    country: "US", price: 213.21,   change:  -5.73,  changePct: -2.62, currency: "USD", marketCap: 2250000000000 },
  { symbol: "GOOGL", name: "Alphabet",  country: "US", price: 298.52,   change:  -2.36,  changePct: -0.78, currency: "USD", marketCap: 1810000000000 },
  { symbol: "META",  name: "Meta",      country: "US", price: 644.86,   change: -15.71,  changePct: -2.38, currency: "USD", marketCap: 1640000000000 },
  { symbol: "TSLA",  name: "Tesla",     country: "US", price: 338.74,   change:  -5.12,  changePct: -1.49, currency: "USD", marketCap: 1070000000000 },
  { symbol: "AVGO",  name: "Broadcom",  country: "US", price: 192.40,   change:  -1.80,  changePct: -0.93, currency: "USD", marketCap:  870000000000 },
  // 한국
  { symbol: "005930.KS", name: "삼성전자",           country: "KR", price: 188200,  change:  -3400,  changePct: -1.77, currency: "KRW", marketCap: 1124000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",         country: "KR", price: 924000,  change: -17000,  changePct: -1.81, currency: "KRW", marketCap:  672000000000000 },
  { symbol: "005380.KS", name: "현대차",             country: "KR", price: 553000,  change:   5000,  changePct:  0.91, currency: "KRW", marketCap:  118000000000000 },
  { symbol: "005935.KS", name: "삼성전자우",          country: "KR", price: 128000,  change:   -600,  changePct: -0.47, currency: "KRW", marketCap:  105000000000000 },
  { symbol: "373220.KS", name: "LG에너지솔루션",     country: "KR", price: 377500,  change:   6000,  changePct:  1.62, currency: "KRW", marketCap:   88000000000000 },
  { symbol: "012450.KS", name: "한화에어로스페이스",  country: "KR", price: 1481000, change: 100000,  changePct:  7.24, currency: "KRW", marketCap:   78000000000000 },
  { symbol: "207940.KS", name: "삼성바이오로직스",   country: "KR", price: 1644000, change:  -3000,  changePct: -0.18, currency: "KRW", marketCap:   59000000000000 },
  { symbol: "068270.KS", name: "셀트리온",           country: "KR", price:  195000, change:   1000,  changePct:  0.52, currency: "KRW", marketCap:   48000000000000 },
  // 일본
  { symbol: "7203.T",  name: "도요타",           country: "JP", price:  3515,  change:   34,  changePct:  0.98, currency: "JPY", marketCap: 46000000000000 },
  { symbol: "8306.T",  name: "미쓰비시UFJ",      country: "JP", price:  2759,  change:   24,  changePct:  0.88, currency: "JPY", marketCap: 25000000000000 },
  { symbol: "9984.T",  name: "소프트뱅크그룹",   country: "JP", price:  3926,  change:   62,  changePct:  1.60, currency: "JPY", marketCap: 24000000000000 },
  { symbol: "6501.T",  name: "히타치",            country: "JP", price:  4831,  change:  -29,  changePct: -0.60, currency: "JPY", marketCap: 21000000000000 },
  { symbol: "6758.T",  name: "소니그룹",          country: "JP", price:  3473,  change:   93,  changePct:  2.75, currency: "JPY", marketCap: 18000000000000 },
  { symbol: "9983.T",  name: "패스트리테일링",    country: "JP", price: 65430,  change: 1070,  changePct:  1.66, currency: "JPY", marketCap: 17000000000000 },
  { symbol: "8316.T",  name: "스미토모미쓰이FG",  country: "JP", price:  5423,  change:   31,  changePct:  0.57, currency: "JPY", marketCap: 14000000000000 },
  { symbol: "6367.T",  name: "다이킨공업",        country: "JP", price: 19500,  change: -120,  changePct: -0.61, currency: "JPY", marketCap: 12000000000000 },
];
