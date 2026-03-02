import { NextRequest, NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json([]);

  try {
    const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error("CoinGecko search error");

    const data = await res.json();
    const coins = (data.coins ?? []).slice(0, 8).map((c: Record<string, unknown>) => ({
      type: "crypto",
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.large ?? c.thumb,
      market_cap_rank: c.market_cap_rank,
    }));

    return NextResponse.json(coins);
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
