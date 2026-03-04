import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/api/finnhub";

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    // Finnhub quote: { c: current, d: change, dp: changePercent, h, l, o, pc }
    const q = await getQuote(symbol);
    if (!q.c) return NextResponse.json({ current_price: 0 });
    return NextResponse.json({
      current_price: q.c as number,
      change: q.d as number,
      change_percent: q.dp as number,
    });
  } catch (err) {
    console.error("Stock quote error:", err);
    return NextResponse.json({ current_price: 0 }, { status: 500 });
  }
}
