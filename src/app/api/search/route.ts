import { NextRequest, NextResponse } from "next/server";
import { searchCoins } from "@/lib/api/coingecko";
import { searchKoreanDict, isKorean } from "@/lib/search/korean-names";

async function searchStocksYahoo(query: string) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0&listsCount=0`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.quotes ?? []) as Record<string, string>[])
    .filter((q) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
    .slice(0, 5)
    .map((q) => ({
      type: q.quoteType === "ETF" ? "etf" : "stock",
      id: q.symbol,
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      image: null as null,
      market_cap_rank: null as null,
    }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    // ── 한국어 쿼리: 로컬 사전 검색 우선 ──────────────────
    if (isKorean(q)) {
      const dictResults = searchKoreanDict(q).map((e) => ({
        type: e.type,
        id: e.id,
        symbol: e.symbol,
        name: e.name,
        nameKo: e.nameKo,
        image: null,
        market_cap_rank: e.market_cap_rank,
      }));

      // 사전 결과가 충분하면 바로 반환, 부족하면 Yahoo 병행
      if (dictResults.length >= 3) {
        return NextResponse.json(dictResults);
      }

      // 사전 결과 보완: Yahoo Finance에도 시도 (영문 쿼리가 포함된 경우 대비)
      const yahooData = await searchStocksYahoo(q).catch(() => []);
      const seenIds = new Set(dictResults.map((r) => r.id));
      const extra = yahooData.filter((r) => !seenIds.has(r.id));
      return NextResponse.json([...dictResults, ...extra].slice(0, 10));
    }

    // ── 영어 쿼리: CoinGecko + Yahoo Finance 병렬 ─────────
    const [cryptoData, stockData] = await Promise.allSettled([
      searchCoins(q).then((data) =>
        (data.coins ?? []).slice(0, 5).map((c: Record<string, unknown>) => ({
          type: "crypto",
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          image: c.large ?? c.thumb,
          market_cap_rank: c.market_cap_rank ?? null,
        }))
      ),
      searchStocksYahoo(q),
    ]);

    const coins  = cryptoData.status === "fulfilled" ? cryptoData.value : [];
    const stocks = stockData.status  === "fulfilled" ? stockData.value  : [];

    return NextResponse.json([...stocks, ...coins]);
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
