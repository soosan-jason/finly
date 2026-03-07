/**
 * GET  /api/admin/search-index          — Vercel Cron 자동 색인 재구축
 * GET  /api/admin/search-index?stats=1  — 색인 통계 조회
 * POST /api/admin/search-index          — 수동 색인 재구축
 *
 * 인증: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cgHeaders } from "@/lib/api/coingecko";
import {
  KOREAN_COINS,
  KOREAN_STOCKS,
  KOREAN_US_STOCKS,
} from "@/lib/search/korean-names";

const BATCH = 500;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

function buildKoMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of [...KOREAN_COINS, ...KOREAN_STOCKS, ...KOREAN_US_STOCKS]) {
    map.set(c.id, c.nameKo);
  }
  return map;
}

// ──────────────────────────────────────────────────────────────
// 공통: 색인 구축 로직
// ──────────────────────────────────────────────────────────────
async function buildIndex() {
  const supabase = createServiceClient();
  const koMap = buildKoMap();

  type Row = {
    id: string; type: string; symbol: string;
    name_en: string; name_ko: string | null;
    image_url: string | null; rank: number | null;
    updated_at: string;
  };

  const rows: Row[] = [];
  const now = new Date().toISOString();

  // 1. CoinGecko top-250 (이미지 + 순위 포함)
  try {
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",
      { headers: cgHeaders(), next: { revalidate: 0 } }
    );
    if (cgRes.ok) {
      const coins = (await cgRes.json()) as Array<{
        id: string; symbol: string; name: string;
        image: string; market_cap_rank: number;
      }>;
      for (const c of coins) {
        rows.push({
          id: c.id, type: "crypto",
          symbol: c.symbol.toUpperCase(),
          name_en: c.name,
          name_ko: koMap.get(c.id) ?? null,
          image_url: c.image ?? null,
          rank: c.market_cap_rank ?? null,
          updated_at: now,
        });
      }
    }
  } catch (e) { console.error("CoinGecko markets:", e); }

  // 2. CoinGecko 전체 코인 목록 (영문 이름 전용)
  try {
    const listRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/list",
      { headers: cgHeaders(), next: { revalidate: 0 } }
    );
    if (listRes.ok) {
      const allCoins = (await listRes.json()) as Array<{
        id: string; symbol: string; name: string;
      }>;
      const existingIds = new Set(rows.map((r) => r.id));
      for (const c of allCoins) {
        if (existingIds.has(c.id)) continue;
        rows.push({
          id: c.id, type: "crypto",
          symbol: c.symbol.toUpperCase(),
          name_en: c.name,
          name_ko: koMap.get(c.id) ?? null,
          image_url: null, rank: null,
          updated_at: now,
        });
      }
    }
  } catch (e) { console.error("CoinGecko list:", e); }

  // 3. 한국 주식 + 미국 주식 (정적 사전)
  const existingIds = new Set(rows.map((r) => r.id));
  for (const s of [...KOREAN_STOCKS, ...KOREAN_US_STOCKS]) {
    if (existingIds.has(s.id)) continue;
    rows.push({
      id: s.id, type: s.type, symbol: s.symbol,
      name_en: s.name, name_ko: s.nameKo,
      image_url: null, rank: null, updated_at: now,
    });
    existingIds.add(s.id);
  }

  // 4. Supabase upsert (배치)
  let upserted = 0;
  let errors = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from("search_index")
      .upsert(rows.slice(i, i + BATCH), { onConflict: "id" });
    if (error) { console.error(`Batch ${i / BATCH}:`, error.message); errors++; }
    else upserted += Math.min(BATCH, rows.length - i);
  }

  return { total: rows.length, upserted, errors };
}

// ──────────────────────────────────────────────────────────────
// GET: Cron(재구축) 또는 stats
// ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("stats") === "1") {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from("search_index")
      .select("*", { count: "exact", head: true });
    const { data: updated } = await supabase
      .from("search_index")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    return NextResponse.json({
      total: count,
      lastUpdated: updated?.[0]?.updated_at ?? null,
    });
  }

  // Cron 호출 → 색인 재구축
  const result = await buildIndex();
  return NextResponse.json({ ok: true, ...result });
}

// ──────────────────────────────────────────────────────────────
// POST: 수동 색인 재구축
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await buildIndex();
  return NextResponse.json({ ok: true, ...result });
}
