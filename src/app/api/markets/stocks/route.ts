import { NextResponse } from "next/server";
import { TopStock } from "@/types/market";
import STOCK_POOL from "@/config/stockPool";

const TOP_N = 8; // 국가별 표시 종목 수

// Yahoo Finance v10 quoteSummary API (marketCap 안정적 반환)
async function fetchQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePct: number;
  marketCap?: number;
  lastUpdated: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.quoteSummary?.result?.[0]?.price;
    if (!p?.regularMarketPrice?.raw) return null;

    const price     = p.regularMarketPrice.raw as number;
    const change    = (p.regularMarketChange?.raw ?? 0) as number;
    const changePct = (p.regularMarketChangePercent?.raw ?? 0) as number * 100;
    const marketCap = (p.marketCap?.raw as number | undefined) ?? undefined;
    const lastUpdated = p.regularMarketTime
      ? new Date((p.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

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

    // 조회 실패 종목은 fallback으로 보완 (isFallback 플래그 설정)
    const symbolSet = new Set(fetched.map((i) => i.symbol));
    const all = [
      ...fetched,
      ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol)).map((f) => ({ ...f, isFallback: true as const })),
    ];

    if (all.length === 0) return NextResponse.json(FALLBACK_DATA.map((f) => ({ ...f, isFallback: true })).slice(0, TOP_N * 3));

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
    return NextResponse.json(FALLBACK_DATA.map((f) => ({ ...f, isFallback: true })));
  }
}

const FALLBACK_DATA: TopStock[] = [
  // ─── 미국 (15) ───────────────────────────────────────────
  { symbol: "NVDA",  name: "NVIDIA",    country: "US", price: 117.00, change:  -4.50, changePct: -3.70, currency: "USD", marketCap: 4500000000000 },
  { symbol: "AAPL",  name: "Apple",     country: "US", price: 232.00, change:  -3.00, changePct: -1.28, currency: "USD", marketCap: 3800000000000 },
  { symbol: "GOOGL", name: "Alphabet",  country: "US", price: 176.00, change:  -1.50, changePct: -0.85, currency: "USD", marketCap: 3600000000000 },
  { symbol: "MSFT",  name: "Microsoft", country: "US", price: 388.00, change:  -2.00, changePct: -0.51, currency: "USD", marketCap: 3000000000000 },
  { symbol: "AMZN",  name: "Amazon",    country: "US", price: 216.00, change:  -3.50, changePct: -1.60, currency: "USD", marketCap: 2400000000000 },
  { symbol: "META",  name: "Meta",      country: "US", price: 660.00, change: -10.00, changePct: -1.49, currency: "USD", marketCap: 1700000000000 },
  { symbol: "AVGO",  name: "Broadcom",  country: "US", price: 208.00, change:  -1.50, changePct: -0.72, currency: "USD", marketCap: 1600000000000 },
  { symbol: "TSLA",  name: "Tesla",     country: "US", price: 289.00, change:  -5.00, changePct: -1.70, currency: "USD", marketCap: 1500000000000 },
  { symbol: "BRK-B", name: "Berkshire", country: "US", price: 470.00, change:   1.20, changePct:  0.26, currency: "USD", marketCap: 1100000000000 },
  { symbol: "WMT",   name: "Walmart",   country: "US", price:  95.00, change:  -0.50, changePct: -0.52, currency: "USD", marketCap:  983000000000 },
  { symbol: "LLY",   name: "Eli Lilly", country: "US", price: 920.00, change:  -5.00, changePct: -0.54, currency: "USD", marketCap:  878000000000 },
  { symbol: "JPM",   name: "JPMorgan",  country: "US", price: 255.00, change:   1.50, changePct:  0.59, currency: "USD", marketCap:  792000000000 },
  { symbol: "XOM",   name: "ExxonMobil",country: "US", price: 110.00, change:  -0.80, changePct: -0.72, currency: "USD", marketCap:  628000000000 },
  { symbol: "V",     name: "Visa",      country: "US", price: 355.00, change:   1.00, changePct:  0.28, currency: "USD", marketCap:  610000000000 },
  { symbol: "JNJ",   name: "J&J",       country: "US", price: 155.00, change:  -0.50, changePct: -0.32, currency: "USD", marketCap:  578000000000 },
  // ─── 한국 (15) ───────────────────────────────────────────
  { symbol: "005930.KS", name: "삼성전자",         country: "KR", price:  62600, change:   -500, changePct: -0.79, currency: "KRW", marketCap: 1226000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",       country: "KR", price: 196000, change:  -4000, changePct: -2.00, currency: "KRW", marketCap:  635000000000000 },
  { symbol: "005380.KS", name: "현대차",           country: "KR", price: 207000, change:   1000, changePct:  0.49, currency: "KRW", marketCap:  126000000000000 },
  { symbol: "373220.KS", name: "LG에너지솔루션",   country: "KR", price: 305000, change:  -3000, changePct: -0.97, currency: "KRW", marketCap:   87000000000000 },
  { symbol: "207940.KS", name: "삼성바이오로직스", country: "KR", price: 997000, change:   5000, changePct:  0.50, currency: "KRW", marketCap:   76000000000000 },
  { symbol: "402340.KS", name: "SK스퀘어",         country: "KR", price: 108000, change:   1000, changePct:  0.93, currency: "KRW", marketCap:   75000000000000 },
  { symbol: "012450.KS", name: "한화에어로스페이스",country: "KR", price: 660000, change:  10000, changePct:  1.54, currency: "KRW", marketCap:   71000000000000 },
  { symbol: "000270.KS", name: "기아",             country: "KR", price: 106500, change:    500, changePct:  0.47, currency: "KRW", marketCap:   64000000000000 },
  { symbol: "329180.KS", name: "HD현대중공업",     country: "KR", price: 185000, change:   3000, changePct:  1.65, currency: "KRW", marketCap:   59000000000000 },
  { symbol: "034020.KS", name: "두산에너빌리티",   country: "KR", price:  24000, change:   -500, changePct: -2.04, currency: "KRW", marketCap:   58000000000000 },
  { symbol: "105560.KS", name: "KB금융",           country: "KR", price:  89000, change:    500, changePct:  0.56, currency: "KRW", marketCap:   53000000000000 },
  { symbol: "028260.KS", name: "삼성물산",         country: "KR", price: 130000, change:   1000, changePct:  0.78, currency: "KRW", marketCap:   48000000000000 },
  { symbol: "068270.KS", name: "셀트리온",         country: "KR", price: 186000, change:  -1000, changePct: -0.53, currency: "KRW", marketCap:   46000000000000 },
  { symbol: "055550.KS", name: "신한지주",         country: "KR", price:  56000, change:    300, changePct:  0.54, currency: "KRW", marketCap:   43000000000000 },
  { symbol: "032830.KS", name: "삼성생명",         country: "KR", price:  90000, change:    500, changePct:  0.56, currency: "KRW", marketCap:   38000000000000 },
  // ─── 일본 (15) ───────────────────────────────────────────
  { symbol: "7203.T", name: "도요타",           country: "JP", price:  2690, change:  -30, changePct: -1.10, currency: "JPY", marketCap: 45800000000000 },
  { symbol: "8306.T", name: "미쓰비시UFJ",      country: "JP", price:  2010, change:   20, changePct:  1.01, currency: "JPY", marketCap: 30900000000000 },
  { symbol: "9984.T", name: "소프트뱅크그룹",   country: "JP", price:  9800, change:  100, changePct:  1.03, currency: "JPY", marketCap: 22400000000000 },
  { symbol: "6501.T", name: "히타치",           country: "JP", price:  4200, change:  -50, changePct: -1.18, currency: "JPY", marketCap: 21900000000000 },
  { symbol: "6758.T", name: "소니그룹",         country: "JP", price:  2980, change:   30, changePct:  1.02, currency: "JPY", marketCap: 20700000000000 },
  { symbol: "8316.T", name: "스미토모미쓰이FG", country: "JP", price:  3800, change:   40, changePct:  1.06, currency: "JPY", marketCap: 20600000000000 },
  { symbol: "9983.T", name: "패스트리테일링",   country: "JP", price: 53000, change:  500, changePct:  0.95, currency: "JPY", marketCap: 20100000000000 },
  { symbol: "8035.T", name: "도쿄일렉트론",     country: "JP", price: 22000, change: -300, changePct: -1.35, currency: "JPY", marketCap: 19100000000000 },
  { symbol: "8058.T", name: "미쓰비시상사",     country: "JP", price:  2800, change:   20, changePct:  0.72, currency: "JPY", marketCap: 18800000000000 },
  { symbol: "6857.T", name: "어드밴테스트",     country: "JP", price:  8500, change: -100, changePct: -1.16, currency: "JPY", marketCap: 18700000000000 },
  { symbol: "8031.T", name: "미쓰이물산",       country: "JP", price:  2900, change:   30, changePct:  1.04, currency: "JPY", marketCap: 16800000000000 },
  { symbol: "7011.T", name: "미쓰비시중공업",   country: "JP", price:  3500, change:   50, changePct:  1.45, currency: "JPY", marketCap: 16000000000000 },
  { symbol: "4519.T", name: "추가이제약",       country: "JP", price:  4200, change:  -30, changePct: -0.71, currency: "JPY", marketCap: 16000000000000 },
  { symbol: "8411.T", name: "미즈호FG",         country: "JP", price:  3200, change:   30, changePct:  0.95, currency: "JPY", marketCap: 15900000000000 },
  { symbol: "6861.T", name: "키엔스",           country: "JP", price: 57000, change: -300, changePct: -0.52, currency: "JPY", marketCap: 15000000000000 },
];
