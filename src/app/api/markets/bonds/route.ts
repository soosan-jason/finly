import { NextResponse } from "next/server";
import { BondYield } from "@/types/market";

const BOND_CONFIG: Omit<BondYield, "yield" | "change" | "lastUpdated">[] = [
  { symbol: "^IRX",       label: "3개월",       maturityMonths: 3,   country: "US" },
  { symbol: "^FVX",       label: "5년",          maturityMonths: 60,  country: "US" },
  { symbol: "^TNX",       label: "10년",         maturityMonths: 120, country: "US" },
  { symbol: "^TYX",       label: "30년",         maturityMonths: 360, country: "US" },
  { symbol: "KR5YT=RR",  label: "한국 5년",    maturityMonths: 60,  country: "KR" },
  { symbol: "KR10YT=RR", label: "한국 10년",   maturityMonths: 120, country: "KR" },
  { symbol: "JP10YT=RR", label: "일본 10년",   maturityMonths: 120, country: "JP" },
  { symbol: "GB10YT=RR", label: "영국 10년",   maturityMonths: 120, country: "GB" },
  { symbol: "FR10YT=RR", label: "프랑스 10년", maturityMonths: 120, country: "FR" },
  { symbol: "DE10YT=RR", label: "독일 10년",   maturityMonths: 120, country: "DE" },
];

// ── Yahoo Finance 인증 크럼 캐시 ──────────────────────────────────────────
let credCache: { crumb: string; cookie: string; expires: number } | null = null;

async function getCredentials(): Promise<{ crumb: string; cookie: string } | null> {
  if (credCache && Date.now() < credCache.expires) {
    return { crumb: credCache.crumb, cookie: credCache.cookie };
  }
  try {
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    // 1) Yahoo Finance 세션 쿠키 획득
    const homeRes = await fetch("https://finance.yahoo.com/", {
      headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
    });
    const setCookie = homeRes.headers.getSetCookie?.() ?? [];
    const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

    // 2) 크럼 획득
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Cookie: cookie },
    });
    if (!crumbRes.ok) return null;
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.startsWith("<")) return null;

    credCache = { crumb, cookie, expires: Date.now() + 30 * 60 * 1000 };
    return { crumb, cookie };
  } catch {
    return null;
  }
}

// ── v8 chart API — ^ CBOE 심볼 전용 ────────────────────────────────────────
async function fetchChart(symbol: string): Promise<{ price: number; change: number; lastUpdated: string } | null> {
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
    const lastUpdated = meta.regularMarketTime
      ? new Date((meta.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

    return { price, change, lastUpdated };
  } catch {
    return null;
  }
}

// ── v7 quote API — =RR Reuters 국제 채권 심볼 전용 (크럼 인증) ─────────────
async function fetchQuote(symbol: string): Promise<{ price: number; change: number; lastUpdated: string } | null> {
  try {
    const creds = await getCredentials();
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    const base = "https://query2.finance.yahoo.com/v7/finance/quote";
    const params = `symbols=${encodeURIComponent(symbol)}${creds ? `&crumb=${encodeURIComponent(creds.crumb)}` : ""}`;
    const url = `${base}?${params}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        ...(creds ? { Cookie: creds.cookie } : {}),
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.quoteResponse?.result?.[0];
    if (!q?.regularMarketPrice) return null;

    const price = q.regularMarketPrice as number;
    const change = (q.regularMarketChange as number) ?? 0;
    const lastUpdated = q.regularMarketTime
      ? new Date((q.regularMarketTime as number) * 1000).toISOString()
      : new Date().toISOString();

    return { price, change, lastUpdated };
  } catch {
    return null;
  }
}

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; lastUpdated: string } | null> {
  return symbol.includes("=RR") ? fetchQuote(symbol) : fetchChart(symbol);
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      BOND_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        return {
          ...cfg,
          yield: quote.price,
          change: quote.change,
          lastUpdated: quote.lastUpdated,
        } satisfies BondYield;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<BondYield>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [...items, ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol))];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Bonds fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: BondYield[] = [
  { symbol: "^IRX",       label: "3개월",       maturityMonths: 3,   yield: 4.35, change: 0.01,  country: "US" },
  { symbol: "^FVX",       label: "5년",          maturityMonths: 60,  yield: 4.25, change: -0.02, country: "US" },
  { symbol: "^TNX",       label: "10년",         maturityMonths: 120, yield: 4.45, change: -0.01, country: "US" },
  { symbol: "^TYX",       label: "30년",         maturityMonths: 360, yield: 4.60, change: 0.00,  country: "US" },
  { symbol: "KR5YT=RR",  label: "한국 5년",    maturityMonths: 60,  yield: 3.15, change: -0.01, country: "KR" },
  { symbol: "KR10YT=RR", label: "한국 10년",   maturityMonths: 120, yield: 3.35, change: -0.02, country: "KR" },
  { symbol: "JP10YT=RR", label: "일본 10년",   maturityMonths: 120, yield: 1.50, change: 0.02,  country: "JP" },
  { symbol: "GB10YT=RR", label: "영국 10년",   maturityMonths: 120, yield: 4.55, change: 0.01,  country: "GB" },
  { symbol: "FR10YT=RR", label: "프랑스 10년", maturityMonths: 120, yield: 3.30, change: -0.01, country: "FR" },
  { symbol: "DE10YT=RR", label: "독일 10년",   maturityMonths: 120, yield: 2.65, change: 0.00,  country: "DE" },
];
