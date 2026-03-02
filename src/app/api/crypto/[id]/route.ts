import { NextRequest, NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      { headers: { Accept: "application/json" }, next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error("CoinGecko detail error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Crypto detail API error:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
