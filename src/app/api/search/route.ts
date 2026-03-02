import { NextRequest, NextResponse } from "next/server";
import { searchCoins } from "@/lib/api/coingecko";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const data = await searchCoins(q);
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
