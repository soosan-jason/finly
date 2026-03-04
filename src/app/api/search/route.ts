import { NextRequest, NextResponse } from "next/server";
import { searchCoins } from "@/lib/api/coingecko";
import { searchSymbol } from "@/lib/api/finnhub";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") ?? "crypto"; // "crypto" | "stock"
  if (!q) return NextResponse.json([]);

  try {
    if (type === "stock") {
      const data = await searchSymbol(q);
      const stocks = (data.result ?? [])
        .filter((r) => r.type === "Common Stock" || r.type === "ETP")
        .slice(0, 8)
        .map((r) => ({
          type: r.type === "ETP" ? "etf" : "stock",
          id: r.symbol,
          symbol: r.displaySymbol,
          name: r.description,
          image: null,
        }));
      return NextResponse.json(stocks);
    }

    // crypto (default)
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
