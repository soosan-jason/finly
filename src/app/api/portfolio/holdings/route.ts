import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptField, decryptField } from "@/lib/utils/fieldCrypto";

// GET /api/portfolio/holdings?portfolio_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get("portfolio_id");

  let query = supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (portfolioId) query = query.eq("portfolio_id", portfolioId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 복호화하여 반환 (기존 평문 숫자도 안전하게 처리)
  const decrypted = (data ?? []).map((h) => ({
    ...h,
    quantity:      decryptField(h.quantity),
    avg_buy_price: decryptField(h.avg_buy_price),
  }));

  return NextResponse.json(decrypted);
}

// POST /api/portfolio/holdings - 보유 종목 추가
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { portfolio_id, asset_type, symbol, name, image_url, quantity, avg_buy_price, currency } = body;

  // 같은 포트폴리오 내 같은 심볼이 있으면 수량/평단 업데이트 (average down/up)
  const { data: existing } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio_id)
    .eq("symbol", symbol)
    .single();

  if (existing) {
    const existingQty = decryptField(existing.quantity);
    const existingAvg = decryptField(existing.avg_buy_price);
    const totalQty = existingQty + quantity;
    const newAvg = (existingQty * existingAvg + quantity * avg_buy_price) / totalQty;

    const { data, error } = await supabase
      .from("holdings")
      .update({
        quantity:      encryptField(totalQty),
        avg_buy_price: encryptField(newAvg),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      ...data,
      quantity:      totalQty,
      avg_buy_price: newAvg,
    });
  }

  const resolvedCurrency: string =
    currency ||
    (asset_type === "crypto"
      ? "USD"
      : symbol.endsWith(".KS") || symbol.endsWith(".KQ")
      ? "KRW"
      : symbol.endsWith(".T")
      ? "JPY"
      : "USD");

  const { data, error } = await supabase
    .from("holdings")
    .insert({
      user_id:       user.id,
      portfolio_id,
      asset_type,
      symbol,
      name,
      image_url,
      quantity:      encryptField(quantity),
      avg_buy_price: encryptField(avg_buy_price),
      currency:      resolvedCurrency,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { ...data, quantity, avg_buy_price },
    { status: 201 }
  );
}

// DELETE /api/portfolio/holdings?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("holdings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
