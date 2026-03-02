import { NextRequest, NextResponse } from "next/server";
import { getCryptoChart } from "@/lib/api/coingecko";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const days = parseInt(new URL(req.url).searchParams.get("days") ?? "7", 10);

  try {
    const data = await getCryptoChart(id, days);
    const points = data.prices.map(([time, value]: [number, number]) => ({
      time: Math.floor(time / 1000),
      value,
    }));
    return NextResponse.json(points);
  } catch (err) {
    console.error("Chart API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
