/**
 * 주요국 주식 후보 풀 (국가별 15종목)
 * 매월 1회 시총 순위 기준으로 수동 업데이트
 * 마지막 업데이트: 2026-03
 */

export type StockPoolItem = {
  symbol: string;
  name: string;
  country: "US" | "KR" | "JP";
  currency: "USD" | "KRW" | "JPY";
  marketCap: number; // 기준값 (실시간 미반환 시 정렬용)
};

const STOCK_POOL: StockPoolItem[] = [
  // ─── 미국 (USD) ───────────────────────────────────────────
  { symbol: "NVDA",  name: "NVIDIA",            country: "US", currency: "USD", marketCap: 4500000000000 },
  { symbol: "AAPL",  name: "Apple",             country: "US", currency: "USD", marketCap: 3800000000000 },
  { symbol: "GOOGL", name: "Alphabet",          country: "US", currency: "USD", marketCap: 3600000000000 },
  { symbol: "MSFT",  name: "Microsoft",         country: "US", currency: "USD", marketCap: 3000000000000 },
  { symbol: "AMZN",  name: "Amazon",            country: "US", currency: "USD", marketCap: 2400000000000 },
  { symbol: "META",  name: "Meta",              country: "US", currency: "USD", marketCap: 1700000000000 },
  { symbol: "AVGO",  name: "Broadcom",          country: "US", currency: "USD", marketCap: 1600000000000 },
  { symbol: "TSLA",  name: "Tesla",             country: "US", currency: "USD", marketCap: 1500000000000 },
  { symbol: "BRK-B", name: "Berkshire",         country: "US", currency: "USD", marketCap: 1100000000000 },
  { symbol: "WMT",   name: "Walmart",           country: "US", currency: "USD", marketCap:  983000000000 },
  { symbol: "LLY",   name: "Eli Lilly",         country: "US", currency: "USD", marketCap:  878000000000 },
  { symbol: "JPM",   name: "JPMorgan",          country: "US", currency: "USD", marketCap:  792000000000 },
  { symbol: "XOM",   name: "ExxonMobil",        country: "US", currency: "USD", marketCap:  628000000000 },
  { symbol: "V",     name: "Visa",              country: "US", currency: "USD", marketCap:  610000000000 },
  { symbol: "JNJ",   name: "J&J",               country: "US", currency: "USD", marketCap:  578000000000 },

  // ─── 일본 (JPY, 단위: 兆) ─────────────────────────────────
  { symbol: "7203.T", name: "도요타",             country: "JP", currency: "JPY", marketCap: 45800000000000 },
  { symbol: "8306.T", name: "미쓰비시UFJ",        country: "JP", currency: "JPY", marketCap: 30900000000000 },
  { symbol: "9984.T", name: "소프트뱅크그룹",     country: "JP", currency: "JPY", marketCap: 22400000000000 },
  { symbol: "6501.T", name: "히타치",             country: "JP", currency: "JPY", marketCap: 21900000000000 },
  { symbol: "6758.T", name: "소니그룹",           country: "JP", currency: "JPY", marketCap: 20700000000000 },
  { symbol: "8316.T", name: "스미토모미쓰이FG",   country: "JP", currency: "JPY", marketCap: 20600000000000 },
  { symbol: "9983.T", name: "패스트리테일링",     country: "JP", currency: "JPY", marketCap: 20100000000000 },
  { symbol: "8035.T", name: "도쿄일렉트론",       country: "JP", currency: "JPY", marketCap: 19100000000000 },
  { symbol: "8058.T", name: "미쓰비시상사",       country: "JP", currency: "JPY", marketCap: 18800000000000 },
  { symbol: "6857.T", name: "어드밴테스트",       country: "JP", currency: "JPY", marketCap: 18700000000000 },
  { symbol: "8031.T", name: "미쓰이물산",         country: "JP", currency: "JPY", marketCap: 16800000000000 },
  { symbol: "7011.T", name: "미쓰비시중공업",     country: "JP", currency: "JPY", marketCap: 16000000000000 },
  { symbol: "4519.T", name: "추가이제약",         country: "JP", currency: "JPY", marketCap: 16000000000000 },
  { symbol: "8411.T", name: "미즈호FG",           country: "JP", currency: "JPY", marketCap: 15900000000000 },
  { symbol: "6861.T", name: "키엔스",             country: "JP", currency: "JPY", marketCap: 15000000000000 },

  // ─── 한국 (KRW, 단위: 조) ────────────────────────────────
  { symbol: "005930.KS", name: "삼성전자",         country: "KR", currency: "KRW", marketCap: 1226000000000000 },
  { symbol: "000660.KS", name: "SK하이닉스",       country: "KR", currency: "KRW", marketCap:  635000000000000 },
  { symbol: "005380.KS", name: "현대차",           country: "KR", currency: "KRW", marketCap:  126000000000000 },
  { symbol: "373220.KS", name: "LG에너지솔루션",   country: "KR", currency: "KRW", marketCap:   87000000000000 },
  { symbol: "207940.KS", name: "삼성바이오로직스", country: "KR", currency: "KRW", marketCap:   76000000000000 },
  { symbol: "402340.KS", name: "SK스퀘어",         country: "KR", currency: "KRW", marketCap:   75000000000000 },
  { symbol: "012450.KS", name: "한화에어로스페이스",country: "KR", currency: "KRW", marketCap:   71000000000000 },
  { symbol: "000270.KS", name: "기아",             country: "KR", currency: "KRW", marketCap:   64000000000000 },
  { symbol: "329180.KS", name: "HD현대중공업",     country: "KR", currency: "KRW", marketCap:   59000000000000 },
  { symbol: "034020.KS", name: "두산에너빌리티",   country: "KR", currency: "KRW", marketCap:   58000000000000 },
  { symbol: "105560.KS", name: "KB금융",           country: "KR", currency: "KRW", marketCap:   53000000000000 },
  { symbol: "028260.KS", name: "삼성물산",         country: "KR", currency: "KRW", marketCap:   48000000000000 },
  { symbol: "068270.KS", name: "셀트리온",         country: "KR", currency: "KRW", marketCap:   46000000000000 },
  { symbol: "055550.KS", name: "신한지주",         country: "KR", currency: "KRW", marketCap:   43000000000000 },
  { symbol: "032830.KS", name: "삼성생명",         country: "KR", currency: "KRW", marketCap:   38000000000000 },
];

export default STOCK_POOL;
