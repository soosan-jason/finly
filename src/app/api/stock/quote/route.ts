import { NextRequest, NextResponse } from "next/server";
import { getQuote } from "@/lib/api/finnhub";

async function fetchYahooQuote(symbol: string): Promise<{ current_price: number; change: number; change_percent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = meta.regularMarketPrice as number;
    const prevClose = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
    const change = price - prevClose;
    const change_percent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    return { current_price: price, change, change_percent };
  } catch {
    return null;
  }
}

function isKoreanStock(symbol: string) {
  return symbol.endsWith(".KS") || symbol.endsWith(".KQ");
}

export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get("symbol")?.trim().toUpperCase();
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    // 한국주식(.KS/.KQ)은 Yahoo Finance 우선
    if (isKoreanStock(symbol)) {
      const yq = await fetchYahooQuote(symbol);
      if (yq && yq.current_price > 0) {
        return NextResponse.json(yq);
      }
    }

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
    // Finnhub 실패 시 Yahoo Finance 재시도
    const yq = await fetchYahooQuote(symbol);
    if (yq && yq.current_price > 0) return NextResponse.json(yq);
    return NextResponse.json({ current_price: 0 }, { status: 500 });
  }
}
