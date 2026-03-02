import { NextRequest, NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const days = searchParams.get("days") ?? "7";

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("CoinGecko chart error");

    const data = await res.json();
    // prices: [[timestamp, price], ...]
    const ohlc = data.prices.map(([time, price]: [number, number]) => ({
      time: Math.floor(time / 1000),
      value: price,
    }));
    return NextResponse.json(ohlc);
  } catch (err) {
    console.error("Chart API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
