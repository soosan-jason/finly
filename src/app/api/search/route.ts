import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      nameKo: undefined as string | undefined,
      image: null as null,
      market_cap_rank: null as null,
    }));
}

/** Supabase search_index 테이블 검색 (DB 색인이 구축된 경우 사용) */
async function searchFromDB(q: string) {
  try {
    const supabase = await createClient();
    const escaped = q.replace(/[%_]/g, "\\$&"); // ILIKE injection 방지

    const { data, error } = await supabase
      .from("search_index")
      .select("id, type, symbol, name_en, name_ko, image_url, rank")
      .or(
        `name_ko.ilike.%${escaped}%,name_en.ilike.%${escaped}%,symbol.ilike.%${escaped}%`
      )
      .order("rank", { ascending: true, nullsFirst: false })
      .limit(10);

    if (error || !data?.length) return null;

    return data.map((r) => ({
      type: r.type as "crypto" | "stock" | "etf",
      id: r.id,
      symbol: r.symbol,
      name: r.name_en,
      nameKo: (r.name_ko as string | null) ?? undefined,
      image: (r.image_url as string | null) ?? null,
      market_cap_rank: (r.rank as number | null) ?? null,
    }));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    // ── 1차: Supabase search_index ──────────────────────────
    const dbResults = await searchFromDB(q);
    if (dbResults && dbResults.length > 0) {
      return NextResponse.json(dbResults);
    }

    // ── 2차 폴백: 한국어 로컬 사전 ─────────────────────────
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
      if (dictResults.length > 0) return NextResponse.json(dictResults);
    }

    // ── 3차 폴백: CoinGecko + Yahoo Finance ─────────────────
    const [cryptoData, stockData] = await Promise.allSettled([
      searchCoins(q).then((data) =>
        (data.coins ?? []).slice(0, 5).map((c: Record<string, unknown>) => ({
          type: "crypto" as const,
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          nameKo: undefined,
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
