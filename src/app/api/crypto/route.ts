import { NextRequest, NextResponse } from "next/server";
import { getTopCryptos } from "@/lib/api/coingecko";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  try {
    const data = await getTopCryptos(limit);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Crypto API error:", err);
    return NextResponse.json({ error: "Failed to fetch crypto data" }, { status: 500 });
  }
}
