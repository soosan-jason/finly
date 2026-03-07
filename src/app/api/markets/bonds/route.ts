import { NextResponse } from "next/server";
import { unixToISO } from "@/lib/utils/format";
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

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// ── Yahoo Finance 크럼 캐시 ──────────────────────────────────────────────────
let credCache: { crumb: string; cookie: string; expires: number } | null = null;

async function getCredentials(): Promise<{ crumb: string; cookie: string } | null> {
  if (credCache && Date.now() < credCache.expires) return credCache;
  try {
    // 1) 세션 쿠키 획득
    const homeRes = await fetch("https://finance.yahoo.com/", {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    // getSetCookie() Node 18+; fallback to get()
    let cookieParts: string[] = [];
    if (typeof homeRes.headers.getSetCookie === "function") {
      cookieParts = homeRes.headers.getSetCookie().map((c) => c.split(";")[0]);
    } else {
      const raw = homeRes.headers.get("set-cookie") ?? "";
      cookieParts = raw.split(/,(?=[^ ])/).map((c) => c.split(";")[0].trim());
    }
    const cookie = cookieParts.join("; ");
    if (!cookie) return null;

    // 2) 크럼 획득 (query1 / query2 둘 다 시도)
    for (const host of ["query1", "query2"]) {
      const cr = await fetch(
        `https://${host}.finance.yahoo.com/v1/test/getcrumb`,
        { headers: { "User-Agent": UA, Cookie: cookie } }
      );
      if (!cr.ok) continue;
      const crumb = (await cr.text()).trim();
      if (crumb && !crumb.startsWith("<") && crumb.length <= 20) {
        credCache = { crumb, cookie, expires: Date.now() + 30 * 60_000 };
        return credCache;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── v8 chart API (^ CBOE 심볼) ───────────────────────────────────────────────
async function fetchChart(
  symbol: string
): Promise<{ price: number; change: number; lastUpdated: string } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
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
      ? unixToISO(meta.regularMarketTime)
      : new Date().toISOString();

    return { price, change, lastUpdated };
  } catch {
    return null;
  }
}

// ── v7 quote API (=RR Reuters 심볼, 크럼 인증) ───────────────────────────────
async function fetchQuote(
  symbol: string
): Promise<{ price: number; change: number; lastUpdated: string } | null> {
  const creds = await getCredentials();
  const crumbParam = creds ? `&crumb=${encodeURIComponent(creds.crumb)}` : "";

  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}${crumbParam}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          ...(creds ? { Cookie: creds.cookie } : {}),
        },
        next: { revalidate: 60 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const q = data?.quoteResponse?.result?.[0];
      if (!q?.regularMarketPrice) continue;

      const price = q.regularMarketPrice as number;
      const change = (q.regularMarketChange as number) ?? 0;
      const lastUpdated = q.regularMarketTime
        ? unixToISO(q.regularMarketTime)
        : new Date().toISOString();

      return { price, change, lastUpdated };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchYahooQuote(
  symbol: string
): Promise<{ price: number; change: number; lastUpdated: string } | null> {
  return symbol.includes("=RR") ? fetchQuote(symbol) : fetchChart(symbol);
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      BOND_CONFIG.map(async (cfg) => {
        const quote = await fetchYahooQuote(cfg.symbol);
        if (!quote) return null;
        const prevYield = quote.price - quote.change;
        const changePct = prevYield !== 0 ? (quote.change / prevYield) * 100 : 0;
        return {
          ...cfg,
          yield: quote.price,
          change: quote.change,
          changePct,
          lastUpdated: quote.lastUpdated,
        } satisfies BondYield;
      })
    );

    const items = results
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => (r as PromiseFulfilledResult<BondYield>).value);

    if (items.length === 0) return NextResponse.json(FALLBACK_DATA);

    const symbolSet = new Set(items.map((i) => i.symbol));
    const merged = [
      ...items,
      ...FALLBACK_DATA.filter((f) => !symbolSet.has(f.symbol)),
    ];

    return NextResponse.json(merged, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("Bonds fetch error:", err);
    return NextResponse.json(FALLBACK_DATA);
  }
}

const FALLBACK_DATA: BondYield[] = [
  { symbol: "^IRX",       label: "3개월",       maturityMonths: 3,   yield: 4.20, change: -0.02, changePct: -0.47, country: "US" },
  { symbol: "^FVX",       label: "5년",         maturityMonths: 60,  yield: 3.70, change: -0.01, changePct: -0.27, country: "US" },
  { symbol: "^TNX",       label: "10년",        maturityMonths: 120, yield: 4.12, change: 0.03,  changePct: 0.73,  country: "US" },
  { symbol: "^TYX",       label: "30년",        maturityMonths: 360, yield: 4.75, change: 0.02,  changePct: 0.42,  country: "US" },
  { symbol: "KR5YT=RR",  label: "한국 5년",    maturityMonths: 60,  yield: 3.30, change: 0.02,  changePct: 0.61,  country: "KR" },
  { symbol: "KR10YT=RR", label: "한국 10년",   maturityMonths: 120, yield: 3.65, change: 0.03,  changePct: 0.83,  country: "KR" },
  { symbol: "JP10YT=RR", label: "일본 10년",   maturityMonths: 120, yield: 2.15, change: 0.04,  changePct: 1.90,  country: "JP" },
  { symbol: "GB10YT=RR", label: "영국 10년",   maturityMonths: 120, yield: 4.60, change: 0.05,  changePct: 1.10,  country: "GB" },
  { symbol: "FR10YT=RR", label: "프랑스 10년", maturityMonths: 120, yield: 3.46, change: 0.03,  changePct: 0.87,  country: "FR" },
  { symbol: "DE10YT=RR", label: "독일 10년",   maturityMonths: 120, yield: 2.78, change: 0.03,  changePct: 1.09,  country: "DE" },
];
