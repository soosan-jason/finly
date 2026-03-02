import { NextRequest, NextResponse } from "next/server";
import { INDICES } from "@/lib/api/yahoo-finance";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols") || INDICES.map((i) => i.symbol).join(",");

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,currency`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

    const data = await res.json();
    const quotes = data?.quoteResponse?.result ?? [];

    const indices = quotes.map((q: Record<string, unknown>) => {
      const meta = INDICES.find((i) => i.symbol === q.symbol) ?? {
        name: q.shortName ?? q.symbol,
        region: "US" as const,
      };
      return {
        symbol: q.symbol,
        name: meta.name,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        currency: q.currency ?? "USD",
        region: meta.region,
      };
    });

    return NextResponse.json(indices, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Indices API error:", err);
    return NextResponse.json({ error: "Failed to fetch market indices" }, { status: 500 });
  }
}
