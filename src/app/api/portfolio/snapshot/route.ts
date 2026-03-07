import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/portfolio/snapshot?portfolio_id=xxx&days=30
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const portfolioId = searchParams.get("portfolio_id");
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  if (!portfolioId) return NextResponse.json({ error: "portfolio_id required" }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("snapshotted_on, total_value_krw, total_cost_krw, profit_loss_krw, total_value_usd, total_cost_usd, profit_loss_usd")
    .eq("portfolio_id", portfolioId)
    .eq("user_id", user.id)
    .gte("snapshotted_on", since.toISOString().slice(0, 10))
    .order("snapshotted_on", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/portfolio/snapshot - 오늘 스냅샷 저장 (upsert)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    portfolio_id: string;
    total_value_krw: number;
    total_cost_krw: number;
    profit_loss_krw: number;
    total_value_usd: number;
    total_cost_usd: number;
    profit_loss_usd: number;
  };

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .upsert(
      {
        portfolio_id:    body.portfolio_id,
        user_id:         user.id,
        snapshotted_on:  today,
        total_value_krw: body.total_value_krw,
        total_cost_krw:  body.total_cost_krw,
        profit_loss_krw: body.profit_loss_krw,
        total_value_usd: body.total_value_usd,
        total_cost_usd:  body.total_cost_usd,
        profit_loss_usd: body.profit_loss_usd,
      },
      { onConflict: "portfolio_id,snapshotted_on" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
