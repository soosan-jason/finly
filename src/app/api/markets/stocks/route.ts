import { NextResponse } from "next/server";
import { TopStock } from "@/types/market";

const TOP_N = 8; // 국가별 표시 종목 수

// marketCap: 실시간 API 미반환 시 정렬 기준값
type StockConfig = Omit<TopStock, "price" | "change" | "changePct" | "lastUpdated"> & { marketCap: number };

// 후보 풀: 국가별 15종목 (실시간 시총으로 상위 8개 자동 선정)
const STOCK_POOL: StockConfig[] = [
  // 미국 (15)
  { symbol: "NVDA",  name: "NVIDIA",      country: "US", currency: "USD", marketCap: 4330000000000 },
  { symbol: "AAPL",  name: "Apple",       country: "US", currency: "USD", marketCap: 3930000000000 },
  { symbol: "MSFT",  name: "Microsoft",   country: "US", currency: "USD", marketCap: 3040000000000 },
  { symbol: "AMZN",  name: "Amazon",      country: "US", currency: "USD", marketCap: 2250000000000 },
  { symbol: "GOOGL", name: "Alphabet",    country: "US", currency: "USD", marketCap: 1810000000000 },
  { symbol: "META",  name: "Meta",        country: "US", currency: "USD", marketCap: 1640000000000 },
  { symbol: "TSLA",  name: "Tesla",       country: "US", currency: "USD", marketCap: 1070000000000 },
  { symbol: "AVGO",  name: "Broadcom",    country: "US", currency: "USD", marketCap:  870000000000 },
  { symbol: "BRK-B", name: "Berkshire",   country: "US", currency: "USD", marketCap:  990000000000 },
  { symbol: "LLY",   name: "Eli Lilly",   country: "US", currency: "USD", marketCap:  750000000000 },
  { symbol: "JPM",   name: "JPMorgan",    country: "US", currency: "USD", marketCap:  720000000000 },
  { symbol: "WMT",   name: "Walmart",     country: "US", currency: "USD", marketCap:  710000000000 },
  { symbol: "V",     name: "Visa",        country: "US", currency: "USD", marketCap:  620000000000 },
  { symbol: "UNH",   name: "UnitedHealth",country: "US", currency: "USD", marketCap:  510000000000 },
  { symbol: "XOM",   name: "ExxonMobil",  country: "US", currency: "USD", marketCap:  500000000000 },
  // 한국 (15)
  { symbol: "005930.KS", name: "삼성전자",           country: "KR", currency: "KRW", marketCap: 1124000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",         country: "KR", currency: "KRW", marketCap:  672000000000000 },
  { symbol: "005380.KS", name: "현대차",             country: "KR", currency: "KRW", marketCap:  118000000000000 },
  { symbol: "005935.KS", name: "삼성전자우",          country: "KR", currency: "KRW", marketCap:  105000000000000 },
  { symbol: "373220.KS", name: "LG에너지솔루션",     country: "KR", currency: "KRW", marketCap:   88000000000000 },
  { symbol: "012450.KS", name: "한화에어로스페이스",  country: "KR", currency: "KRW", marketCap:   78000000000000 },
  { symbol: "207940.KS", name: "삼성바이오로직스",   country: "KR", currency: "KRW", marketCap:   59000000000000 },
  { symbol: "068270.KS", name: "셀트리온",           country: "KR", currency: "KRW", marketCap:   48000000000000 },
  { symbol: "035420.KS", name: "NAVER",              country: "KR", currency: "KRW", marketCap:   45000000000000 },
  { symbol: "000270.KS", name: "기아",               country: "KR", currency: "KRW", marketCap:   42000000000000 },
  { symbol: "105560.KS", name: "KB금융",             country: "KR", currency: "KRW", marketCap:   38000000000000 },
  { symbol: "055550.KS", name: "신한지주",           country: "KR", currency: "KRW", marketCap:   33000000000000 },
  { symbol: "006400.KS", name: "삼성SDI",            country: "KR", currency: "KRW", marketCap:   28000000000000 },
  { symbol: "028260.KS", name: "삼성물산",           country: "KR", currency: "KRW", marketCap:   25000000000000 },
  { symbol: "003550.KS", name: "LG",                 country: "KR", currency: "KRW", marketCap:   22000000000000 },
  // 일본 (15)
  { symbol: "7203.T",  name: "도요타",           country: "JP", currency: "JPY", marketCap: 46000000000000 },
  { symbol: "8306.T",  name: "미쓰비시UFJ",      country: "JP", currency: "JPY", marketCap: 25000000000000 },
  { symbol: "9984.T",  name: "소프트뱅크그룹",   country: "JP", currency: "JPY", marketCap: 24000000000000 },
  { symbol: "6501.T",  name: "히타치",            country: "JP", currency: "JPY", marketCap: 21000000000000 },
  { symbol: "6758.T",  name: "소니그룹",          country: "JP", currency: "JPY", marketCap: 18000000000000 },
  { symbol: "9983.T",  name: "패스트리테일링",    country: "JP", currency: "JPY", marketCap: 17000000000000 },
  { symbol: "8316.T",  name: "스미토모미쓰이FG",  country: "JP", currency: "JPY", marketCap: 14000000000000 },
  { symbol: "6367.T",  name: "다이킨공업",        country: "JP", currency: "JPY", marketCap: 12000000000000 },
  { symbol: "6861.T",  name: "키엔스",            country: "JP", currency: "JPY", marketCap: 15000000000000 },
  { symbol: "7974.T",  name: "닌텐도",            country: "JP", currency: "JPY", marketCap: 11000000000000 },
  { symbol: "8411.T",  name: "미즈호FG",          country: "JP", currency: "JPY", marketCap: 10000000000000 },
  { symbol: "6098.T",  name: "리쿠르트",          country: "JP", currency: "JPY", marketCap:  9500000000000 },
  { symbol: "4502.T",  name: "타케다제약",        country: "JP", currency: "JPY", marketCap:  9000000000000 },
  { symbol: "9432.T",  name: "NTT",               country: "JP", currency: "JPY", marketCap:  8500000000000 },
  { symbol: "6954.T",  name: "파나소닉HD",        country: "JP", currency: "JPY", marketCap:  8000000000000 },
];

// Yahoo Finance v8 chart API
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
    // 전체 후보 풀 병렬 조회
    const results = await Promise.allSettled(
      STOCK_POOL.map(async (cfg) => {
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
          marketCap:   quote.marketCap ?? cfg.marketCap,
          lastUpdated: quote.lastUpdated,
        } satisfies TopStock;
      })
    );

    const fetched = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<TopStock>).value);

    // 조회 실패 종목은 fallback으로 보완
    const symbolSet = new Set(fetched.map((i) => i.symbol));
    const all = [
      ...fetched,
      ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol)),
    ];

    if (all.length === 0) return NextResponse.json(FALLBACK_DATA.slice(0, TOP_N * 3));

    // 국가별 시총 상위 TOP_N 선정
    const countries = ["US", "KR", "JP"] as const;
    const top = countries.flatMap((country) =>
      all
        .filter((s) => s.country === country)
        .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
        .slice(0, TOP_N)
    );

    return NextResponse.json(top, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Top stocks fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: TopStock[] = [
  // 미국
  { symbol: "NVDA",  name: "NVIDIA",      country: "US", price: 177.82,   change:  -5.52,  changePct: -3.01, currency: "USD", marketCap: 4330000000000 },
  { symbol: "AAPL",  name: "Apple",       country: "US", price: 256.82,   change:  -3.18,  changePct: -1.22, currency: "USD", marketCap: 3930000000000 },
  { symbol: "MSFT",  name: "Microsoft",   country: "US", price: 409.00,   change:  -1.72,  changePct: -0.42, currency: "USD", marketCap: 3040000000000 },
  { symbol: "AMZN",  name: "Amazon",      country: "US", price: 213.21,   change:  -5.73,  changePct: -2.62, currency: "USD", marketCap: 2250000000000 },
  { symbol: "GOOGL", name: "Alphabet",    country: "US", price: 298.52,   change:  -2.36,  changePct: -0.78, currency: "USD", marketCap: 1810000000000 },
  { symbol: "META",  name: "Meta",        country: "US", price: 644.86,   change: -15.71,  changePct: -2.38, currency: "USD", marketCap: 1640000000000 },
  { symbol: "TSLA",  name: "Tesla",       country: "US", price: 338.74,   change:  -5.12,  changePct: -1.49, currency: "USD", marketCap: 1070000000000 },
  { symbol: "BRK-B", name: "Berkshire",   country: "US", price: 489.11,   change:   1.20,  changePct:  0.25, currency: "USD", marketCap:  990000000000 },
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
  { symbol: "6861.T",  name: "키엔스",            country: "JP", price: 57200,  change: -300,  changePct: -0.52, currency: "JPY", marketCap: 15000000000000 },
  { symbol: "9983.T",  name: "패스트리테일링",    country: "JP", price: 65430,  change: 1070,  changePct:  1.66, currency: "JPY", marketCap: 17000000000000 },
  { symbol: "8316.T",  name: "스미토모미쓰이FG",  country: "JP", price:  5423,  change:   31,  changePct:  0.57, currency: "JPY", marketCap: 14000000000000 },
];
