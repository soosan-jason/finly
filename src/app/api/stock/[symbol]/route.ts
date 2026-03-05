import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=30d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });

    const meta = result.meta;
    const price = meta.regularMarketPrice as number;
    const prevClose = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const sparkline = timestamps
      .map((t, i) => ({ t: t * 1000, price: closes[i] }))
      .filter((p) => p.price != null);

    return NextResponse.json({
      symbol: meta.symbol,
      name: meta.shortName ?? meta.longName ?? meta.symbol,
      currency: meta.currency ?? "USD",
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
      price,
      change,
      change_percent: changePercent,
      prev_close: prevClose,
      high: meta.regularMarketDayHigh ?? null,
      low: meta.regularMarketDayLow ?? null,
      open: meta.regularMarketOpen ?? null,
      volume: meta.regularMarketVolume ?? null,
      market_cap: meta.marketCap ?? null,
      sparkline,
    });
  } catch (err) {
    console.error("Stock detail error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
