import { NextRequest, NextResponse } from "next/server";
import { getCryptoDetail } from "@/lib/api/coingecko";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await getCryptoDetail(id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Crypto detail API error:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
